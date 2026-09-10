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
) from anon;

drop index if exists public.usuarios_auth_id_uidx;
