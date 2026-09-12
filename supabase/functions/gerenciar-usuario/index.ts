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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
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
      return json({ error: "Sessão inválida." }, 401);
    }

    const { data: perfil, error: perfilError } = await admin
      .from("usuarios")
      .select("id,academia_id,cargo,status")
      .eq("auth_id", user.id)
      .single();

    if (
      perfilError ||
      !perfil ||
      perfil.cargo !== "Administrador" ||
      perfil.status !== "Ativo"
    ) {
      return json({ error: "Apenas administradores podem executar esta ação." }, 403);
    }

    const body = await req.json();
    const acao = String(body?.acao || "");

    if (acao === "status_professor") {
      const usuarioId = String(body?.usuario_id || "");
      const status = String(body?.status || "");

      if (!["Ativo", "Inativo"].includes(status)) {
        return json({ error: "Status inválido." }, 400);
      }

      const { data: professor, error: professorError } = await admin
        .from("usuarios")
        .select("id")
        .eq("id", usuarioId)
        .eq("academia_id", perfil.academia_id)
        .eq("cargo", "Professor")
        .maybeSingle();

      if (professorError || !professor) {
        return json({ error: "Professor não encontrado." }, 404);
      }

      const { error: atualizarError } = await admin
        .from("usuarios")
        .update({ status })
        .eq("id", usuarioId);

      if (atualizarError) throw atualizarError;

      return json({ ok: true, status });
    }

    if (acao === "excluir_professor") {
      const usuarioId = String(body?.usuario_id || "");

      const { data: professor, error: professorError } = await admin
        .from("usuarios")
        .select("id,auth_id,email")
        .eq("id", usuarioId)
        .eq("academia_id", perfil.academia_id)
        .eq("cargo", "Professor")
        .maybeSingle();

      if (professorError || !professor) {
        return json({ error: "Professor não encontrado." }, 404);
      }

      const { error: excluirPerfilError } = await admin
        .from("usuarios")
        .delete()
        .eq("id", professor.id);

      if (excluirPerfilError) throw excluirPerfilError;

      if (professor.email) {
        await admin
          .from("professor_criacoes_pendentes")
          .delete()
          .eq("email", professor.email);
      }

      if (professor.auth_id) {
        const { error: authDeleteError } =
          await admin.auth.admin.deleteUser(professor.auth_id);
        if (authDeleteError) {
          console.error("Perfil excluído, mas falhou auth.deleteUser:", authDeleteError);
          return json({
            ok: true,
            warning: "Perfil removido, mas a conta de autenticação exigirá limpeza manual.",
          });
        }
      }

      return json({ ok: true });
    }

    if (acao === "excluir_aluno") {
      const alunoId = Number(body?.aluno_id);
      if (!Number.isFinite(alunoId)) {
        return json({ error: "Aluno inválido." }, 400);
      }

      const { data: aluno, error: alunoError } = await admin
        .from("alunos")
        .select("id,nome")
        .eq("id", alunoId)
        .eq("academia_id", perfil.academia_id)
        .maybeSingle();

      if (alunoError || !aluno) {
        return json({ error: "Aluno não encontrado." }, 404);
      }

      const { data: usuarioAluno } = await admin
        .from("usuarios")
        .select("id,auth_id")
        .eq("aluno_id", alunoId)
        .eq("academia_id", perfil.academia_id)
        .maybeSingle();

      if (usuarioAluno?.id) {
        const { error: excluirUsuarioError } = await admin
          .from("usuarios")
          .delete()
          .eq("id", usuarioAluno.id);

        if (excluirUsuarioError) throw excluirUsuarioError;
      }

      const { error: excluirAlunoError } = await admin
        .from("alunos")
        .delete()
        .eq("id", alunoId)
        .eq("academia_id", perfil.academia_id);

      if (excluirAlunoError) throw excluirAlunoError;

      if (usuarioAluno?.auth_id) {
        const { error: authDeleteError } =
          await admin.auth.admin.deleteUser(usuarioAluno.auth_id);

        if (authDeleteError) {
          console.error("Aluno excluído, mas falhou auth.deleteUser:", authDeleteError);
          return json({
            ok: true,
            warning: "Aluno removido, mas a conta de autenticação exigirá limpeza manual.",
          });
        }
      }

      return json({ ok: true });
    }

    return json({ error: "Ação inválida." }, 400);
  } catch (error) {
    console.error(error);
    return json(
      {
        error: "Não foi possível concluir a ação.",
        detail: error instanceof Error ? error.message : "Erro desconhecido",
      },
      500
    );
  }
});
