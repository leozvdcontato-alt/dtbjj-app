import { useState } from "react";
import { supabase } from "../lib/supabase";

const ESTADO_INICIAL = {
  nome: "",
  email: "",
  telefone: "",
  cpf: "",
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
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function fecharModal() {
    if (loading) return;
    setForm(ESTADO_INICIAL);
    setErro("");
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

    if (!nome || !email || !codigo) {
      setErro("Preencha nome, e-mail e código da turma.");
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

    setLoading(true);

    try {
      const { data: turmas, error: erroTurma } = await supabase.rpc(
        "validar_codigo_turma",
        { p_codigo: codigo }
      );

      if (erroTurma) throw erroTurma;

      const turma = turmas?.[0];
      if (!turma) {
        setErro("Código da turma inválido.");
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: form.senha,
        options: {
          data: {
            nome,
            telefone: form.telefone.trim() || null,
            cpf: form.cpf.trim() || null,
            codigo_turma: codigo,
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

      setForm(ESTADO_INICIAL);
      setSucesso(
        "Conta criada para " +
          turma.turma_nome +
          ". Confirme seu e-mail para entrar, se solicitado."
      );
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      setErro("Não foi possível criar sua conta agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-12 w-full rounded-xl border border-white/5 bg-[#1A1A1A] px-4 text-white outline-none transition focus:border-red-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111111] p-6 shadow-2xl">
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
            Acesso de aluno
          </p>
          <h2 className="text-2xl font-bold text-white">Criar conta</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            O cadastro público é exclusivo para alunos. Use o código da turma fornecido pela DTBJJ.
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
              className="h-12 w-full rounded-xl bg-red-700 font-semibold"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form onSubmit={criarConta} className="space-y-4">
            <Campo label="Nome completo">
              <input
                type="text"
                autoComplete="name"
                value={form.nome}
                onChange={(event) => atualizarCampo("nome", event.target.value)}
                className={inputClass}
              />
            </Campo>

            <Campo label="E-mail">
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => atualizarCampo("email", event.target.value)}
                className={inputClass}
              />
            </Campo>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Telefone">
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.telefone}
                  onChange={(event) => atualizarCampo("telefone", event.target.value)}
                  className={inputClass}
                />
              </Campo>

              <Campo label="CPF">
                <input
                  inputMode="numeric"
                  value={form.cpf}
                  onChange={(event) => atualizarCampo("cpf", event.target.value)}
                  className={inputClass}
                />
              </Campo>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Senha">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.senha}
                  onChange={(event) => atualizarCampo("senha", event.target.value)}
                  className={inputClass}
                />
              </Campo>

              <Campo label="Confirmar senha">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmarSenha}
                  onChange={(event) =>
                    atualizarCampo("confirmarSenha", event.target.value)
                  }
                  className={inputClass}
                />
              </Campo>
            </div>

            <Campo label="Código da turma">
              <input
                type="text"
                autoCapitalize="characters"
                value={form.codigo}
                onChange={(event) =>
                  atualizarCampo("codigo", event.target.value.toUpperCase())
                }
                placeholder="Ex.: DT-AB12CD34"
                className={inputClass + " font-medium uppercase tracking-wide"}
              />
            </Campo>

            {erro ? (
              <div className="rounded-xl border border-red-900/30 bg-red-950/30 p-3 text-sm text-red-300">
                {erro}
              </div>
            ) : null}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="h-12 flex-1 rounded-xl bg-red-700 font-semibold disabled:opacity-50"
              >
                {loading ? "Criando conta..." : "Criar conta"}
              </button>
              <button
                type="button"
                onClick={fecharModal}
                disabled={loading}
                className="h-12 rounded-xl bg-[#1A1A1A] px-5 font-medium text-gray-300"
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

function Campo({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-400">{label}</label>
      {children}
    </div>
  );
}
