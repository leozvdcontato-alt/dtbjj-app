import { supabase } from "@/lib/supabase";

export async function criarChamada({
  turmaId,
  professor,
}) {
  const agora = new Date();

  const { data, error } = await supabase
    .from("chamadas")
    .insert({
      turma_id: turmaId,
      data: agora.toISOString().split("T")[0],
      horario: agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      professor,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}