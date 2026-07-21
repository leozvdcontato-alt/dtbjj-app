import { supabase } from "@/lib/supabase";

export async function buscarAlunosDaTurma(turmaId) {
  const { data, error } = await supabase
    .from("matriculas")
    .select(`
      aluno:aluno_id (
        id,
        nome,
        faixa,
        graus,
        status
      )
    `)
    .eq("turma_id", turmaId);

  if (error) throw error;

  return data.map((item) => item.aluno);
}