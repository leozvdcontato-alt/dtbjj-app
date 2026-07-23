import { supabase } from "@/lib/supabase";

export async function registrarPresencas(
  chamadaId,
  alunos
) {
  if (!alunos.length) return;

  const registros = alunos.map((aluno) => ({
    chamada_id: chamadaId,
    aluno_id: aluno.id,
  }));

  const { error } = await supabase
    .from("presencas")
    .insert(registros);

  if (error) throw error;
}