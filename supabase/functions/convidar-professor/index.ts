import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(
        JSON.stringify({
          error: "Apenas administradores podem convidar professores.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const nome = String(body?.nome || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!nome || !email) {
      return new Response(
        JSON.stringify({ error: "Nome e e-mail são obrigatórios." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        nome,
        academia_id: perfil.academia_id,
      },
      redirectTo: "https://dtbjj-app.vercel.app",
    });

    if (error) {
      const mensagem = error.message.toLowerCase().includes("already")
        ? "Já existe uma conta com este e-mail."
        : "Não foi possível enviar o convite.";

      return new Response(JSON.stringify({ error: mensagem }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Convite enviado com sucesso." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Erro interno ao enviar convite." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
