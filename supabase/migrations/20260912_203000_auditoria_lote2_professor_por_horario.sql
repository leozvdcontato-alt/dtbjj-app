-- Auditoria lote 2: professor passa a ser vinculado ao horário da turma.

alter table public.turma_horarios
  add column if not exists professor text;

create table if not exists public.turma_horario_professores (
  horario_id bigint not null references public.turma_horarios(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (horario_id, usuario_id)
);

create index if not exists turma_horario_professores_usuario_idx
  on public.turma_horario_professores(usuario_id);

alter table public.turma_horario_professores enable row level security;

drop policy if exists turma_horario_professores_select on public.turma_horario_professores;
create policy turma_horario_professores_select
on public.turma_horario_professores for select
to authenticated
using (
  private.is_admin()
  or usuario_id = private.current_usuario_id()
);

drop policy if exists turma_horario_professores_admin_write on public.turma_horario_professores;
create policy turma_horario_professores_admin_write
on public.turma_horario_professores for all
to authenticated
using (
  private.is_admin()
  and exists (
    select 1
    from public.turma_horarios th
    join public.turmas t on t.id = th.turma_id
    where th.id = horario_id
      and t.academia_id = private.current_academia_id()
  )
)
with check (
  private.is_admin()
  and exists (
    select 1
    from public.turma_horarios th
    join public.turmas t on t.id = th.turma_id
    where th.id = horario_id
      and t.academia_id = private.current_academia_id()
  )
);

create or replace function private.professor_do_horario(p_horario_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.turma_horario_professores thp
    join public.usuarios u on u.id = thp.usuario_id
    where thp.horario_id = p_horario_id
      and u.auth_id = (select auth.uid())
      and u.cargo = 'Professor'
      and u.status = 'Ativo'
  );
$$;

create or replace function private.professor_da_turma(p_turma_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.turma_horarios th
    join public.turma_horario_professores thp on thp.horario_id = th.id
    join public.usuarios u on u.id = thp.usuario_id
    where th.turma_id = p_turma_id
      and u.auth_id = (select auth.uid())
      and u.cargo = 'Professor'
      and u.status = 'Ativo'
  );
$$;

create or replace function private.sincronizar_horario_professores()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_horario_id bigint;
  v_turma_id bigint;
begin
  v_horario_id := coalesce(new.horario_id, old.horario_id);

  select th.turma_id
  into v_turma_id
  from public.turma_horarios th
  where th.id = v_horario_id;

  if v_turma_id is null then
    return coalesce(new, old);
  end if;

  update public.turma_horarios th
  set professor = (
    select string_agg(u.nome, ', ' order by u.nome)
    from public.turma_horario_professores thp
    join public.usuarios u on u.id = thp.usuario_id
    where thp.horario_id = v_horario_id
  )
  where th.id = v_horario_id;

  delete from public.turma_professores tp
  where tp.turma_id = v_turma_id;

  insert into public.turma_professores (turma_id, usuario_id)
  select distinct v_turma_id, thp.usuario_id
  from public.turma_horarios th
  join public.turma_horario_professores thp on thp.horario_id = th.id
  where th.turma_id = v_turma_id
  on conflict do nothing;

  update public.turmas t
  set professor = (
    select string_agg(distinct u.nome, ', ' order by u.nome)
    from public.turma_horarios th
    join public.turma_horario_professores thp on thp.horario_id = th.id
    join public.usuarios u on u.id = thp.usuario_id
    where th.turma_id = v_turma_id
  )
  where t.id = v_turma_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sincronizar_horario_professores
on public.turma_horario_professores;

create trigger trg_sincronizar_horario_professores
after insert or update or delete on public.turma_horario_professores
for each row execute function private.sincronizar_horario_professores();

create or replace function public.definir_horarios_professor(
  p_usuario_id uuid,
  p_horario_ids bigint[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_academia_id bigint;
  v_horario_ids bigint[] := coalesce(p_horario_ids, '{}'::bigint[]);
begin
  if not private.is_admin() then
    raise exception 'Sem permissão para definir horários do professor'
      using errcode='42501';
  end if;

  v_academia_id := private.current_academia_id();

  if not exists (
    select 1
    from public.usuarios u
    where u.id = p_usuario_id
      and u.academia_id = v_academia_id
      and u.cargo = 'Professor'
      and u.status = 'Ativo'
  ) then
    raise exception 'Professor não encontrado nesta academia'
      using errcode='P0002';
  end if;

  if exists (
    select 1
    from unnest(v_horario_ids) x(horario_id)
    where not exists (
      select 1
      from public.turma_horarios th
      join public.turmas t on t.id = th.turma_id
      where th.id = x.horario_id
        and t.academia_id = v_academia_id
    )
  ) then
    raise exception 'Um ou mais horários não pertencem à academia'
      using errcode='42501';
  end if;

  delete from public.turma_horario_professores thp
  using public.turma_horarios th, public.turmas t
  where thp.horario_id = th.id
    and th.turma_id = t.id
    and t.academia_id = v_academia_id
    and thp.usuario_id = p_usuario_id;

  insert into public.turma_horario_professores (horario_id, usuario_id)
  select distinct x.horario_id, p_usuario_id
  from unnest(v_horario_ids) x(horario_id)
  on conflict do nothing;
end;
$$;

revoke all on function public.definir_horarios_professor(uuid,bigint[]) from public, anon;
grant execute on function public.definir_horarios_professor(uuid,bigint[]) to authenticated, service_role;

create or replace function public.definir_turmas_professor(
  p_usuario_id uuid,
  p_turma_ids bigint[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_horario_ids bigint[];
begin
  select coalesce(array_agg(th.id), '{}'::bigint[])
  into v_horario_ids
  from public.turma_horarios th
  where th.turma_id = any(coalesce(p_turma_ids, '{}'::bigint[]));

  perform public.definir_horarios_professor(p_usuario_id, v_horario_ids);
end;
$$;

revoke all on function public.definir_turmas_professor(uuid,bigint[]) from public, anon;
grant execute on function public.definir_turmas_professor(uuid,bigint[]) to authenticated, service_role;

-- A tabela antiga vira somente um agregado de compatibilidade.
drop policy if exists turma_professores_admin_write on public.turma_professores;

create or replace function public.abrir_chamada_grade(p_horario_id bigint)
returns table(
  chamada_id bigint,
  turma_id bigint,
  horario_id bigint,
  professor text
)
language plpgsql
security definer
set search_path = ''
as $$
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

  insert into public.chamadas (
    turma_id, data, horario, professor, horario_id
  )
  values (
    v_turma_id,
    v_data,
    to_char(v_agora, 'HH24:MI'),
    v_professor,
    p_horario_id
  )
  on conflict (turma_id, data, horario_id)
    where horario_id is not null
  do update
    set horario = excluded.horario,
        professor = excluded.professor
  returning id into v_chamada_id;

  return query
  select v_chamada_id, v_turma_id, p_horario_id, v_professor;
end;
$$;

revoke all on function public.abrir_chamada_grade(bigint) from public, anon;
grant execute on function public.abrir_chamada_grade(bigint) to authenticated, service_role;

drop policy if exists chamadas_insert_gestao on public.chamadas;
create policy chamadas_insert_gestao
on public.chamadas for insert
to authenticated
with check (
  aula_extra_id is null
  and horario_id is not null
  and exists (
    select 1 from public.turma_horarios th
    where th.id = horario_id
      and th.turma_id = turma_id
  )
  and (
    (private.is_admin() and private.turma_na_academia(turma_id))
    or private.professor_do_horario(horario_id)
  )
);

drop policy if exists chamadas_select_por_papel on public.chamadas;
create policy chamadas_select_por_papel
on public.chamadas for select
to authenticated
using (
  (
    turma_id is not null
    and (
      (private.is_admin() and private.turma_na_academia(turma_id))
      or private.professor_do_horario(horario_id)
      or private.aluno_matriculado_na_turma(turma_id)
    )
  )
);

drop policy if exists chamadas_update_gestao on public.chamadas;
create policy chamadas_update_gestao
on public.chamadas for update
to authenticated
using (
  aula_extra_id is null
  and (
    (private.is_admin() and private.turma_na_academia(turma_id))
    or private.professor_do_horario(horario_id)
  )
)
with check (
  aula_extra_id is null
  and (
    (private.is_admin() and private.turma_na_academia(turma_id))
    or private.professor_do_horario(horario_id)
  )
);

drop policy if exists chamadas_delete_gestao on public.chamadas;
create policy chamadas_delete_gestao
on public.chamadas for delete
to authenticated
using (
  aula_extra_id is null
  and (
    (private.is_admin() and private.turma_na_academia(turma_id))
    or private.professor_do_horario(horario_id)
  )
);

drop policy if exists presencas_insert_gestao on public.presencas;
create policy presencas_insert_gestao
on public.presencas for insert
to authenticated
with check (
  (
    private.is_admin()
    and private.aluno_na_academia(aluno_id)
    and private.chamada_na_academia(chamada_id)
  )
  or exists (
    select 1
    from public.chamadas c
    where c.id = chamada_id
      and private.professor_do_horario(c.horario_id)
  )
);

drop policy if exists presencas_select_por_papel on public.presencas;
create policy presencas_select_por_papel
on public.presencas for select
to authenticated
using (
  aluno_id = private.current_aluno_id()
  or (
    private.is_admin()
    and private.aluno_na_academia(aluno_id)
    and private.chamada_na_academia(chamada_id)
  )
  or exists (
    select 1
    from public.chamadas c
    where c.id = chamada_id
      and private.professor_do_horario(c.horario_id)
  )
);

drop policy if exists presencas_update_gestao on public.presencas;
create policy presencas_update_gestao
on public.presencas for update
to authenticated
using (
  (
    private.is_admin()
    and private.aluno_na_academia(aluno_id)
    and private.chamada_na_academia(chamada_id)
  )
  or exists (
    select 1
    from public.chamadas c
    where c.id = chamada_id
      and private.professor_do_horario(c.horario_id)
  )
)
with check (
  (
    private.is_admin()
    and private.aluno_na_academia(aluno_id)
    and private.chamada_na_academia(chamada_id)
  )
  or exists (
    select 1
    from public.chamadas c
    where c.id = chamada_id
      and private.professor_do_horario(c.horario_id)
  )
);

drop policy if exists presencas_delete_gestao on public.presencas;
create policy presencas_delete_gestao
on public.presencas for delete
to authenticated
using (
  (
    private.is_admin()
    and private.aluno_na_academia(aluno_id)
    and private.chamada_na_academia(chamada_id)
  )
  or exists (
    select 1
    from public.chamadas c
    where c.id = chamada_id
      and private.professor_do_horario(c.horario_id)
  )
);

grant select on public.turma_horario_professores to authenticated;
