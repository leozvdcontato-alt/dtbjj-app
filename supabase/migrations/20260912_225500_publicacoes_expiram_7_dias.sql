-- Canal de comunicação efêmero: publicações expiram após 7 dias.

create extension if not exists pg_cron;

create or replace function private.apagar_publicacoes_antigas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_excluidas integer;
begin
  delete from public.publicacoes
  where created_at < now() - interval '7 days';

  get diagnostics v_excluidas = row_count;
  return v_excluidas;
end;
$$;

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select jobid
    from cron.job
    where jobname = 'dtbjj_limpar_publicacoes_7d'
  loop
    perform cron.unschedule(v_job_id);
  end loop;
end;
$$;

select cron.schedule(
  'dtbjj_limpar_publicacoes_7d',
  '15 6 * * *',
  $$select private.apagar_publicacoes_antigas();$$
);

select private.apagar_publicacoes_antigas();
