import { supabase } from "@/lib/supabase";

export async function listarProfessores() {
  const { data, error } = await supabase
    .from("usuarios")
    .select(`
      id,
      nome,
      email,
      status,
      cargo,
      turma_professores(turma_id)
    `)
    .eq("cargo", "Professor")
    .order("nome");

  if (error) throw error;
  return data || [];
}

export async function criarProfessor({ nome, email }) {
  const { data, error } = await supabase.functions.invoke("convidar-professor", {
    body: { nome, email },
  });

  if (error) {
    let mensagem = "Não foi possível criar o professor.";

    try {
      const detalhe = await error.context?.json?.();
      if (detalhe?.error) mensagem = detalhe.error;
    } catch {
      // mantém mensagem padrão
    }

    throw new Error(mensagem);
  }

  if (data?.error) throw new Error(data.error);
  return data;
}

export async function definirTurmasProfessor(usuarioId, turmaIds) {
  const { error } = await supabase.rpc("definir_turmas_professor", {
    p_usuario_id: usuarioId,
    p_turma_ids: turmaIds,
  });

  if (error) throw error;
}
