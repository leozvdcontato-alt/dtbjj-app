import { Loader2, Save, X } from "lucide-react";
import MultiSelect from "./ui/MultiSelect";
import { FAIXAS } from "@/lib/faixas";

const inputClass =
  "h-12 w-full rounded-2xl border border-white/10 bg-[#171717] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-700 focus:ring-2 focus:ring-red-950";

export default function AlunoModal({
  modal,
  editando,
  form,
  setForm,
  salvarAluno,
  setModal,
  turmas,
  salvando,
}) {
  if (!modal) return null;

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
    >
      <form
        onSubmit={salvarAluno}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-aluno-modal"
        className="flex h-[100dvh] w-full max-w-xl flex-col overflow-hidden bg-[#101010] sm:h-auto sm:max-h-[92dvh] sm:rounded-3xl sm:border sm:border-white/10"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-[max(20px,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500">
              Alunos
            </p>
            <h2 id="titulo-aluno-modal" className="mt-1 text-xl font-bold">
              {editando ? "Editar aluno" : "Novo aluno"}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setModal(false)}
            aria-label="Fechar"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-5">
            <div>
              <label htmlFor="aluno-nome" className="mb-2 block text-sm font-medium text-zinc-300">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                id="aluno-nome"
                value={form.nome}
                onChange={(event) => atualizarCampo("nome", event.target.value)}
                autoComplete="name"
                required
                placeholder="Nome completo"
                className={inputClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="aluno-cpf" className="mb-2 block text-sm font-medium text-zinc-300">
                  CPF
                </label>
                <input
                  id="aluno-cpf"
                  value={form.cpf}
                  onChange={(event) => atualizarCampo("cpf", event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Opcional"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="aluno-telefone" className="mb-2 block text-sm font-medium text-zinc-300">
                  Telefone
                </label>
                <input
                  id="aluno-telefone"
                  value={form.telefone}
                  onChange={(event) => atualizarCampo("telefone", event.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Opcional"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="aluno-faixa" className="mb-2 block text-sm font-medium text-zinc-300">
                  Faixa
                </label>
                <select
                  id="aluno-faixa"
                  value={form.faixa}
                  onChange={(event) => atualizarCampo("faixa", event.target.value)}
                  className={inputClass}
                >
                  {FAIXAS.map((faixa) => (
                    <option key={faixa} value={faixa}>
                      {faixa}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="aluno-graus" className="mb-2 block text-sm font-medium text-zinc-300">
                  Graus
                </label>
                <select
                  id="aluno-graus"
                  value={form.graus}
                  onChange={(event) => atualizarCampo("graus", Number(event.target.value))}
                  className={inputClass}
                >
                  <option value={0}>Sem grau</option>
                  <option value={1}>1 grau</option>
                  <option value={2}>2 graus</option>
                  <option value={3}>3 graus</option>
                  <option value={4}>4 graus</option>
                </select>
              </div>

              <div>
                <label htmlFor="aluno-categoria" className="mb-2 block text-sm font-medium text-zinc-300">
                  Categoria
                </label>
                <select
                  id="aluno-categoria"
                  value={form.categoria}
                  onChange={(event) => atualizarCampo("categoria", event.target.value)}
                  className={inputClass}
                >
                  <option value="Kids">Kids</option>
                  <option value="Juvenil">Juvenil</option>
                  <option value="Adulto">Adulto</option>
                </select>
              </div>

              <div>
                <label htmlFor="aluno-status" className="mb-2 block text-sm font-medium text-zinc-300">
                  Status
                </label>
                <select
                  id="aluno-status"
                  value={form.status}
                  onChange={(event) => atualizarCampo("status", event.target.value)}
                  className={inputClass}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Turmas
              </label>
              <MultiSelect
                options={turmas}
                value={form.turmas}
                onChange={(selecionadas) => atualizarCampo("turmas", selecionadas)}
                placeholder="Selecione as turmas"
              />
              <p className="mt-2 text-xs leading-5 text-zinc-600">
                A matrícula será atualizada junto com os dados do aluno.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-white/10 bg-[#101010] px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
          <button
            type="button"
            onClick={() => setModal(false)}
            disabled={salvando}
            className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={salvando}
            className="flex h-12 flex-[1.25] items-center justify-center gap-2 rounded-2xl bg-red-700 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            {salvando ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} />
                Salvar aluno
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
