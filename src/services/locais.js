import { supabase } from "@/lib/supabase";

export async function listarLocais() {
  const { data, error } = await supabase
    .from("locais")
    .select("id,nome,token_qr,ativo")
    .order("nome");

  if (error) throw error;
  return data || [];
}

export function montarLinkCheckin(token) {
  const url = new URL(window.location.origin);
  url.searchParams.set("checkin", token);
  return url.toString();
}
