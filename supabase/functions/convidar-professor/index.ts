import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://dtbjj-app.vercel.app";
const INSTALL_URL = APP_URL + "/instalar?v=2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailProfessor(nome: string, inviteLink: string) {
  const nomeSeguro = escapeHtml(nome);
  const linkSeguro = escapeHtml(inviteLink);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Seu acesso ao DTBJJ APP está pronto</title>
  </head>
  <body style="margin:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;color:#f4f4f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#121212;border:1px solid #27272a;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 20px;text-align:center;">
                <img src="${APP_URL}/icon-192.png" width="72" height="72" alt="DTBJJ APP" style="display:block;margin:0 auto 18px;border-radius:18px;" />
                <div style="font-size:12px;font-weight:700;letter-spacing:2px;color:#ef4444;text-transform:uppercase;">DTBJJ APP</div>
                <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;color:#ffffff;">Seu acesso está pronto</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px;">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#d4d4d8;">Olá, <strong style="color:#ffffff;">${nomeSeguro}</strong>.</p>
                <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#a1a1aa;">Seu acesso como professor ao DTBJJ APP foi criado.</p>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#a1a1aa;">Para concluir o cadastro, crie sua senha pelo botão abaixo.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px;">
                <a href="${linkSeguro}" style="display:block;background:#b91c1c;color:#ffffff;text-decoration:none;text-align:center;font-size:15px;font-weight:700;padding:16px 20px;border-radius:16px;">Criar minha senha</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">Depois de criar sua senha, você poderá acessar suas turmas, alunos, chamadas, notícias e eventos pelo aplicativo.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;border-top:1px solid #27272a;background:#0d0d0d;">
                <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#ffffff;">Ainda não instalou o DTBJJ APP?</p>
                <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:#71717a;">Abra o guia de instalação no celular e siga o passo a passo para iPhone ou Android.</p>
                <a href="${INSTALL_URL}" style="font-size:13px;font-weight:700;color:#ef4444;text-decoration:none;">Ver como instalar o DTBJJ APP →</a>
              </td>
            </tr>
          </table>
          <p style="max-width:560px;margin:18px auto 0;font-size:11px;line-height:1.6;color:#52525b;text-align:center;">Este convite foi enviado porque um administrador da DTBJJ criou um acesso de professor para este e-mail.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

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
      return json(
        { error: "Sessão inválida. Entre novamente e tente de novo." },
        401
      );
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

    const { data, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo: APP_URL + "/?type=invite",
        data: {
          nome,
          academia_id: perfil.academia_id,
        },
      },
    });

    if (error) {
      const mensagem = error.message.toLowerCase();

      if (
        mensagem.includes("already") ||
        mensagem.includes("registered") ||
        mensagem.includes("exists")
      ) {
        return json({ error: "Já existe uma conta com este e-mail." }, 409);
      }

      return json(
        {
          error: "Não foi possível preparar o convite do professor.",
          detail: error.message,
        },
        400
      );
    }

    const inviteLink = data.properties?.action_link;

    if (!inviteLink) {
      return json(
        { error: "O convite foi criado, mas o link não pôde ser gerado." },
        500
      );
    }

    return json({
      ok: true,
      user_id: data.user?.id,
      email,
      invite_link: inviteLink,
      email_html: emailProfessor(nome, inviteLink),
      email_status: "preview",
      message: "Convite preparado. O e-mail automático ainda não foi enviado.",
    });
  } catch (error) {
    return json(
      {
        error: "Erro interno ao criar professor.",
        detail: error instanceof Error ? error.message : "Erro desconhecido",
      },
      500
    );
  }
});
