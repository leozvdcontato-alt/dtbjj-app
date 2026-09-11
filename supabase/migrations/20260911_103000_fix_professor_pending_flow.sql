create table if not exists public.professor_criacoes_pendentes (
  token uuid primary key,
  email text not null,
  nome text not null,
  academia_id bigint not null references public.academias(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.professor_criacoes_pendentes enable row level security;

revoke all on table public.professor_criacoes_pendentes from anon, authenticated;
grant all on table public.professor_criacoes_pendentes to service_role;

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
  v_professor_token uuid;
begin
  v_nome := nullif(trim(coalesce(new.raw_user_meta_data ->> 'nome', '')), '');
  v_cpf := nullif(trim(coalesce(new.raw_user_meta_data ->> 'cpf', '')), '');
  v_telefone := nullif(trim(coalesce(new.raw_user_meta_data ->> 'telefone', '')), '');

  begin
    v_professor_token := nullif(
      trim(coalesce(new.raw_user_meta_data ->> 'dtbjj_professor_token', '')),
      ''
    )::uuid;
  exception when others then
    v_professor_token := null;
  end;

  if v_professor_token is not null then
    select p.academia_id, p.nome
    into v_academia_id, v_nome
    from public.professor_criacoes_pendentes p
    where p.token = v_professor_token
      and lower(p.email) = lower(new.email)
      and p.expires_at > now()
    limit 1;

    if v_academia_id is null then
      raise exception 'Criação de professor não autorizada';
    end if;

    insert into public.usuarios (
      auth_id,
      nome,
      email,
      cargo,
      telefone,
      cpf,
      status,
      academia_id,
      aluno_id
    )
    values (
      new.id,
      v_nome,
      lower(new.email),
      'Professor',
      null,
      null,
      'Ativo',
      v_academia_id,
      null
    )
    on conflict (auth_id) do update
    set
      nome = excluded.nome,
      email = excluded.email,
      cargo = 'Professor',
      status = 'Ativo',
      academia_id = excluded.academia_id,
      aluno_id = null;

    delete from public.professor_criacoes_pendentes
    where token = v_professor_token;

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
      auth_id,
      nome,
      email,
      cargo,
      telefone,
      cpf,
      status,
      academia_id,
      aluno_id
    )
    values (
      new.id,
      v_nome,
      lower(new.email),
      'Professor',
      v_telefone,
      v_cpf,
      'Ativo',
      v_academia_id,
      null
    )
    on conflict (auth_id) do nothing;

    return new;
  end if;

  v_codigo_turma := nullif(
    trim(coalesce(new.raw_user_meta_data ->> 'codigo_turma', '')),
    ''
  );

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
        select 1
        from public.usuarios u
        where u.aluno_id = a.id
      )
    limit 1;
  end if;

  if v_aluno_id is null then
    insert into public.alunos (
      nome,
      cpf,
      telefone,
      faixa,
      graus,
      categoria,
      status,
      academia_id
    )
    values (
      v_nome,
      v_cpf,
      v_telefone,
      'Branca',
      0,
      'Adulto',
      'Ativo',
      v_academia_id
    )
    returning id into v_aluno_id;
  else
    update public.alunos
    set
      nome = v_nome,
      cpf = coalesce(v_cpf, cpf),
      telefone = coalesce(v_telefone, telefone)
    where id = v_aluno_id;
  end if;

  insert into public.usuarios (
    auth_id,
    nome,
    email,
    cargo,
    telefone,
    cpf,
    status,
    academia_id,
    aluno_id
  )
  values (
    new.id,
    v_nome,
    lower(new.email),
    'Aluno',
    v_telefone,
    v_cpf,
    'Ativo',
    v_academia_id,
    v_aluno_id
  )
  on conflict (auth_id) do nothing;

  insert into public.matriculas (aluno_id, turma_id)
  values (v_aluno_id, v_turma_id)
  on conflict (aluno_id, turma_id) do nothing;

  return new;
end;
$$;
