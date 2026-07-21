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

  console.log("Chamada criada:", data);
  console.log("Erro ao criar chamada:", error);

  if (error) throw error;

  return data;
}

export async function registrarPresencas(
  chamadaId,
  alunos
) {
  if (!alunos.length) return;

  const registros = alunos.map((aluno) => ({
    chamada_id: chamadaId,
    aluno_id: aluno.id,
  }));

  const { data, error } = await supabase
    .from("presencas")
    .insert(registros)
    .select();

  console.log("Presenças:", data);
  console.log("Erro ao registrar presenças:", error);

  if (error) throw error;
}