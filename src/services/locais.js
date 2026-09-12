import { supabase } from "@/lib/supabase";

export async function listarLocais() {
  const { data, error } = await supabase
    .from("locais")
    .select("id,nome,endereco,token_qr,ativo")
    .order("nome");

  if (error) throw error;
  return data || [];
}

export function montarLinkCheckin(token) {
  const url = new URL(window.location.origin);
  url.searchParams.set("checkin", token);
  return url.toString();
}

export function montarGoogleMapsUrl(endereco) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}

export function montarWazeUrl(endereco) {
  return `https://www.waze.com/ul?q=${encodeURIComponent(endereco)}&navigate=yes`;
}
