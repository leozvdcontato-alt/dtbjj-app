import { supabase } from "@/lib/supabase";

export async function atualizarPerfil(id, dados) {
  const { error } = await supabase
    .from("usuarios")
    .update({
      nome: dados.nome,
      telefone: dados.telefone,
      cpf: dados.cpf,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}