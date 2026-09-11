alter table public.alunos
  add column if not exists foto text;

update public.alunos a
set foto = u.foto
from public.usuarios u
where u.aluno_id = a.id
  and u.foto is not null
  and (a.foto is distinct from u.foto);

create or replace function public.sincronizar_foto_usuario_aluno()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.aluno_id is not null and new.foto is distinct from old.foto then
    update public.alunos
    set foto = new.foto
    where id = new.aluno_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sincronizar_foto_usuario_aluno on public.usuarios;

create trigger trg_sincronizar_foto_usuario_aluno
after update of foto on public.usuarios
for each row
execute function public.sincronizar_foto_usuario_aluno();

comment on function public.sincronizar_foto_usuario_aluno() is
'Sincroniza a foto do perfil de acesso com o cadastro acadêmico do aluno vinculado.';
