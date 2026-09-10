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
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_academia_id bigint;
  v_aluno_id bigint;
  v_turma_ids bigint[] := coalesce(p_turma_ids, '{}'::bigint[]);
begin
  if not private.is_manager() then
    raise exception 'Sem permissão para gerenciar alunos'
      using errcode = '42501';
  end if;

  v_academia_id := private.current_academia_id();

  if v_academia_id is null then
    raise exception 'Usuário sem academia válida'
      using errcode = '42501';
  end if;

  if nullif(trim(coalesce(p_nome, '')), '') is null then
    raise exception 'Nome do aluno é obrigatório'
      using errcode = '22023';
  end if;

  if p_graus is null or p_graus < 0 or p_graus > 4 then
    raise exception 'Quantidade de graus inválida'
      using errcode = '22023';
  end if;

  if p_status not in ('Ativo', 'Inativo') then
    raise exception 'Status inválido'
      using errcode = '22023';
  end if;

  if p_categoria not in ('Kids', 'Juvenil', 'Adulto') then
    raise exception 'Categoria inválida'
      using errcode = '22023';
  end if;

  if p_faixa not in (
    'Branca',
    'Cinza e Branca',
    'Cinza',
    'Cinza e Preta',
    'Amarela e Branca',
    'Amarela',
    'Amarela e Preta',
    'Laranja e Branca',
    'Laranja',
    'Laranja e Preta',
    'Verde e Branca',
    'Verde',
    'Verde e Preta',
    'Azul',
    'Roxa',
    'Marrom',
    'Preta'
  ) then
    raise exception 'Faixa inválida'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(v_turma_ids) as selecionada(turma_id)
    where not private.turma_na_academia(selecionada.turma_id)
  ) then
    raise exception 'Uma ou mais turmas não pertencem à academia do usuário'
      using errcode = '42501';
  end if;

  if p_aluno_id is null then
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
    update public.alunos
    set
      nome = trim(p_nome),
      cpf = nullif(trim(coalesce(p_cpf, '')), ''),
      telefone = nullif(trim(coalesce(p_telefone, '')), ''),
      faixa = p_faixa,
      graus = p_graus,
      categoria = p_categoria,
      status = p_status
    where id = p_aluno_id
      and academia_id = v_academia_id
    returning id into v_aluno_id;

    if v_aluno_id is null then
      raise exception 'Aluno não encontrado nesta academia'
        using errcode = 'P0002';
    end if;
  end if;

  delete from public.matriculas
  where aluno_id = v_aluno_id
    and not (turma_id = any(v_turma_ids));

  insert into public.matriculas (aluno_id, turma_id)
  select v_aluno_id, selecionada.turma_id
  from (
    select distinct unnest(v_turma_ids) as turma_id
  ) as selecionada
  on conflict (aluno_id, turma_id) do nothing;

  return v_aluno_id;
end;
$$;

revoke all on function public.salvar_aluno_com_matriculas(
  bigint,
  text,
  text,
  text,
  text,
  integer,
  text,
  text,
  bigint[]
) from public;

grant execute on function public.salvar_aluno_com_matriculas(
  bigint,
  text,
  text,
  text,
  text,
  integer,
  text,
  text,
  bigint[]
) to authenticated;
