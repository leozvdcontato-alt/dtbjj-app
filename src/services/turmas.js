import { supabase } from "@/lib/supabase";

export async function listarTurmas() {
  const { data, error } = await supabase
    .from("turmas")
    .select("*")
    .order("nome");

  if (error) throw error;

  return data;
}