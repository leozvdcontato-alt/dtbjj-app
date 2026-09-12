import { supabase } from "@/lib/supabase";

function normalizarPublicacao(item) {
  return {
    ...item,
    turmas: (item.publicacao_turmas || [])
      .map((vinculo) => vinculo.turmas || { id: vinculo.turma_id })
      .filter(Boolean),
  };
}

const SELECT_PUBLICACAO = `
  id,
  academia_id,
  autor_usuario_id,
  autor_nome,
  tipo,
  titulo,
  conteudo,
  evento_data,
  evento_horario,
  evento_local,
  publicado,
  push_enviado_at,
  created_at,
  updated_at,
  publicacao_turmas(
    turma_id,
    turmas(id,nome)
  )
`;

export async function listarPublicacoes() {
  const { data, error } = await supabase
    .from("publicacoes")
    .select(SELECT_PUBLICACAO)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizarPublicacao);
}

export async function listarPublicacoesInicio(limite = 5) {
  const { data, error } = await supabase
    .from("publicacoes")
    .select(SELECT_PUBLICACAO)
    .eq("publicado", true)
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) throw error;
  return (data || []).map(normalizarPublicacao);
}

export async function buscarPublicacao(id) {
  const { data, error } = await supabase
    .from("publicacoes")
    .select(SELECT_PUBLICACAO)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizarPublicacao(data) : null;
}

export async function salvarPublicacao(publicacao, { enviarPush = false } = {}) {
  const { data, error } = await supabase.rpc("salvar_publicacao", {
    p_id: publicacao.id || null,
    p_tipo: publicacao.tipo,
    p_titulo: publicacao.titulo,
    p_conteudo: publicacao.conteudo,
    p_evento_data:
      publicacao.tipo === "evento" ? publicacao.evento_data || null : null,
    p_evento_horario:
      publicacao.tipo === "evento" ? publicacao.evento_horario || null : null,
    p_evento_local:
      publicacao.tipo === "evento" ? publicacao.evento_local || null : null,
    p_publicado: Boolean(publicacao.publicado),
    p_turma_ids: (publicacao.turma_ids || []).map(Number),
  });

  if (error) throw error;

  let push = null;
  if (publicacao.publicado && enviarPush) {
    const resultadoPush = await supabase.functions.invoke("notificar-publicacao", {
      body: { publicacao_id: data },
    });

    if (resultadoPush.error) {
      push = { erro: resultadoPush.error.message || "Falha ao enviar notificações." };
    } else {
      push = resultadoPush.data;
    }
  }

  return { id: data, push };
}

export async function excluirPublicacao(id) {
  const { error } = await supabase.rpc("excluir_publicacao", {
    p_publicacao_id: id,
  });
  if (error) throw error;
}

export async function listarComentarios(publicacaoId) {
  const { data, error } = await supabase
    .from("publicacao_comentarios")
    .select(`
      id,
      publicacao_id,
      usuario_id,
      conteudo,
      created_at,
      autor_nome
    `)
    .eq("publicacao_id", publicacaoId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function comentarPublicacao(publicacaoId, usuarioId, conteudo) {
  const texto = String(conteudo || "").trim();
  if (!texto) return null;

  const { data, error } = await supabase
    .from("publicacao_comentarios")
    .insert({
      publicacao_id: publicacaoId,
      usuario_id: usuarioId,
      conteudo: texto,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function registrarVisualizacao(publicacaoId, usuarioId) {
  if (!publicacaoId || !usuarioId) return;

  const { error } = await supabase.from("publicacao_visualizacoes").upsert(
    {
      publicacao_id: publicacaoId,
      usuario_id: usuarioId,
      visualizado_em: new Date().toISOString(),
    },
    { onConflict: "publicacao_id,usuario_id" }
  );

  if (error) console.warn("Não foi possível registrar visualização:", error);
}

export async function contarInteracoes(publicacaoIds) {
  const ids = (publicacaoIds || []).filter(Boolean);
  if (!ids.length) return {};

  const [comentarios, visualizacoes] = await Promise.all([
    supabase
      .from("publicacao_comentarios")
      .select("publicacao_id")
      .in("publicacao_id", ids),
    supabase
      .from("publicacao_visualizacoes")
      .select("publicacao_id")
      .in("publicacao_id", ids),
  ]);

  const mapa = {};
  ids.forEach((id) => {
    mapa[id] = { comentarios: 0, visualizacoes: 0 };
  });

  (comentarios.data || []).forEach(({ publicacao_id }) => {
    if (mapa[publicacao_id]) mapa[publicacao_id].comentarios += 1;
  });

  (visualizacoes.data || []).forEach(({ publicacao_id }) => {
    if (mapa[publicacao_id]) mapa[publicacao_id].visualizacoes += 1;
  });

  return mapa;
}

export async function buscarRespostaEvento(publicacaoId, alunoId) {
  if (!publicacaoId || !alunoId) return null;

  const { data, error } = await supabase
    .from("evento_respostas")
    .select("publicacao_id,aluno_id,resposta,updated_at")
    .eq("publicacao_id", publicacaoId)
    .eq("aluno_id", alunoId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function responderEvento(publicacaoId, alunoId, resposta) {
  const { data, error } = await supabase
    .from("evento_respostas")
    .upsert(
      {
        publicacao_id: publicacaoId,
        aluno_id: alunoId,
        resposta,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "publicacao_id,aluno_id" }
    )
    .select("resposta,updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function listarRespostasEvento(publicacaoId) {
  const { data, error } = await supabase
    .from("evento_respostas")
    .select(`
      publicacao_id,
      aluno_id,
      resposta,
      updated_at,
      alunos(id,nome,faixa,graus)
    `)
    .eq("publicacao_id", publicacaoId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function listarAlunosDasTurmas(turmaIds) {
  const ids = (turmaIds || []).filter(Boolean);
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("matriculas")
    .select("aluno_id,turma_id,alunos(id,nome,faixa,graus)")
    .in("turma_id", ids);

  if (error) throw error;

  const unicos = new Map();
  (data || []).forEach((item) => {
    if (item.alunos) unicos.set(item.alunos.id, item.alunos);
  });
  return [...unicos.values()].sort((a, b) => a.nome.localeCompare(b.nome));
}
