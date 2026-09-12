import { supabase } from "@/lib/supabase";

function urlBase64ParaUint8Array(valor) {
  const padding = "=".repeat((4 - (valor.length % 4)) % 4);
  const base64 = (valor + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function pushDisponivel() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function salvarSubscription(usuarioId, subscription) {
  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      usuario_id: usuarioId,
      endpoint: subscription.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  if (error) throw error;
}

export async function statusPush(usuarioId) {
  if (!pushDisponivel()) return "indisponivel";
  if (Notification.permission === "denied") return "negado";

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription && Notification.permission === "granted") {
    if (usuarioId) await salvarSubscription(usuarioId, subscription);
    return "ativo";
  }

  return "inativo";
}

export async function ativarPush(usuarioId) {
  if (!pushDisponivel()) throw new Error("Notificações não são suportadas neste aparelho.");

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") {
    throw new Error("Permissão de notificações não concedida.");
  }

  const { data: chavePublica, error: chaveError } = await supabase.rpc(
    "chave_publica_push"
  );
  if (chaveError || !chavePublica) {
    throw chaveError || new Error("Chave de notificação indisponível.");
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ParaUint8Array(chavePublica),
    });
  }

  await salvarSubscription(usuarioId, subscription);
  return true;
}
