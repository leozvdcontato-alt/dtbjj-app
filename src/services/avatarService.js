import { supabase } from "@/lib/supabase";

export async function uploadAvatar(file, usuario) {
  if (!file) throw new Error("Nenhum arquivo selecionado.");

  const extensao = file.name.split(".").pop();
  const caminho = `${usuario.auth_id}/avatar.${extensao}`;

  // Upload
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(caminho, file, {
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // URL pública
  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(caminho);

  const foto = `${data.publicUrl}?t=${Date.now()}`;

  // Atualiza usuário
  const { data: usuarioAtualizado, error: updateError } = await supabase
    .from("usuarios")
    .update({
      foto,
    })
    .eq("auth_id", usuario.auth_id)
    .select();

  if (updateError) throw updateError;

  return foto;
}