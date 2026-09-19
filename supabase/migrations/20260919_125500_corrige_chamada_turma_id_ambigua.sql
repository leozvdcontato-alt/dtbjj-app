create or replace function public.abrir_chamada_grade(p_horario_id bigint)
returns table(chamada_id bigint, turma_id bigint, horario_id bigint, professor text)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_agora timestamp;
  v_data date;
  v_turma_id bigint;
  v_dia smallint;
  v_professor text;
  v_chamada_id bigint;
begin
  if not private.is_manager() then
    raise exception 'Sem permissão para abrir chamada' using errcode='42501';
  end if;

  v_agora := timezone('America/Sao_Paulo', now());
  v_data := v_agora::date;
  v_dia := extract(dow from v_agora)::smallint;

  select th.turma_id, coalesce(th.professor, 'Professor indisponível ainda')
  into v_turma_id, v_professor
  from public.turma_horarios th
  join public.turmas t on t.id = th.turma_id
  where th.id = p_horario_id
    and th.dia_semana = v_dia
    and t.academia_id = private.current_academia_id();

  if v_turma_id is null then
    raise exception 'Este horário não pertence à grade de hoje'
      using errcode='42501';
  end if;

  if not private.is_admin() and not private.professor_do_horario(p_horario_id) then
    raise exception 'Professor não vinculado a este horário'
      using errcode='42501';
  end if;

  select c.id
  into v_chamada_id
  from public.chamadas c
  where c.turma_id = v_turma_id
    and c.data = v_data
    and c.horario_id = p_horario_id
  limit 1;

  if v_chamada_id is null then
    insert into public.chamadas as c (
      turma_id, data, horario, professor, horario_id
    )
    values (
      v_turma_id,
      v_data,
      to_char(v_agora, 'HH24:MI'),
      v_professor,
      p_horario_id
    )
    returning c.id into v_chamada_id;
  else
    update public.chamadas as c
    set horario = to_char(v_agora, 'HH24:MI'),
        professor = v_professor
    where c.id = v_chamada_id;
  end if;

  return query
  select v_chamada_id, v_turma_id, p_horario_id, v_professor;
end;
$function$;
