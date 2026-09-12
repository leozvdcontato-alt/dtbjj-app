-- Professor pode gerenciar alunos apenas por uma RPC controlada.
-- A tabela continua protegida contra escrita direta por Professor.

create or replace function private.salvar_aluno_com_matriculas_gestao(
  p_aluno_id bigint,
  p_nome text,
  p_cpf text,
  p_telefone text,
  p_faixa text,
  p_graus integer,
  p_categoria text,
  p_status text,
  p_turma_ids bigint[]
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_academia_id bigint;
  v_aluno_id bigint;
  v_turma_ids bigint[] := coalesce(p_turma_ids, '{}'::bigint[]);
  v_admin boolean := private.is_admin();
  v_professor boolean := private.current_user_role() like 'professor%';
begin
  if (select auth.uid()) is null then
    raise exception 'Usuário não autenticado' using errcode='42501';
  end if;

  if not (v_admin or v_professor) then
    raise exception 'Sem permissão para gerenciar alunos' using errcode='42501';
  end if;

  v_academia_id := private.current_academia_id();

  if v_academia_id is null then
    raise exception 'Academia do usuário não encontrada' using errcode='42501';
  end if;

  if nullif(trim(coalesce(p_nome, '')), '') is null then
    raise exception 'Nome do aluno é obrigatório' using errcode='22023';
  end if;

  if coalesce(p_status,'') not in ('Ativo','Inativo') then
    raise exception 'Status inválido' using errcode='22023';
  end if;

  if exists (
    select 1
    from unnest(v_turma_ids) selecionada(turma_id)
    where not private.turma_na_academia(selecionada.turma_id)
       or (v_professor and not private.professor_da_turma(selecionada.turma_id))
  ) then
    raise exception 'Uma ou mais turmas não podem ser gerenciadas por este usuário'
      using errcode='42501';
  end if;

  if v_professor and cardinality(v_turma_ids) = 0 and p_aluno_id is null then
    raise exception 'Selecione ao menos uma das suas turmas para o novo aluno'
      using errcode='22023';
  end if;

  if p_aluno_id is null then
    insert into public.alunos (
      nome, cpf, telefone, faixa, graus, categoria, status, academia_id
    )
    values (
      trim(p_nome),
      nullif(trim(coalesce(p_cpf, '')), ''),
      nullif(trim(coalesce(p_telefone, '')), ''),
      p_faixa,
      p_graus,
      p_categoria,
      p_status,
      v_academia_id
    )
    returning id into v_aluno_id;
  else
    if not exists (
      select 1
      from public.alunos a
      where a.id = p_aluno_id
        and a.academia_id = v_academia_id
    ) then
      raise exception 'Aluno não encontrado nesta academia' using errcode='P0002';
    end if;

    if v_professor and not exists (
      select 1
      from public.matriculas m
      where m.aluno_id = p_aluno_id
        and private.professor_da_turma(m.turma_id)
    ) then
      raise exception 'Professor só pode editar alunos das próprias turmas'
        using errcode='42501';
    end if;

    update public.alunos
    set nome = trim(p_nome),
        cpf = nullif(trim(coalesce(p_cpf, '')), ''),
        telefone = nullif(trim(coalesce(p_telefone, '')), ''),
        faixa = p_faixa,
        graus = p_graus,
        categoria = p_categoria,
        status = p_status
    where id = p_aluno_id
      and academia_id = v_academia_id
    returning id into v_aluno_id;
  end if;

  if v_admin then
    delete from public.matriculas
    where aluno_id = v_aluno_id
      and not (turma_id = any(v_turma_ids));
  else
    delete from public.matriculas
    where aluno_id = v_aluno_id
      and private.professor_da_turma(turma_id)
      and not (turma_id = any(v_turma_ids));
  end if;

  insert into public.matriculas (aluno_id, turma_id)
  select v_aluno_id, turma_id
  from (select distinct unnest(v_turma_ids) turma_id) s
  on conflict (aluno_id, turma_id) do nothing;

  return v_aluno_id;
end;
$$;

revoke all on function private.salvar_aluno_com_matriculas_gestao(
  bigint,text,text,text,text,integer,text,text,bigint[]
) from public, anon;
grant execute on function private.salvar_aluno_com_matriculas_gestao(
  bigint,text,text,text,text,integer,text,text,bigint[]
) to authenticated;

create or replace function public.salvar_aluno_com_matriculas(
  p_aluno_id bigint,
  p_nome text,
  p_cpf text,
  p_telefone text,
  p_faixa text,
  p_graus integer,
  p_categoria text,
  p_status text,
  p_turma_ids bigint[]
)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  select private.salvar_aluno_com_matriculas_gestao(
    p_aluno_id,
    p_nome,
    p_cpf,
    p_telefone,
    p_faixa,
    p_graus,
    p_categoria,
    p_status,
    p_turma_ids
  );
$$;

revoke execute on function public.salvar_aluno_com_matriculas(
  bigint,text,text,text,text,integer,text,text,bigint[]
) from public, anon;
grant execute on function public.salvar_aluno_com_matriculas(
  bigint,text,text,text,text,integer,text,text,bigint[]
) to authenticated;

do $$
declare
  v_academia_id bigint;
  v_local_id bigint;
  v_turma_id bigint;
begin
  select id into v_academia_id
  from public.academias
  order by id
  limit 1;

  if v_academia_id is null then
    raise exception 'Academia não encontrada';
  end if;

  select id into v_local_id
  from public.locais
  where academia_id = v_academia_id
    and nome = 'Ministério Êxodo'
  limit 1;

  if v_local_id is null then
    insert into public.locais (academia_id, nome, ativo)
    values (v_academia_id, 'Ministério Êxodo', true)
    returning id into v_local_id;
  end if;

  select id into v_turma_id
  from public.turmas
  where academia_id = v_academia_id
    and nome = 'Projeto Social Ministério Êxodo'
  limit 1;

  if v_turma_id is null then
    insert into public.turmas (
      nome, horario, professor, dias, academia_id, codigo_convite, local_id
    )
    values (
      'Projeto Social Ministério Êxodo',
      '18:00',
      null,
      'Sexta-feira',
      v_academia_id,
      'DT-EXODO',
      v_local_id
    )
    returning id into v_turma_id;
  else
    update public.turmas
    set horario = '18:00',
        dias = 'Sexta-feira',
        local_id = v_local_id
    where id = v_turma_id;
  end if;

  insert into public.turma_horarios (turma_id, dia_semana, horario_inicio)
  select v_turma_id, 5, time '18:00'
  where not exists (
    select 1
    from public.turma_horarios
    where turma_id = v_turma_id
      and dia_semana = 5
      and horario_inicio = time '18:00'
  );
end $$;
