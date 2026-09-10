import { supabase } from "@/lib/supabase";

export async function registrarCheckin(token) {
  const { data, error } = await supabase.rpc("registrar_checkin", {
    p_token: token,
  });

  if (error) throw error;
  return data?.[0] || null;
}
