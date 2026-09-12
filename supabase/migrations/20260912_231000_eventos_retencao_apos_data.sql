-- Mantém eventos futuros além da janela normal de 7 dias.
-- Publicações comuns expiram após 7 dias.
-- Eventos só podem expirar depois da data marcada.

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
  where created_at < now() - interval '7 days'
    and (
      evento_data is null
      or evento_data < (timezone('America/Sao_Paulo', now()))::date
    );

  get diagnostics v_excluidas = row_count;
  return v_excluidas;
end;
$$;
