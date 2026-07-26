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

export async function buscarUltimaChamada() {
  const { data: chamada, error } = await supabase
    .from("chamadas")
    .select(`
      id,
      data,
      horario,
      turma_id,
      turmas (
        nome
      )
    `)
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;

  const { count: presentes } = await supabase
    .from("presencas")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("chamada_id", chamada.id);

  const { count: matriculados } = await supabase
    .from("matriculas")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("turma_id", chamada.turma_id);

  return {
    turma: chamada.turmas.nome,
    data: chamada.data,
    horario: chamada.horario,
    presentes: presentes || 0,
    matriculados: matriculados || 0,
  };
}