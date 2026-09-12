-- Complemento da grade oficial e sincronização do rótulo de professores.
-- Mantém o banco reproduzível em novos ambientes.

update public.turmas set dias='Seg • Qua', horario='20h' where id=1;
delete from public.turma_horarios where turma_id=1;
insert into public.turma_horarios (turma_id,dia_semana,horario_inicio)
values (1,1,'20:00'),(1,3,'20:00');

update public.turmas set dias='Ter • Qui', horario='19h' where id=2;
delete from public.turma_horarios where turma_id=2;
insert into public.turma_horarios (turma_id,dia_semana,horario_inicio)
values (2,2,'19:00'),(2,4,'19:00');

update public.turmas set horario='08h/09h/15h/19h', dias='Seg • Qua • Sex' where id=3;
update public.turmas set horario='18h', dias='Seg • Qua • Sex' where id=4;

update public.turmas
set nome='CT Dream Team / Cubango',
    dias='Seg • Qua • Sex / Ter • Qui / Sáb',
    horario='06h / 20h / 20h30 / Sáb 07h30 e 10h'
where id=5;

delete from public.turma_horarios where turma_id=5;
insert into public.turma_horarios (turma_id,dia_semana,horario_inicio)
values
  (5,1,'06:00'),(5,3,'06:00'),(5,5,'06:00'),
  (5,1,'20:00'),(5,3,'20:00'),(5,5,'20:00'),
  (5,2,'20:30'),(5,4,'20:30'),
  (5,6,'07:30'),(5,6,'10:00');

update public.turmas
set nome='Projeto Social Ministério Êxodo', dias='Sex', horario='18h / 19h'
where id=7;

delete from public.turma_horarios where turma_id=7;
insert into public.turma_horarios (turma_id,dia_semana,horario_inicio)
values (7,5,'18:00'),(7,5,'19:00');

delete from public.turma_professores;

create or replace function private.chamada_na_academia(p_chamada_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.chamadas c
    left join public.turmas t on t.id = c.turma_id
    left join public.aulas_extras ae on ae.id = c.aula_extra_id
    where c.id = p_chamada_id
      and coalesce(t.academia_id, ae.academia_id) = private.current_academia_id()
  );
$$;

create or replace function public.listar_alunos_aula_extra()
returns table(id bigint,nome text,faixa text,graus integer,status text,categoria text)
language sql
security definer
set search_path = ''
as $$
  select a.id,a.nome,a.faixa,a.graus,a.status,a.categoria
  from public.alunos a
  where a.academia_id = private.current_academia_id()
    and a.status = 'Ativo'
    and private.is_manager()
  order by a.nome;
$$;

revoke all on function public.listar_alunos_aula_extra() from public, anon;
grant execute on function public.listar_alunos_aula_extra() to authenticated, service_role;

create or replace function public.abrir_aula_extra(p_nome text,p_local_id bigint,p_horario time)
returns table(aula_extra_id bigint,chamada_id bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_academia_id bigint;
  v_usuario_id uuid;
  v_nome_professor text;
  v_data date;
  v_aula_id bigint;
  v_chamada_id bigint;
begin
  if not private.is_manager() then
    raise exception 'Sem permissão para abrir aula extra' using errcode='42501';
  end if;

  v_academia_id := private.current_academia_id();
  v_usuario_id := private.current_usuario_id();
  v_data := timezone('America/Sao_Paulo', now())::date;

  select u.nome into v_nome_professor
  from public.usuarios u
  where u.id=v_usuario_id and u.academia_id=v_academia_id and u.status='Ativo';

  if v_nome_professor is null then
    raise exception 'Professor inválido' using errcode='42501';
  end if;

  if not exists (
    select 1 from public.locais l
    where l.id=p_local_id and l.academia_id=v_academia_id and l.ativo=true
  ) then
    raise exception 'Local inválido' using errcode='42501';
  end if;

  insert into public.aulas_extras (
    academia_id,nome,local_id,data,horario,professor_usuario_id,professor_nome
  )
  values (
    v_academia_id,coalesce(nullif(trim(p_nome),''),'Aula extra'),
    p_local_id,v_data,p_horario,v_usuario_id,v_nome_professor
  )
  returning id into v_aula_id;

  insert into public.chamadas (
    turma_id,data,horario,professor,horario_id,aula_extra_id,local_id
  )
  values (
    null,v_data,to_char(p_horario,'HH24:MI'),v_nome_professor,null,v_aula_id,p_local_id
  )
  returning id into v_chamada_id;

  return query select v_aula_id,v_chamada_id;
end;
$$;

revoke all on function public.abrir_aula_extra(text,bigint,time) from public, anon;
grant execute on function public.abrir_aula_extra(text,bigint,time) to authenticated, service_role;

create or replace function public.salvar_presencas_aula_extra(
  p_chamada_id bigint,p_aluno_ids bigint[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_academia_id bigint;
begin
  if not private.is_manager() then
    raise exception 'Sem permissão para registrar presença' using errcode='42501';
  end if;

  v_academia_id := private.current_academia_id();

  if not exists (
    select 1 from public.chamadas c
    join public.aulas_extras ae on ae.id=c.aula_extra_id
    where c.id=p_chamada_id and ae.academia_id=v_academia_id
  ) then
    raise exception 'Aula extra inválida' using errcode='42501';
  end if;

  delete from public.presencas where chamada_id=p_chamada_id;

  insert into public.presencas (chamada_id,aluno_id)
  select p_chamada_id, distinct_id
  from (
    select distinct unnest(coalesce(p_aluno_ids,'{}'::bigint[])) distinct_id
  ) x
  join public.alunos a on a.id=x.distinct_id
  where a.academia_id=v_academia_id and a.status='Ativo';
end;
$$;

revoke all on function public.salvar_presencas_aula_extra(bigint,bigint[]) from public, anon;
grant execute on function public.salvar_presencas_aula_extra(bigint,bigint[]) to authenticated, service_role;

create or replace function private.sincronizar_professores_turma()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_turma_id bigint;
begin
  v_turma_id := coalesce(new.turma_id, old.turma_id);

  update public.turmas t
  set professor = (
    select string_agg(u.nome, ', ' order by u.nome)
    from public.turma_professores tp
    join public.usuarios u on u.id=tp.usuario_id
    where tp.turma_id=v_turma_id
  )
  where t.id=v_turma_id;

  return coalesce(new,old);
end;
$$;

drop trigger if exists trg_sincronizar_professores_turma on public.turma_professores;
create trigger trg_sincronizar_professores_turma
after insert or update or delete on public.turma_professores
for each row execute function private.sincronizar_professores_turma();
