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

export async function abrirAulaExtra({ nome, localId, horario }) {
  const { data, error } = await supabase.rpc("abrir_aula_extra", {
    p_nome: nome?.trim() || "Aula extra",
    p_local_id: Number(localId),
    p_horario: horario,
  });

  if (error) throw error;

  const registro = Array.isArray(data) ? data[0] : data;
  if (!registro?.aula_extra_id || !registro?.chamada_id) {
    throw new Error("Não foi possível abrir a aula extra.");
  }

  let notificacao = null;

  try {
    const resultado = await supabase.functions.invoke("notificar-aula-extra", {
      body: { aula_extra_id: registro.aula_extra_id },
    });
    notificacao = resultado.data || null;
  } catch (errorPush) {
    console.error("Aula extra aberta, mas o push falhou:", errorPush);
  }

  return { ...registro, notificacao };
}

export async function listarAlunosAulaExtra() {
  const { data, error } = await supabase.rpc("listar_alunos_aula_extra");

  if (error) throw error;
  return data || [];
}

export async function salvarPresencasAulaExtra(chamadaId, alunos) {
  const { error } = await supabase.rpc("salvar_presencas_aula_extra", {
    p_chamada_id: chamadaId,
    p_aluno_ids: alunos.map((aluno) => aluno.id),
  });

  if (error) throw error;
}

export async function buscarUltimaChamada() {
  const { data: chamada, error } = await supabase
    .from("chamadas")
    .select(`
      id,
      data,
      horario,
      turma_id,
      aula_extra_id,
      turmas (
        nome
      ),
      aulas_extras (
        nome
      )
    `)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!chamada) return null;

  const { count: presentes } = await supabase
    .from("presencas")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("chamada_id", chamada.id);

  let matriculados = null;

  if (chamada.turma_id) {
    const resultado = await supabase
      .from("matriculas")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("turma_id", chamada.turma_id);

    matriculados = resultado.count || 0;
  }

  return {
    turma: chamada.aulas_extras?.nome || chamada.turmas?.nome || "Treino DTBJJ",
    data: chamada.data,
    horario: chamada.horario,
    presentes: presentes || 0,
    matriculados,
    aulaExtra: Boolean(chamada.aula_extra_id),
  };
}
