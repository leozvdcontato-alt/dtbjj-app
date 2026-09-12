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
      turma_horario_professores(horario_id)
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

export async function definirHorariosProfessor(usuarioId, horarioIds) {
  const { error } = await supabase.rpc("definir_horarios_professor", {
    p_usuario_id: usuarioId,
    p_horario_ids: horarioIds,
  });

  if (error) throw error;
}

async function gerenciarProfessor(body) {
  const { data, error } = await supabase.functions.invoke("gerenciar-usuario", {
    body,
  });

  if (error) {
    let mensagem = "Não foi possível concluir a ação.";
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

export async function alterarStatusProfessor(usuarioId, status) {
  return gerenciarProfessor({
    acao: "status_professor",
    usuario_id: usuarioId,
    status,
  });
}

export async function excluirProfessor(usuarioId) {
  return gerenciarProfessor({
    acao: "excluir_professor",
    usuario_id: usuarioId,
  });
}
