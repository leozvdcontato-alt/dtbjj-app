import { createClient } from "npm:@supabase/supabase-js@2.108.2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Não autenticado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Sessão inválida" }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: perfil, error: perfilError } = await admin
      .from("usuarios")
      .select("id, academia_id, cargo, status")
      .eq("auth_id", userData.user.id)
      .maybeSingle();

    if (perfilError || !perfil) return json({ error: "Perfil não encontrado" }, 403);

    const cargo = String(perfil.cargo || "").toLowerCase();
    const ehAdmin = cargo.startsWith("administrador");
    const ehProfessor = cargo.startsWith("professor");

    if ((!ehAdmin && !ehProfessor) || perfil.status !== "Ativo") {
      return json({ error: "Sem permissão para enviar notificações" }, 403);
    }

    const { data: limiteOk, error: limiteError } = await admin.rpc(
      "consume_rate_limit",
      {
        p_actor_id: userData.user.id,
        p_action: "notificar-publicacao",
        p_limit: 10,
        p_window_seconds: 300,
      }
    );

    if (limiteError) {
      console.error("Falha ao verificar rate limit:", limiteError);
      return json({ error: "Não foi possível validar a solicitação agora." }, 500);
    }

    if (!limiteOk) {
      return json({ error: "Muitas notificações em pouco tempo. Aguarde alguns minutos." }, 429);
    }

    const body = await req.json();
    const publicacaoId = Number(body?.publicacaoId);
    if (!Number.isSafeInteger(publicacaoId) || publicacaoId <= 0) {
      return json({ error: "Publicação inválida" }, 400);
    }

    const { data: publicacao, error: publicacaoError } = await admin
      .from("publicacoes")
      .select("id, academia_id, autor_usuario_id, tipo, titulo, evento_data, publicado")
      .eq("id", publicacaoId)
      .maybeSingle();

    if (publicacaoError || !publicacao || publicacao.academia_id !== perfil.academia_id) {
      return json({ error: "Publicação não encontrada" }, 404);
    }

    if (!publicacao.publicado) return json({ error: "A publicação ainda não está publicada" }, 400);
    if (!ehAdmin && publicacao.autor_usuario_id !== perfil.id) {
      return json({ error: "Professor só pode notificar publicações próprias" }, 403);
    }

    const { data: alvos, error: alvosError } = await admin
      .from("publicacao_turmas")
      .select("turma_id")
      .eq("publicacao_id", publicacaoId);

    if (alvosError) throw alvosError;
    const turmaIds = [...new Set((alvos || []).map((item) => item.turma_id))];
    if (!turmaIds.length) return json({ enviados: 0, mensagem: "Nenhuma turma selecionada" });

    if (ehProfessor) {
      const { data: vinculos, error: vinculosError } = await admin
        .from("turma_professores")
        .select("turma_id")
        .eq("usuario_id", perfil.id)
        .in("turma_id", turmaIds);
      if (vinculosError) throw vinculosError;
      const permitidas = new Set((vinculos || []).map((item) => item.turma_id));
      if (turmaIds.some((id) => !permitidas.has(id))) {
        return json({ error: "Uma das turmas não pertence ao professor" }, 403);
      }
    }

    const { data: matriculas, error: matriculasError } = await admin
      .from("matriculas")
      .select("aluno_id")
      .in("turma_id", turmaIds);
    if (matriculasError) throw matriculasError;

    const alunoIds = [...new Set((matriculas || []).map((item) => item.aluno_id))];
    if (!alunoIds.length) return json({ enviados: 0, mensagem: "Não há alunos nas turmas selecionadas" });

    const { data: usuarios, error: usuariosError } = await admin
      .from("usuarios")
      .select("id, aluno_id")
      .eq("academia_id", perfil.academia_id)
      .in("aluno_id", alunoIds);
    if (usuariosError) throw usuariosError;

    const usuarioIds = [...new Set((usuarios || []).map((item) => item.id))];
    if (!usuarioIds.length) return json({ enviados: 0, mensagem: "Nenhum aluno possui usuário ativo" });

    const { data: subscriptions, error: subscriptionsError } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("usuario_id", usuarioIds);
    if (subscriptionsError) throw subscriptionsError;

    const { data: config, error: configError } = await admin.rpc("obter_push_config");
    if (configError || !config?.[0]) throw configError || new Error("Configuração Web Push ausente");

    webpush.setVapidDetails(
      "mailto:leozvd.contato@gmail.com",
      config[0].public_key,
      config[0].private_key
    );

    const dataEvento = publicacao.evento_data
      ? new Date(publicacao.evento_data + "T12:00:00").toLocaleDateString("pt-BR")
      : null;

    const payload = JSON.stringify({
      title: publicacao.tipo === "evento" ? "Novo evento da DTBJJ" : "Nova notícia da DTBJJ",
      body: publicacao.tipo === "evento" && dataEvento
        ? publicacao.titulo + " · " + dataEvento
        : publicacao.titulo,
      url: "/?publicacao=" + publicacao.id,
      tag: "publicacao-" + publicacao.id,
    });

    let enviados = 0;
    let removidos = 0;
    let falhas = 0;

    await Promise.all((subscriptions || []).map(async (subscription) => {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        }, payload);
        enviados += 1;
      } catch (error) {
        const statusCode = Number((error as { statusCode?: number })?.statusCode || 0);
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", subscription.id);
          removidos += 1;
        } else {
          console.error("Falha ao enviar push:", error);
          falhas += 1;
        }
      }
    }));

    await admin
      .from("publicacoes")
      .update({ push_enviado_at: new Date().toISOString() })
      .eq("id", publicacao.id);

    return json({ enviados, removidos, falhas });
  } catch (error) {
    console.error(error);
    return json({ error: "Não foi possível enviar as notificações." }, 500);
  }
});