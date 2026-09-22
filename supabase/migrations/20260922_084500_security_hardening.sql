-- Security hardening: uploads, explicit deny policies and server-side rate limiting.

-- 1) Explicitly document that pending professor creation tokens are server-only.
drop policy if exists professor_criacoes_pendentes_deny_anon on public.professor_criacoes_pendentes;
drop policy if exists professor_criacoes_pendentes_deny_authenticated on public.professor_criacoes_pendentes;

create policy professor_criacoes_pendentes_deny_anon
on public.professor_criacoes_pendentes
as restrictive
for all
to anon
using (false)
with check (false);

create policy professor_criacoes_pendentes_deny_authenticated
on public.professor_criacoes_pendentes
as restrictive
for all
to authenticated
using (false)
with check (false);

revoke all on table public.professor_criacoes_pendentes from anon, authenticated;

-- 2) Restrict avatar uploads by size, MIME type and authenticated user's folder.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ]::text[]
where id = 'avatars';

drop policy if exists "Authenticated users can manage avatars" on storage.objects;
drop policy if exists avatars_insert_own_folder on storage.objects;
drop policy if exists avatars_update_own_folder on storage.objects;
drop policy if exists avatars_delete_own_folder on storage.objects;

create policy avatars_insert_own_folder
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_update_own_folder
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_delete_own_folder
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- 3) Central rate limiter for privileged Edge Functions.
create table if not exists private.api_rate_limits (
  actor_id uuid not null,
  action text not null,
  window_started_at timestamptz not null default clock_timestamp(),
  hits integer not null default 0,
  primary key (actor_id, action)
);

create or replace function public.consume_rate_limit(
  p_actor_id uuid,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  if p_actor_id is null
     or nullif(trim(p_action), '') is null
     or p_limit < 1 or p_limit > 1000
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    return false;
  end if;

  insert into private.api_rate_limits as rl (
    actor_id, action, window_started_at, hits
  )
  values (
    p_actor_id, left(trim(p_action), 80), clock_timestamp(), 1
  )
  on conflict (actor_id, action)
  do update
  set window_started_at = case
        when rl.window_started_at + make_interval(secs => p_window_seconds) <= clock_timestamp()
          then clock_timestamp()
        else rl.window_started_at
      end,
      hits = case
        when rl.window_started_at + make_interval(secs => p_window_seconds) <= clock_timestamp()
          then 1
        else rl.hits + 1
      end
  returning hits into v_hits;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(uuid,text,integer,integer)
from public, anon, authenticated;
grant execute on function public.consume_rate_limit(uuid,text,integer,integer)
to service_role;
