import QRCode from "npm:qrcode@1.5.4";
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

function escapar(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function incorporarQr(qrSvg: string, x: number, y: number, size: number) {
  const viewBox = qrSvg.match(/viewBox="([^"]+)"/)?.[1] || "0 0 41 41";
  const inner = qrSvg
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");

  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${viewBox}">${inner}</svg>`;
}

function montarA4(nomeLocal: string, qrSvg: string) {
  const qr = incorporarQr(qrSvg, 540, 1120, 1400);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 2480 3508">
    <rect width="2480" height="3508" fill="#ffffff"/>
    <rect width="2480" height="220" fill="#991b1b"/>
    <text x="160" y="145" fill="#ffffff" font-size="94" font-family="Arial, Helvetica, sans-serif" font-weight="800">DTBJJ</text>
    <text x="1240" y="610" text-anchor="middle" fill="#18181b" font-size="118" font-family="Arial, Helvetica, sans-serif" font-weight="800">FAÇA SEU CHECK-IN AQUI</text>
    <text x="1240" y="760" text-anchor="middle" fill="#71717a" font-size="62" font-family="Arial, Helvetica, sans-serif">Abra o app e escaneie o QR Code abaixo</text>
    <rect x="430" y="1010" width="1620" height="1620" rx="80" fill="#fafafa" stroke="#e4e4e7" stroke-width="8"/>
    ${qr}
    <text x="1240" y="2930" text-anchor="middle" fill="#991b1b" font-size="56" font-family="Arial, Helvetica, sans-serif" font-weight="700">LOCAL</text>
    <text x="1240" y="3070" text-anchor="middle" fill="#18181b" font-size="104" font-family="Arial, Helvetica, sans-serif" font-weight="800">${escapar(nomeLocal)}</text>
    <text x="1240" y="3270" text-anchor="middle" fill="#a1a1aa" font-size="48" font-family="Arial, Helvetica, sans-serif">Check-in disponível somente no horário da sua aula</text>
  </svg>`;
}

function montarStory(nomeLocal: string, qrSvg: string) {
  const qr = incorporarQr(qrSvg, 190, 620, 700);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#090909"/>
        <stop offset="1" stop-color="#18181b"/>
      </linearGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#bg)"/>
    <circle cx="970" cy="110" r="180" fill="#991b1b" opacity="0.24"/>
    <text x="80" y="130" fill="#ef4444" font-size="44" font-family="Arial, Helvetica, sans-serif" font-weight="800">DTBJJ</text>
    <text x="540" y="330" text-anchor="middle" fill="#ffffff" font-size="82" font-family="Arial, Helvetica, sans-serif" font-weight="800">FAÇA SEU</text>
    <text x="540" y="425" text-anchor="middle" fill="#ef4444" font-size="98" font-family="Arial, Helvetica, sans-serif" font-weight="900">CHECK-IN</text>
    <text x="540" y="505" text-anchor="middle" fill="#a1a1aa" font-size="38" font-family="Arial, Helvetica, sans-serif">Aponte a câmera para o QR Code</text>
    <rect x="140" y="570" width="800" height="800" rx="56" fill="#ffffff"/>
    ${qr}
    <text x="540" y="1510" text-anchor="middle" fill="#71717a" font-size="34" font-family="Arial, Helvetica, sans-serif" font-weight="700">LOCAL</text>
    <text x="540" y="1605" text-anchor="middle" fill="#ffffff" font-size="68" font-family="Arial, Helvetica, sans-serif" font-weight="800">${escapar(nomeLocal)}</text>
    <text x="540" y="1730" text-anchor="middle" fill="#a1a1aa" font-size="34" font-family="Arial, Helvetica, sans-serif">Entre no app e registre sua presença</text>
  </svg>`;
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
      return json({ error: "Sessão inválida." }, 401);
    }

    const { data: perfil, error: perfilError } = await admin
      .from("usuarios")
      .select("academia_id,cargo,status")
      .eq("auth_id", user.id)
      .single();

    if (
      perfilError ||
      !perfil ||
      !["Administrador", "Professor"].includes(perfil.cargo) ||
      perfil.status !== "Ativo"
    ) {
      return json({ error: "Sem permissão para acessar os QR Codes." }, 403);
    }

    const body = await req.json();
    const localId = Number(body?.local_id);
    const formato =
      body?.formato === "story" || body?.formato === "qr"
        ? body.formato
        : "a4";

    if (!Number.isInteger(localId) || localId <= 0) {
      return json({ error: "Local inválido." }, 400);
    }

    const { data: local, error: localError } = await admin
      .from("locais")
      .select("id,nome,token_qr,ativo,academia_id")
      .eq("id", localId)
      .eq("academia_id", perfil.academia_id)
      .single();

    if (localError || !local || !local.ativo) {
      return json({ error: "Local não encontrado ou inativo." }, 404);
    }

    const link = `https://dtbjj-app.vercel.app/?checkin=${local.token_qr}`;
    const qrSvg = await QRCode.toString(link, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });

    const svg =
      formato === "qr"
        ? qrSvg
        : formato === "story"
          ? montarStory(local.nome, qrSvg)
          : montarA4(local.nome, qrSvg);

    return json({
      svg,
      formato,
      nome_local: local.nome,
      filename:
        formato === "qr"
          ? `dtbjj-checkin-${local.id}.svg`
          : formato === "story"
            ? `dtbjj-checkin-${local.id}-story.svg`
            : `dtbjj-checkin-${local.id}-a4.png`,
    });
  } catch {
    return json({ error: "Não foi possível gerar o material agora." }, 500);
  }
});
