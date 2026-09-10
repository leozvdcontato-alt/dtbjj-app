import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function gerarSenhaTemporaria() {
  const bytes = new Uint32Array(4);
  crypto.getRandomValues(bytes);
  return `Dtbjj!${bytes[0].toString(36)}${bytes[1].toString(36)}${bytes[2].toString(36)}${bytes[3].toString(36)}`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autorizado." }, 401);
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

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
      return json(
        { error: "Apenas administradores podem criar professores." },
        403
      );
    }

    const body = await req.json();
    const nome = String(body?.nome || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!nome || !email) {
      return json({ error: "Nome e e-mail são obrigatórios." }, 400);
    }

    const senhaTemporaria = gerarSenhaTemporaria();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: { nome },
      app_metadata: {
        dtbjj_role: "Professor",
        academia_id: perfil.academia_id,
      },
    });

    if (error) {
      const mensagem = error.message.toLowerCase();

      if (mensagem.includes("already") || mensagem.includes("registered")) {
        return json({ error: "Já existe uma conta com este e-mail." }, 409);
      }

      return json(
        { error: "Não foi possível criar o professor. Tente novamente." },
        400
      );
    }

    return json({
      ok: true,
      user_id: data.user?.id,
      email,
      senha_temporaria: senhaTemporaria,
      message: "Acesso do professor criado com sucesso.",
    });
  } catch {
    return json({ error: "Erro interno ao criar professor." }, 500);
  }
});
