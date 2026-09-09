import { useState } from "react";
import { supabase } from "../lib/supabase";
import CadastroModal from "./CadastroModal";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [modalCadastro, setModalCadastro] = useState(false);

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

            <div className="mb-5">
              <label className="mb-2 block text-sm text-gray-400">Senha</label>
              <input
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
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
    </main>
  );
}
