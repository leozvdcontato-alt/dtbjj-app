drop policy if exists chamadas_select_por_papel on public.chamadas;
create policy chamadas_select_por_papel
on public.chamadas for select to authenticated
using (
  (private.is_admin() and private.turma_na_academia(turma_id))
  or private.professor_da_turma(turma_id)
  or private.aluno_matriculado_na_turma(turma_id)
);

drop policy if exists chamadas_insert_gestao on public.chamadas;
drop policy if exists chamadas_update_gestao on public.chamadas;
drop policy if exists chamadas_delete_gestao on public.chamadas;

create policy chamadas_insert_gestao
on public.chamadas for insert to authenticated
with check (
  (private.is_admin() and private.turma_na_academia(turma_id))
  or private.professor_da_turma(turma_id)
);

create policy chamadas_update_gestao
on public.chamadas for update to authenticated
using (
  (private.is_admin() and private.turma_na_academia(turma_id))
  or private.professor_da_turma(turma_id)
)
with check (
  (private.is_admin() and private.turma_na_academia(turma_id))
  or private.professor_da_turma(turma_id)
);

create policy chamadas_delete_gestao
on public.chamadas for delete to authenticated
using (
  (private.is_admin() and private.turma_na_academia(turma_id))
  or private.professor_da_turma(turma_id)
);

drop policy if exists presencas_select_por_papel on public.presencas;
create policy presencas_select_por_papel
on public.presencas for select to authenticated
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
    where c.id = presencas.chamada_id
      and private.professor_da_turma(c.turma_id)
  )
);

drop policy if exists presencas_insert_gestao on public.presencas;
drop policy if exists presencas_update_gestao on public.presencas;
drop policy if exists presencas_delete_gestao on public.presencas;

create policy presencas_insert_gestao
on public.presencas for insert to authenticated
with check (
  (
    private.is_admin()
    and private.aluno_na_academia(aluno_id)
    and private.chamada_na_academia(chamada_id)
  )
  or exists (
    select 1
    from public.chamadas c
    where c.id = presencas.chamada_id
      and private.professor_da_turma(c.turma_id)
  )
);

create policy presencas_update_gestao
on public.presencas for update to authenticated
using (
  (
    private.is_admin()
    and private.aluno_na_academia(aluno_id)
    and private.chamada_na_academia(chamada_id)
  )
  or exists (
    select 1
    from public.chamadas c
    where c.id = presencas.chamada_id
      and private.professor_da_turma(c.turma_id)
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
    where c.id = presencas.chamada_id
      and private.professor_da_turma(c.turma_id)
  )
);

create policy presencas_delete_gestao
on public.presencas for delete to authenticated
using (
  (
    private.is_admin()
    and private.aluno_na_academia(aluno_id)
    and private.chamada_na_academia(chamada_id)
  )
  or exists (
    select 1
    from public.chamadas c
    where c.id = presencas.chamada_id
      and private.professor_da_turma(c.turma_id)
  )
);
