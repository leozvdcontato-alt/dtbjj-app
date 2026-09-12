alter table public.usuarios
  add column if not exists troca_senha_obrigatoria boolean not null default false;

create or replace function public.confirmar_troca_senha_professor()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.usuarios
  set troca_senha_obrigatoria = false
  where auth_id = (select auth.uid())
    and cargo = 'Professor'
    and status = 'Ativo';

  if not found then
    raise exception 'Professor ativo não encontrado' using errcode='42501';
  end if;
end;
$$;

revoke all on function public.confirmar_troca_senha_professor() from public, anon;
grant execute on function public.confirmar_troca_senha_professor() to authenticated, service_role;
