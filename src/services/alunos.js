import { supabase } from "@/lib/supabase";

const CAMPOS_ALUNO = [
  "id",
  "nome",
  "cpf",
  "telefone",
  "faixa",
  "graus",
  "status",
  "categoria",
  "created_at",
  "academia_id",
  "matriculas(turma_id,turmas(id,nome))",
].join(",");

function ordenarPorNome(a, b) {
  return (a?.nome || "").localeCompare(b?.nome || "", "pt-BR");
}

export async function listarAlunos() {
  const { data, error } = await supabase
    .from("alunos")
    .select(CAMPOS_ALUNO)
    .order("nome");

  if (error) throw error;

  return (data || []).map((aluno) => ({
    ...aluno,
    matriculas: aluno.matriculas || [],
  }));
}

export async function obterPerfilAluno(alunoId) {
  const [resultadoAluno, resultadoPresencas] = await Promise.all([
    supabase
      .from("alunos")
      .select(CAMPOS_ALUNO)
      .eq("id", alunoId)
      .single(),
    supabase
      .from("presencas")
      .select("id", { count: "exact", head: true })
      .eq("aluno_id", alunoId),
  ]);

  if (resultadoAluno.error) throw resultadoAluno.error;
  if (resultadoPresencas.error) throw resultadoPresencas.error;

  const aluno = resultadoAluno.data;
  const turmas = (aluno.matriculas || [])
    .map((matricula) => matricula.turmas)
    .filter(Boolean)
    .sort(ordenarPorNome);

  const totalPresencas = resultadoPresencas.count || 0;
  const metaGraduacao = 60;

  return {
    aluno: {
      ...aluno,
      matriculas: aluno.matriculas || [],
    },
    turmas,
    totalPresencas,
    metaGraduacao,
    faltam: Math.max(0, metaGraduacao - totalPresencas),
    aptoGraduacao: totalPresencas >= metaGraduacao,
  };
}

export async function salvarAlunoComMatriculas(alunoId, form) {
  const { data, error } = await supabase.rpc("salvar_aluno_com_matriculas", {
    p_aluno_id: alunoId || null,
    p_nome: form.nome.trim(),
    p_cpf: form.cpf?.trim() || null,
    p_telefone: form.telefone?.trim() || null,
    p_faixa: form.faixa,
    p_graus: Number(form.graus || 0),
    p_categoria: form.categoria,
    p_status: form.status,
    p_turma_ids: form.turmas || [],
  });

  if (error) throw error;

  return data;
}

export async function buscarAlunosDaTurma(turmaId) {
  const { data, error } = await supabase
    .from("matriculas")
    .select(
      [
        "aluno:aluno_id(",
        "id,nome,faixa,graus,status,categoria",
        ")",
      ].join("")
    )
    .eq("turma_id", turmaId);

  if (error) throw error;

  return (data || [])
    .map((item) => item.aluno)
    .filter(Boolean)
    .sort(ordenarPorNome);
}
