import { useState } from "react";
import { supabase } from "@/lib/supabase";
import SenhaInput from "./ui/SenhaInput";
import RequisitosSenha from "./ui/RequisitosSenha";
import { senhaValida, TEXTO_REGRA_SENHA } from "@/lib/senha";

export default function ResetSenha({ onConcluido, modo = "recuperacao" }) {
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const primeiroAcesso = modo === "primeiro_acesso";
  const convite = modo === "convite";

  async function salvarNovaSenha(event) {
    event.preventDefault();
    setErro("");

    if (!senhaValida(senha)) {
      setErro(TEXTO_REGRA_SENHA);
      return;
    }

    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: senha,
      });

      if (error) throw error;

      if (primeiroAcesso) {
        const { error: confirmarError } = await supabase.rpc(
          "confirmar_troca_senha_professor"
        );
        if (confirmarError) throw confirmarError;

        setSenha("");
        setConfirmar("");
        await onConcluido?.();
        return;
      }

      setSucesso(true);
      setSenha("");
      setConfirmar("");
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      setErro(
        primeiroAcesso
          ? "Não foi possível concluir a troca de senha. Tente novamente."
          : "Não foi possível redefinir a senha. Solicite um novo link e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  async function voltarAoLogin() {
    if (primeiroAcesso) {
      await onConcluido?.();
      return;
    }

    await supabase.auth.signOut();
    window.history.replaceState({}, document.title, window.location.pathname);
    onConcluido?.();
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-sm flex-col justify-center">
        <header className="mb-8 text-center">
          <img
            src="/dtbjjapplogo.png"
            className="mx-auto mb-5 h-28 w-28 object-contain"
            alt="Dream Team Brazilian Jiu-Jitsu"
          />

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
            Dream Team BJJ
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {primeiroAcesso
              ? "Crie sua senha pessoal"
              : convite
                ? "Crie sua senha"
                : "Crie uma nova senha"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            {primeiroAcesso
              ? "Você entrou com uma senha temporária. Para continuar, crie uma senha pessoal."
              : convite
                ? "Seu acesso como professor está pronto. Defina sua senha para concluir o cadastro."
                : "Escolha uma nova senha para voltar a acessar sua conta."}
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-[#111111] p-6 shadow-2xl">
          {sucesso ? (
            <div className="text-center">
              <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/30 p-4 text-sm text-emerald-300">
                {primeiroAcesso
                  ? "Senha pessoal criada com sucesso."
                  : convite
                    ? "Senha criada com sucesso."
                    : "Senha alterada com sucesso."}
              </div>

              <button
                type="button"
                onClick={voltarAoLogin}
                className="mt-5 h-12 w-full rounded-xl bg-red-700 font-semibold transition hover:bg-red-600"
              >
                {primeiroAcesso ? "Continuar para o app" : "Entrar no DTBJJ APP"}
              </button>
            </div>
          ) : (
            <form onSubmit={salvarNovaSenha}>
              <div className="mb-4">
                <label className="mb-2 block text-sm text-gray-400">Nova senha</label>
                <SenhaInput
                  autoComplete="new-password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  className="h-12 w-full rounded-xl border border-white/5 bg-[#1A1A1A] px-4 text-white outline-none transition focus:border-red-700"
                />
                <RequisitosSenha senha={senha} />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm text-gray-400">Confirmar nova senha</label>
                <SenhaInput
                  autoComplete="new-password"
                  value={confirmar}
                  onChange={(event) => setConfirmar(event.target.value)}
                  className="h-12 w-full rounded-xl border border-white/5 bg-[#1A1A1A] px-4 text-white outline-none transition focus:border-red-700"
                />
              </div>

              {erro && (
                <div className="mb-4 rounded-xl border border-red-900/30 bg-red-950/30 p-3 text-sm text-red-300">
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-red-700 font-semibold transition hover:bg-red-600 disabled:opacity-50"
              >
                {loading
                  ? "Salvando..."
                  : primeiroAcesso || convite
                    ? "Criar minha senha"
                    : "Salvar nova senha"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
