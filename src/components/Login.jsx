import { useState } from "react";
import { supabase } from "../lib/supabase";
import CadastroModal from "./CadastroModal";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [modalCadastro, setModalCadastro] = useState(false);
  const [modalRecuperacao, setModalRecuperacao] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false);
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState("");
  const [erroRecuperacao, setErroRecuperacao] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    setErro("");

    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado || !senha) {
      setErro("Informe seu e-mail e sua senha.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailNormalizado,
        password: senha,
      });

      if (error) {
        setErro("E-mail ou senha inválidos.");
      }
    } catch (error) {
      console.error("Erro ao entrar:", error);
      setErro("Não foi possível entrar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function abrirRecuperacao() {
    setEmailRecuperacao(email.trim().toLowerCase());
    setMensagemRecuperacao("");
    setErroRecuperacao("");
    setModalRecuperacao(true);
  }

  async function enviarRecuperacao(event) {
    event.preventDefault();
    setMensagemRecuperacao("");
    setErroRecuperacao("");

    const emailNormalizado = emailRecuperacao.trim().toLowerCase();

    if (!emailNormalizado) {
      setErroRecuperacao("Informe seu e-mail.");
      return;
    }

    setEnviandoRecuperacao(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        emailNormalizado,
        { redirectTo: window.location.origin }
      );

      if (error) throw error;

      setMensagemRecuperacao(
        "Enviamos um link para redefinir sua senha. Confira seu e-mail."
      );
    } catch (error) {
      console.error("Erro ao solicitar recuperação:", error);
      setErroRecuperacao(
        "Não foi possível enviar o link agora. Tente novamente."
      );
    } finally {
      setEnviandoRecuperacao(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-sm flex-col justify-center">
        <header className="mb-8 text-center">
          <img
            src="/dtbjjapplogo.png"
            className="mx-auto mb-5 h-32 w-32 object-contain"
            alt="Dream Team Brazilian Jiu-Jitsu"
          />

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
            Dream Team BJJ
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Entre para acessar alunos, turmas e chamadas.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-[#111111] p-6 shadow-2xl">
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="mb-2 block text-sm text-gray-400">E-mail</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-xl border border-white/5 bg-[#1A1A1A] px-4 text-white outline-none transition focus:border-red-700"
              />
            </div>

            <div className="mb-2">
              <label className="mb-2 block text-sm text-gray-400">Senha</label>
              <input
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                className="h-12 w-full rounded-xl border border-white/5 bg-[#1A1A1A] px-4 text-white outline-none transition focus:border-red-700"
              />
            </div>

            <div className="mb-5 text-right">
              <button
                type="button"
                onClick={abrirRecuperacao}
                className="text-sm font-medium text-red-500 transition hover:text-red-400"
              >
                Esqueci minha senha
              </button>
            </div>

            {erro && (
              <div className="mb-4 rounded-xl border border-red-900/30 bg-red-950/30 p-3 text-sm text-red-300">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-red-700 font-semibold transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-gray-400">Ainda não possui acesso?</p>
            <button
              type="button"
              onClick={() => setModalCadastro(true)}
              className="mt-2 font-semibold text-red-500 transition-colors hover:text-red-400"
            >
              Criar conta
            </button>
          </div>
        </section>
      </div>

      <CadastroModal
        aberto={modalCadastro}
        fechar={() => setModalCadastro(false)}
      />

      {modalRecuperacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111111] p-6 shadow-2xl">
            <h2 className="text-2xl font-bold">Recuperar senha</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Informe o e-mail da sua conta. Você receberá um link seguro para criar uma nova senha.
            </p>

            <form onSubmit={enviarRecuperacao} className="mt-6">
              <label className="mb-2 block text-sm text-zinc-400">E-mail</label>
              <input
                type="email"
                autoComplete="email"
                value={emailRecuperacao}
                onChange={(event) => setEmailRecuperacao(event.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 text-white outline-none transition focus:border-red-700"
              />

              {erroRecuperacao && (
                <div className="mt-4 rounded-xl border border-red-900/30 bg-red-950/30 p-3 text-sm text-red-300">
                  {erroRecuperacao}
                </div>
              )}

              {mensagemRecuperacao && (
                <div className="mt-4 rounded-xl border border-emerald-900/30 bg-emerald-950/30 p-3 text-sm text-emerald-300">
                  {mensagemRecuperacao}
                </div>
              )}

              <button
                type="submit"
                disabled={enviandoRecuperacao}
                className="mt-5 h-12 w-full rounded-xl bg-red-700 font-semibold transition hover:bg-red-600 disabled:opacity-50"
              >
                {enviandoRecuperacao ? "Enviando..." : "Enviar link"}
              </button>

              <button
                type="button"
                onClick={() => setModalRecuperacao(false)}
                className="mt-3 h-11 w-full rounded-xl bg-white/5 text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
              >
                Voltar
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
