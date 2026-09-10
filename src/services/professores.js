import { supabase } from "@/lib/supabase";

export async function listarProfessores() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id,nome,email,status,cargo")
    .eq("cargo", "Professor")
    .order("nome");

  if (error) throw error;
  return data || [];
}

export async function convidarProfessor({ nome, email }) {
  const { data, error } = await supabase.functions.invoke("convidar-professor", {
    body: { nome, email },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
