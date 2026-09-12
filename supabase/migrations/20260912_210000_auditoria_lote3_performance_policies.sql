-- Auditoria lote 3: índices e redução de policies permissivas duplicadas.

create index if not exists aulas_extras_local_id_idx
  on public.aulas_extras(local_id);
create index if not exists aulas_extras_professor_usuario_id_idx
  on public.aulas_extras(professor_usuario_id);
create index if not exists chamadas_horario_id_idx
  on public.chamadas(horario_id);
create index if not exists chamadas_local_id_idx
  on public.chamadas(local_id);
create index if not exists checkins_horario_id_idx
  on public.checkins(horario_id);
create index if not exists checkins_local_id_idx
  on public.checkins(local_id);
create index if not exists professor_criacoes_pendentes_academia_id_idx
  on public.professor_criacoes_pendentes(academia_id);

create or replace function private.horario_na_academia(p_horario_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.turma_horarios th
    join public.turmas t on t.id = th.turma_id
    where th.id = p_horario_id
      and t.academia_id = private.current_academia_id()
  );
$$;

drop policy if exists chamadas_select_aula_extra on public.chamadas;
drop policy if exists chamadas_select_por_papel on public.chamadas;
create policy chamadas_select_por_papel
on public.chamadas for select
to authenticated
using (
  (
    aula_extra_id is not null
    and private.chamada_na_academia(id)
    and (
      private.is_manager()
      or private.current_user_role() = 'aluno'
    )
  )
  or (
    turma_id is not null
    and (
      (private.is_admin() and private.turma_na_academia(turma_id))
      or private.professor_do_horario(horario_id)
      or private.aluno_matriculado_na_turma(turma_id)
    )
  )
);

drop policy if exists presencas_select_aula_extra_gestao on public.presencas;
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
  or (
    private.is_manager()
    and private.aluno_na_academia(aluno_id)
    and exists (
      select 1
      from public.chamadas c
      where c.id = chamada_id
        and c.aula_extra_id is not null
        and private.chamada_na_academia(c.id)
    )
  )
);

drop policy if exists locais_admin_write on public.locais;
create policy locais_admin_insert
on public.locais for insert to authenticated
with check (private.is_admin() and academia_id = private.current_academia_id());
create policy locais_admin_update
on public.locais for update to authenticated
using (private.is_admin() and academia_id = private.current_academia_id())
with check (private.is_admin() and academia_id = private.current_academia_id());
create policy locais_admin_delete
on public.locais for delete to authenticated
using (private.is_admin() and academia_id = private.current_academia_id());

drop policy if exists turma_horarios_admin_write on public.turma_horarios;
create policy turma_horarios_admin_insert
on public.turma_horarios for insert to authenticated
with check (private.is_admin() and private.turma_na_academia(turma_id));
create policy turma_horarios_admin_update
on public.turma_horarios for update to authenticated
using (private.is_admin() and private.turma_na_academia(turma_id))
with check (private.is_admin() and private.turma_na_academia(turma_id));
create policy turma_horarios_admin_delete
on public.turma_horarios for delete to authenticated
using (private.is_admin() and private.turma_na_academia(turma_id));

drop policy if exists turma_horario_professores_admin_write
on public.turma_horario_professores;
create policy turma_horario_professores_admin_insert
on public.turma_horario_professores for insert to authenticated
with check (private.is_admin() and private.horario_na_academia(horario_id));
create policy turma_horario_professores_admin_update
on public.turma_horario_professores for update to authenticated
using (private.is_admin() and private.horario_na_academia(horario_id))
with check (private.is_admin() and private.horario_na_academia(horario_id));
create policy turma_horario_professores_admin_delete
on public.turma_horario_professores for delete to authenticated
using (private.is_admin() and private.horario_na_academia(horario_id));

revoke all on table public.professor_criacoes_pendentes from anon, authenticated;
