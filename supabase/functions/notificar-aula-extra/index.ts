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
    if (
      (!cargo.startsWith("administrador") && !cargo.startsWith("professor")) ||
      perfil.status !== "Ativo"
    ) {
      return json({ error: "Sem permissão para notificar aula extra" }, 403);
    }

    const { aula_extra_id } = await req.json();
    if (!aula_extra_id) return json({ error: "Aula extra não informada" }, 400);

    const { data: aula, error: aulaError } = await admin
      .from("aulas_extras")
      .select("id,academia_id,nome,data,horario,professor_usuario_id,locais(nome)")
      .eq("id", aula_extra_id)
      .maybeSingle();

    if (aulaError || !aula || aula.academia_id !== perfil.academia_id) {
      return json({ error: "Aula extra não encontrada" }, 404);
    }

    if (
      !cargo.startsWith("administrador") &&
      aula.professor_usuario_id !== perfil.id
    ) {
      return json({ error: "Professor só pode notificar aulas abertas por ele" }, 403);
    }

    const { data: alunos, error: alunosError } = await admin
      .from("alunos")
      .select("id")
      .eq("academia_id", perfil.academia_id)
      .eq("status", "Ativo");

    if (alunosError) throw alunosError;

    const alunoIds = (alunos || []).map((item) => item.id);
    if (!alunoIds.length) return json({ enviados: 0 });

    const { data: usuarios, error: usuariosError } = await admin
      .from("usuarios")
      .select("id,aluno_id")
      .eq("academia_id", perfil.academia_id)
      .eq("cargo", "Aluno")
      .eq("status", "Ativo")
      .in("aluno_id", alunoIds);

    if (usuariosError) throw usuariosError;

    const usuarioIds = (usuarios || []).map((item) => item.id);
    if (!usuarioIds.length) return json({ enviados: 0 });

    const { data: subscriptions, error: subscriptionsError } = await admin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .in("usuario_id", usuarioIds);

    if (subscriptionsError) throw subscriptionsError;

    const { data: config, error: configError } = await admin.rpc("obter_push_config");
    if (configError || !config?.[0]) {
      throw configError || new Error("Configuração Web Push ausente");
    }

    webpush.setVapidDetails(
      "mailto:leozvd.contato@gmail.com",
      config[0].public_key,
      config[0].private_key
    );

    const hora = String(aula.horario || "").slice(0, 5);
    const local = aula.locais?.nome || "local informado no app";
    const payload = JSON.stringify({
      title: "Aula extra disponível 🥋",
      body: `${aula.nome} hoje às ${hora} no ${local}. Quem quiser treinar, é só chegar.`,
      url: "/",
      tag: `aula-extra-${aula.id}`,
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
          console.error("Falha ao enviar push de aula extra:", error);
          falhas += 1;
        }
      }
    }));

    return json({ enviados, removidos, falhas });
  } catch (error) {
    console.error(error);
    return json({ error: "Não foi possível enviar as notificações da aula extra." }, 500);
  }
});
