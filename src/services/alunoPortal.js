import { supabase } from "@/lib/supabase";

export async function carregarPortalAluno(alunoId) {
  if (!alunoId) {
    return {
      aluno: null,
      turmas: [],
      presencas: [],
    };
  }

  const [alunoResultado, matriculasResultado, presencasResultado] =
    await Promise.all([
      supabase
        .from("alunos")
        .select("id, nome, faixa, graus, categoria, status")
        .eq("id", alunoId)
        .maybeSingle(),
      supabase
        .from("matriculas")
        .select(`
          id,
          created_at,
          turmas (
            id,
            nome,
            dias,
            horario,
            professor,
            turma_horarios (
              id,
              dia_semana,
              horario_inicio
            )
          )
        `)
        .eq("aluno_id", alunoId)
        .order("created_at", { ascending: true }),
      supabase
        .from("presencas")
        .select(`
          id,
          created_at,
          chamadas (
            id,
            data,
            horario,
            turma_id,
            turmas (
              id,
              nome
            )
          )
        `)
        .eq("aluno_id", alunoId)
        .order("created_at", { ascending: false }),
    ]);

  if (alunoResultado.error) throw alunoResultado.error;
  if (matriculasResultado.error) throw matriculasResultado.error;
  if (presencasResultado.error) throw presencasResultado.error;

  return {
    aluno: alunoResultado.data,
    turmas: (matriculasResultado.data || [])
      .map((matricula) => matricula.turmas)
      .filter(Boolean),
    presencas: (presencasResultado.data || [])
      .map((presenca) => ({
        id: presenca.id,
        created_at: presenca.created_at,
        chamada: presenca.chamadas,
      }))
      .filter((presenca) => presenca.chamada),
  };
}
