import { supabase } from "@/lib/supabase";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const EXTENSAO_POR_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export async function uploadAvatar(file, usuario) {
  if (!file) throw new Error("Nenhum arquivo selecionado.");

  const extensao = EXTENSAO_POR_MIME[file.type];

  if (!extensao) {
    throw new Error("Use uma imagem JPG, PNG, WebP, HEIC ou HEIF.");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }

  if (!usuario?.auth_id) {
    throw new Error("Usuário inválido para envio de foto.");
  }

  const caminho = usuario.auth_id + "/avatar." + extensao;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(caminho, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(caminho);

  const foto = data.publicUrl + "?t=" + Date.now();

  const { error: updateError } = await supabase
    .from("usuarios")
    .update({ foto })
    .eq("auth_id", usuario.auth_id);

  if (updateError) throw updateError;

  return foto;
}
