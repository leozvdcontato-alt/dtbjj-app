import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function CadastroModal({
  aberto,
  fechar,
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [codigo, setCodigo] = useState("");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  if (!aberto) return null;

  async function criarConta() {

  setErro("");

  if (!nome.trim()) {
    setErro("Informe seu nome.");
    return;
  }

  if (!email.trim()) {
    setErro("Informe seu e-mail.");
    return;
  }

  if (senha.length < 6) {
    setErro("A senha deve ter pelo menos 6 caracteres.");
    return;
  }

  if (senha !== confirmarSenha) {
    setErro("As senhas não coincidem.");
    return;
  }

  if (!codigo.trim()) {
    setErro("Informe o código da academia.");
    return;
  }

  setLoading(true);

try {

  const { data: academia, error: erroAcademia } = await supabase
    .from("academias")
    .select("id, nome")
    .eq("codigo_convite", codigo)
    .eq("status", "Ativa")
    .single();

  if (erroAcademia || !academia) {
    setErro("Código da academia inválido.");
    return;
  }

  console.log("Academia encontrada:", academia);

const { data: authData, error: authError } =
  await supabase.auth.signUp({
    email,
    password: senha,
  });

  const {
  data: { session },
} = await supabase.auth.getSession();

console.log("Sessão:", session);

if (authError) {
  setErro(authError.message);
  return;
}

console.log("Usuário Auth:", authData.user);

const { error: usuarioError } = await supabase
  .from("usuarios")
  .insert({
    auth_id: authData.user.id,
    nome,
    cargo: "Aluno",
    status: "Ativo",
    academia_id: academia.id,
  });

if (usuarioError) {
  setErro(usuarioError.message);
  return;
}

alert("Conta criada com sucesso! Agora faça seu login.");

fechar();

setNome("");
setEmail("");
setSenha("");
setConfirmarSenha("");
setCodigo("");

} catch (err) {

  console.error(err);
  setErro("Erro ao validar o código da academia.");

} finally {

  setLoading(false);

}

  console.log({
    nome,
    email,
    senha,
    codigo,
  });

}
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">

      <div className="w-full max-w-md rounded-3xl bg-[#111111] border border-red-900/30 p-6">

        <h2 className="text-2xl font-bold text-white mb-1">
          Criar conta
        </h2>

        <p className="text-sm text-gray-400 mb-6">
          Preencha os dados abaixo para criar sua conta.
        </p>

        {erro && (
          <div className="bg-red-900/30 text-red-300 text-sm rounded-xl p-3 mb-4">
            {erro}
          </div>
        )}

        <div className="space-y-4">

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Nome completo
            </label>

            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-12 rounded-xl bg-[#1A1A1A] px-4 outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              E-mail
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-xl bg-[#1A1A1A] px-4 outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Senha
            </label>

            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full h-12 rounded-xl bg-[#1A1A1A] px-4 outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Confirmar senha
            </label>

            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full h-12 rounded-xl bg-[#1A1A1A] px-4 outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Código da Academia
            </label>

            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ex.: DTBJJ2026"
              className="w-full h-12 rounded-xl bg-[#1A1A1A] px-4 outline-none text-white"
            />
          </div>

        </div>

        <div className="flex gap-3 mt-8">

          <button
  onClick={criarConta}
  disabled={loading}
  className="flex-1 h-12 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-50 font-semibold transition"
>
  {loading ? "Criando..." : "Criar conta"}
</button>

          <button
            onClick={fechar}
            disabled={loading}
            className="h-12 px-5 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] disabled:opacity-50 transition"
          >
            Cancelar
          </button>

        </div>

      </div>

    </div>
  );
}