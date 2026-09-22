import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function gerarSenhaTemporaria() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let sufixo = "";

  for (const byte of bytes) {
    sufixo += chars[byte % chars.length];
  }

  return "Dtbjj#7" + sufixo;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let tokenPendente: string | null = null;
  let authUserId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autorizado." }, 401);
    }

    const jwt = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(jwt);

    if (userError || !user) {
      return json({ error: "Sessão inválida. Entre novamente e tente de novo." }, 401);
    }

    const { data: perfil, error: perfilError } = await admin
      .from("usuarios")
      .select("academia_id,cargo,status")
      .eq("auth_id", user.id)
      .single();

    if (
      perfilError ||
      !perfil ||
      perfil.cargo !== "Administrador" ||
      perfil.status !== "Ativo"
    ) {
      return json({ error: "Apenas administradores podem criar professores." }, 403);
    }

    const { data: limiteOk, error: limiteError } = await admin.rpc(
      "consume_rate_limit",
      {
        p_actor_id: user.id,
        p_action: "convidar-professor",
        p_limit: 10,
        p_window_seconds: 600,
      }
    );

    if (limiteError) {
      console.error("Falha ao verificar rate limit:", limiteError);
      return json({ error: "Não foi possível validar a solicitação agora." }, 500);
    }

    if (!limiteOk) {
      return json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, 429);
    }

    const body = await req.json();
    const nome = String(body?.nome || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!nome || !email) {
      return json({ error: "Nome e e-mail são obrigatórios." }, 400);
    }

    if (nome.length > 120) {
      return json({ error: "Nome muito longo." }, 400);
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return json({ error: "Informe um e-mail válido." }, 400);
    }

    const { data: usuarioExistente } = await admin
      .from("usuarios")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (usuarioExistente) {
      return json({ error: "Já existe uma conta com este e-mail." }, 409);
    }

    const senhaTemporaria = gerarSenhaTemporaria();
    tokenPendente = crypto.randomUUID();

    const { error: pendenteError } = await admin
      .from("professor_criacoes_pendentes")
      .insert({
        token: tokenPendente,
        email,
        nome,
        academia_id: perfil.academia_id,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

    if (pendenteError) {
      console.error("Falha ao criar autorização pendente:", pendenteError);
      return json({
        error: "Não foi possível autorizar a criação do professor.",
      }, 400);
    }

    const { data: criado, error: criarError } = await admin.auth.admin.createUser({
      email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: {
        nome,
        dtbjj_professor_token: tokenPendente,
      },
    });

    if (criarError || !criado.user) {
      await admin
        .from("professor_criacoes_pendentes")
        .delete()
        .eq("token", tokenPendente);

      const mensagem = criarError?.message?.toLowerCase() || "";
      if (
        mensagem.includes("already") ||
        mensagem.includes("registered") ||
        mensagem.includes("exists")
      ) {
        return json({ error: "Já existe uma conta com este e-mail." }, 409);
      }

      console.error("Falha ao criar usuário do professor:", criarError);
      return json({
        error: "Não foi possível criar o acesso do professor.",
      }, 400);
    }

    authUserId = criado.user.id;

    const { error: marcarError } = await admin
      .from("usuarios")
      .update({ troca_senha_obrigatoria: true })
      .eq("auth_id", authUserId)
      .eq("cargo", "Professor");

    if (marcarError) {
      await admin.auth.admin.deleteUser(authUserId);
      console.error("Falha ao finalizar cadastro do professor:", marcarError);
      return json({
        error: "Não foi possível finalizar o cadastro do professor.",
      }, 500);
    }

    return json({
      ok: true,
      user_id: authUserId,
      email,
      senha_temporaria: senhaTemporaria,
      message: "Professor criado com senha temporária.",
    });
  } catch (error) {
    console.error("Erro interno ao criar professor:", error);

    if (tokenPendente) {
      await admin
        .from("professor_criacoes_pendentes")
        .delete()
        .eq("token", tokenPendente);
    }

    if (authUserId) {
      await admin.auth.admin.deleteUser(authUserId);
    }

    return json({
      error: "Erro interno ao criar professor.",
    }, 500);
  }
});
