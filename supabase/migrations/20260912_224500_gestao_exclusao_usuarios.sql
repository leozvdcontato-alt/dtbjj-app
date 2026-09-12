alter table public.aulas_extras
  alter column professor_usuario_id drop not null;

alter table public.aulas_extras
  drop constraint if exists aulas_extras_professor_usuario_id_fkey;

alter table public.aulas_extras
  add constraint aulas_extras_professor_usuario_id_fkey
  foreign key (professor_usuario_id)
  references public.usuarios(id)
  on delete set null;
