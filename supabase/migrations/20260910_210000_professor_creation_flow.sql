create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_academia_id bigint;
  v_nome text;
  v_cpf text;
  v_telefone text;
  v_codigo_turma text;
  v_turma_id bigint;
  v_aluno_id bigint;
  v_role text;
begin
  v_nome := nullif(trim(coalesce(new.raw_user_meta_data ->> 'nome', '')), '');
  v_cpf := nullif(trim(coalesce(new.raw_user_meta_data ->> 'cpf', '')), '');
  v_telefone := nullif(trim(coalesce(new.raw_user_meta_data ->> 'telefone', '')), '');
  v_role := nullif(trim(coalesce(new.raw_app_meta_data ->> 'dtbjj_role', '')), '');

  if v_role = 'Professor' then
    begin
      v_academia_id := (new.raw_app_meta_data ->> 'academia_id')::bigint;
    exception when others then
      v_academia_id := null;
    end;

    if v_nome is null then
      v_nome := split_part(coalesce(new.email, 'Professor'), '@', 1);
    end if;

    if v_academia_id is null or not exists (
      select 1
      from public.academias a
      where a.id = v_academia_id
        and a.status = 'Ativa'
    ) then
      raise exception 'Academia inválida para criação de professor';
    end if;

    insert into public.usuarios (
      auth_id, nome, email, cargo, telefone, cpf, status, academia_id, aluno_id
    )
    values (
      new.id, v_nome, lower(new.email), 'Professor', v_telefone, v_cpf,
      'Ativo', v_academia_id, null
    )
    on conflict (auth_id) do nothing;

    return new;
  end if;

  if new.invited_at is not null then
    begin
      v_academia_id := (new.raw_user_meta_data ->> 'academia_id')::bigint;
    exception when others then
      v_academia_id := null;
    end;

    if v_nome is null then
      v_nome := split_part(coalesce(new.email, 'Professor'), '@', 1);
    end if;

    if v_academia_id is null or not exists (
      select 1
      from public.academias a
      where a.id = v_academia_id
        and a.status = 'Ativa'
    ) then
      raise exception 'Academia inválida para convite de professor';
    end if;

    insert into public.usuarios (
      auth_id, nome, email, cargo, telefone, cpf, status, academia_id, aluno_id
    )
    values (
      new.id, v_nome, lower(new.email), 'Professor', v_telefone, v_cpf,
      'Ativo', v_academia_id, null
    )
    on conflict (auth_id) do nothing;

    return new;
  end if;

  v_codigo_turma := nullif(trim(coalesce(new.raw_user_meta_data ->> 'codigo_turma', '')), '');

  if v_nome is null then
    raise exception 'Nome obrigatório para criar perfil';
  end if;

  if v_codigo_turma is null then
    raise exception 'Código da turma obrigatório';
  end if;

  select t.id, t.academia_id
  into v_turma_id, v_academia_id
  from public.turmas t
  join public.academias a on a.id = t.academia_id
  where upper(t.codigo_convite) = upper(v_codigo_turma)
    and a.status = 'Ativa'
  limit 1;

  if v_turma_id is null or v_academia_id is null then
    raise exception 'Código da turma inválido';
  end if;

  if v_cpf is not null then
    select a.id
    into v_aluno_id
    from public.alunos a
    where a.academia_id = v_academia_id
      and regexp_replace(coalesce(a.cpf, ''), '\D', '', 'g')
          = regexp_replace(v_cpf, '\D', '', 'g')
      and not exists (
        select 1 from public.usuarios u where u.aluno_id = a.id
      )
    limit 1;
  end if;

  if v_aluno_id is null then
    insert into public.alunos (
      nome, cpf, telefone, faixa, graus, categoria, status, academia_id
    )
    values (
      v_nome, v_cpf, v_telefone, 'Branca', 0, 'Adulto', 'Ativo', v_academia_id
    )
    returning id into v_aluno_id;
  else
    update public.alunos
    set nome = v_nome,
        cpf = coalesce(v_cpf, cpf),
        telefone = coalesce(v_telefone, telefone)
    where id = v_aluno_id;
  end if;

  insert into public.usuarios (
    auth_id, nome, email, cargo, telefone, cpf, status, academia_id, aluno_id
  )
  values (
    new.id, v_nome, lower(new.email), 'Aluno', v_telefone, v_cpf,
    'Ativo', v_academia_id, v_aluno_id
  )
  on conflict (auth_id) do nothing;

  insert into public.matriculas (aluno_id, turma_id)
  values (v_aluno_id, v_turma_id)
  on conflict (aluno_id, turma_id) do nothing;

  return new;
end;
$$;

create or replace function public.definir_turmas_professor(
  p_usuario_id uuid,
  p_turma_ids bigint[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_academia_id bigint;
  v_turma_ids bigint[] := coalesce(p_turma_ids, '{}'::bigint[]);
begin
  if not private.is_admin() then
    raise exception 'Sem permissão para definir turmas do professor'
      using errcode = '42501';
  end if;

  v_academia_id := private.current_academia_id();

  if not exists (
    select 1
    from public.usuarios u
    where u.id = p_usuario_id
      and u.academia_id = v_academia_id
      and u.cargo = 'Professor'
  ) then
    raise exception 'Professor não encontrado nesta academia'
      using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from unnest(v_turma_ids) selecionada(turma_id)
    where not private.turma_na_academia(selecionada.turma_id)
  ) then
    raise exception 'Uma ou mais turmas não pertencem à academia'
      using errcode = '42501';
  end if;

  delete from public.turma_professores
  where usuario_id = p_usuario_id;

  insert into public.turma_professores (turma_id, usuario_id)
  select distinct turma_id, p_usuario_id
  from unnest(v_turma_ids) turma_id;
end;
$$;

revoke all on function public.definir_turmas_professor(uuid, bigint[]) from public, anon;
grant execute on function public.definir_turmas_professor(uuid, bigint[]) to authenticated;
