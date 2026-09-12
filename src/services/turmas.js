import { supabase } from "@/lib/supabase";

export async function listarTurmas() {
  const { data, error } = await supabase
    .from("turmas")
    .select(`
      id,
      nome,
      dias,
      horario,
      professor,
      academia_id,
      codigo_convite,
      local_id,
      locais(id,nome,endereco),
      turma_horarios(
        id,
        dia_semana,
        horario_inicio,
        professor,
        turma_horario_professores(usuario_id)
      )
    `)
    .order("nome");

  if (error) throw error;

  return (data || []).map((turma) => ({
    ...turma,
    turma_horarios: (turma.turma_horarios || []).sort(
      (a, b) =>
        a.dia_semana - b.dia_semana ||
        String(a.horario_inicio).localeCompare(String(b.horario_inicio))
    ),
  }));
}
