import {
  CalendarCheck2,
  IdCard,
  Pencil,
  Phone,
  Users,
  X,
} from "lucide-react";
import Faixa from "./Faixa";
import { normalizarFaixa, rotuloGraus } from "@/lib/faixas";

export default function AlunoPerfil({
  perfilModal,
  perfilAluno,
  editarAluno,
  podeEditar = false,
  setPerfilModal,
  carregando,
}) {
  if (!perfilModal) return null;

  if (carregando || !perfilAluno) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
        <div className="rounded-2xl border border-white/10 bg-[#121212] px-6 py-5 text-sm text-zinc-400">
          Carregando aluno...
        </div>
      </div>
    );
  }

  const { aluno, turmas, totalPresencas, metaGraduacao, faltam, aptoGraduacao } =
    perfilAluno;

  const progresso = Math.min(
    100,
    Math.round((totalPresencas / Math.max(metaGraduacao, 1)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-perfil-aluno"
        className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#101010] sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#101010]/95 px-5 pb-4 pt-5 backdrop-blur-xl sm:px-6">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={
                  "rounded-full px-2.5 py-1 text-xs font-semibold " +
                  (aluno.status === "Ativo"
                    ? "bg-emerald-950/60 text-emerald-400"
                    : "bg-zinc-800 text-zinc-400")
                }
              >
                {aluno.status}
              </span>
              <span className="text-xs font-medium text-zinc-600">
                {aluno.categoria || "Sem categoria"}
              </span>
            </div>

            <h2 id="titulo-perfil-aluno" className="truncate text-2xl font-bold tracking-tight">
              {aluno.nome}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setPerfilModal(false)}
            aria-label="Fechar perfil"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="rounded-3xl border border-white/10 bg-[#151515] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">
              Graduação atual
            </p>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-white">{aluno.faixa || "Branca"}</p>
                <p className="mt-1 text-sm text-zinc-500">{rotuloGraus(aluno.graus)}</p>
              </div>

              <div className="w-28 shrink-0">
                <Faixa
                  faixa={normalizarFaixa(aluno.faixa)}
                  graus={Number(aluno.graus || 0)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-[#151515] p-4">
              <div className="flex items-center gap-2 text-zinc-500">
                <CalendarCheck2 size={16} />
                <span className="text-xs font-medium">Presenças</span>
              </div>
              <p className="mt-3 text-2xl font-bold">{totalPresencas}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#151515] p-4">
              <div className="flex items-center gap-2 text-zinc-500">
                <Users size={16} />
                <span className="text-xs font-medium">Turmas</span>
              </div>
              <p className="mt-3 text-2xl font-bold">{turmas.length}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#151515] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Progresso por presenças</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Meta atual: {metaGraduacao} presenças
                </p>
              </div>

              <span
                className={
                  "rounded-full px-2.5 py-1 text-xs font-semibold " +
                  (aptoGraduacao
                    ? "bg-emerald-950/60 text-emerald-400"
                    : "bg-red-950/50 text-red-400")
                }
              >
                {aptoGraduacao ? "Meta atingida" : "Faltam " + faltam}
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-red-700 transition-all"
                style={{ width: progresso + "%" }}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-300">Turmas</h3>

            {turmas.length ? (
              <div className="flex flex-wrap gap-2">
                {turmas.map((turma) => (
                  <span
                    key={turma.id}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300"
                  >
                    {turma.nome}
                  </span>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-zinc-600">
                Este aluno ainda não está matriculado em nenhuma turma.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-white/10 bg-[#151515] px-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
                <Phone size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-zinc-600">Telefone</p>
                <p className="truncate text-sm text-zinc-300">
                  {aluno.telefone || "Não informado"}
                </p>
              </div>
            </div>

            <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-white/10 bg-[#151515] px-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
                <IdCard size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-zinc-600">CPF</p>
                <p className="truncate text-sm text-zinc-300">
                  {aluno.cpf || "Não informado"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-white/10 bg-[#101010]/95 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setPerfilModal(false)}
            className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Fechar
          </button>

          {podeEditar ? (
            <button
              type="button"
              onClick={() => {
                setPerfilModal(false);
                editarAluno(aluno);
              }}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-700 text-sm font-semibold text-white transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <Pencil size={17} />
              Editar aluno
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
