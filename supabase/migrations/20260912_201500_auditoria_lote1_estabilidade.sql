-- Auditoria lote 1: usuários ativos, segurança e ciclo de aula extra.

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(coalesce(u.cargo, ''))
  from public.usuarios u
  where u.auth_id = (select auth.uid())
    and u.status = 'Ativo'
  limit 1;
$$;

create or replace function private.current_usuario_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id
  from public.usuarios u
  where u.auth_id = (select auth.uid())
    and u.status = 'Ativo'
  limit 1;
$$;

create or replace function private.current_academia_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select u.academia_id
  from public.usuarios u
  where u.auth_id = (select auth.uid())
    and u.status = 'Ativo'
  limit 1;
$$;

create or replace function private.current_aluno_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select u.aluno_id
  from public.usuarios u
  where u.auth_id = (select auth.uid())
    and u.status = 'Ativo'
  limit 1;
$$;

revoke execute on function public.sincronizar_foto_usuario_aluno() from public, anon, authenticated;

create or replace function public.salvar_presencas_aula_extra(
  p_chamada_id bigint,
  p_aluno_ids bigint[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_academia_id bigint;
  v_aula_extra_id bigint;
begin
  if not private.is_manager() then
    raise exception 'Sem permissão para registrar presença' using errcode='42501';
  end if;

  v_academia_id := private.current_academia_id();

  select c.aula_extra_id
  into v_aula_extra_id
  from public.chamadas c
  join public.aulas_extras ae on ae.id = c.aula_extra_id
  where c.id = p_chamada_id
    and ae.academia_id = v_academia_id
    and ae.status = 'Aberta';

  if v_aula_extra_id is null then
    raise exception 'Aula extra inválida ou já encerrada' using errcode='42501';
  end if;

  delete from public.presencas where chamada_id = p_chamada_id;

  insert into public.presencas (chamada_id, aluno_id)
  select p_chamada_id, x.aluno_id
  from (
    select distinct unnest(coalesce(p_aluno_ids, '{}'::bigint[])) aluno_id
  ) x
  join public.alunos a on a.id = x.aluno_id
  where a.academia_id = v_academia_id
    and a.status = 'Ativo';

  update public.aulas_extras
  set status = 'Finalizada'
  where id = v_aula_extra_id;
end;
$$;

create or replace function public.cancelar_aula_extra(p_aula_extra_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
begin
  if not private.is_manager() then
    raise exception 'Sem permissão para cancelar aula extra' using errcode='42501';
  end if;

  v_usuario_id := private.current_usuario_id();

  update public.aulas_extras ae
  set status = 'Cancelada'
  where ae.id = p_aula_extra_id
    and ae.academia_id = private.current_academia_id()
    and ae.status = 'Aberta'
    and (
      private.is_admin()
      or ae.professor_usuario_id = v_usuario_id
    );

  if not found then
    raise exception 'Aula extra não encontrada ou sem permissão' using errcode='42501';
  end if;
end;
$$;

revoke all on function public.cancelar_aula_extra(bigint) from public, anon;
grant execute on function public.cancelar_aula_extra(bigint) to authenticated, service_role;

update public.aulas_extras
set status = 'Cancelada'
where nome = 'Teste de Aula Extra'
  and status = 'Aberta';
