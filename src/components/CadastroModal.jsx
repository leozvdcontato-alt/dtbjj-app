import { useState } from "react";
import { supabase } from "../lib/supabase";

const ESTADO_INICIAL = {
  nome: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  codigo: "",
};

export default function CadastroModal({ aberto, fechar }) {
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  if (!aberto) return null;

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function limparFormulario() {
    setForm(ESTADO_INICIAL);
    setErro("");
  }

  function fecharModal() {
    if (loading) return;
    limparFormulario();
    setSucesso("");
    fechar();
  }

  async function criarConta(event) {
    event.preventDefault();

    const nome = form.nome.trim();
    const email = form.email.trim().toLowerCase();
    const codigo = form.codigo.trim().toUpperCase();

    setErro("");
    setSucesso("");

    if (!nome) {
      setErro("Informe seu nome.");
      return;
    }

    if (!email) {
      setErro("Informe seu e-mail.");
      return;
    }

    if (form.senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (form.senha !== form.confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (!codigo) {
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
        .maybeSingle();

      if (erroAcademia) {
        throw erroAcademia;
      }

      if (!academia) {
        setErro("Código da academia inválido.");
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: form.senha,
        options: {
          data: {
            nome,
            academia_id: academia.id,
          },
        },
      });

      if (authError) {
        setErro(authError.message);
        return;
      }

      if (!authData.user) {
        setErro("Não foi possível criar sua conta. Tente novamente.");
        return;
      }

      limparFormulario();
      setSucesso(
        `Conta criada para ${academia.nome}. Agora você já pode fazer login.`
      );
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      setErro("Não foi possível criar sua conta agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111111] p-6 shadow-2xl">
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
            Acesso DTBJJ
          </p>
          <h2 className="text-2xl font-bold text-white">Criar conta</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Use o código fornecido pela academia para vincular sua conta.
          </p>
        </div>

        {sucesso ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/30 p-4 text-sm leading-6 text-emerald-300">
              {sucesso}
            </div>

            <button
              type="button"
              onClick={fecharModal}
              className="h-12 w-full rounded-xl bg-red-700 font-semibold text-white transition hover:bg-red-600"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form onSubmit={criarConta} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-gray-400">Nome completo</label>
              <input
                type="text"
                autoComplete="name"
                value={form.nome}
                onChange={(event) => atualizarCampo("nome", event.target.value)}
                className="h-12 w-full rounded-xl border border-white/5 bg-[#1A1A1A] px-4 text-white outline-none transition focus:border-red-700"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">E-mail</label>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => atualizarCampo("email", event.target.value)}
                className="h-12 w-full rounded-xl border border-white/5 bg-[#1A1A1A] px-4 text-white outline-none transition focus:border-red-700"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Senha</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.senha}
                  onChange={(event) => atualizarCampo("senha", event.target.value)}
                  className="h-12 w-full rounded-xl border border-white/5 bg-[#1A1A1A] px-4 text-white outline-none transition focus:border-red-700"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">Confirmar senha</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmarSenha}
                  onChange={(event) =>
                    atualizarCampo("confirmarSenha", event.target.value)
                  }
                  className="h-12 w-full rounded-xl border border-white/5 bg-[#1A1A1A] px-4 text-white outline-none transition focus:border-red-700"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Código da academia
              </label>
              <input
                type="text"
                autoCapitalize="characters"
                value={form.codigo}
                onChange={(event) =>
                  atualizarCampo("codigo", event.target.value.toUpperCase())
                }
                placeholder="Ex.: DTBJJ2026"
                className="h-12 w-full rounded-xl border border-white/5 bg-[#1A1A1A] px-4 font-medium uppercase tracking-wide text-white outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-600 focus:border-red-700"
              />
            </div>

            {erro && (
              <div className="rounded-xl border border-red-900/30 bg-red-950/30 p-3 text-sm text-red-300">
                {erro}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="h-12 flex-1 rounded-xl bg-red-700 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Criando conta..." : "Criar conta"}
              </button>

              <button
                type="button"
                onClick={fecharModal}
                disabled={loading}
                className="h-12 rounded-xl bg-[#1A1A1A] px-5 font-medium text-gray-300 transition hover:bg-[#222222] disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
