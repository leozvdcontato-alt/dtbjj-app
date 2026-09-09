import { Clock3, GraduationCap, UserRound } from "lucide-react";

export default function AlunoTurmas({ portal }) {
  const { turmas, loading, erro } = portal;

  if (loading) {
    return <div className="py-16 text-center text-sm text-zinc-500">Carregando turmas...</div>;
  }

  if (erro) {
    return (
      <div className="rounded-3xl border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-300">
        {erro}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">Treinos</p>
        <h2 className="mt-1 text-2xl font-bold">Minhas turmas</h2>
        <p className="mt-1 text-sm text-zinc-500">Turmas em que você está matriculado.</p>
      </div>

      {turmas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-[#101010] px-6 py-12 text-center">
          <GraduationCap className="mx-auto text-zinc-600" size={30} />
          <p className="mt-4 font-semibold">Nenhuma turma vinculada</p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-zinc-500">
            Quando a academia vincular você a uma turma, ela aparecerá aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {turmas.map((turma) => (
            <article key={turma.id} className="rounded-3xl border border-white/10 bg-[#121212] p-5">
              <h3 className="text-lg font-semibold">{turma.nome}</h3>

              <div className="mt-4 space-y-2 text-sm text-zinc-400">
                {(turma.dias || turma.horario) && (
                  <div className="flex items-center gap-2">
                    <Clock3 size={16} className="text-zinc-600" />
                    <span>{[turma.dias, turma.horario].filter(Boolean).join(" · ")}</span>
                  </div>
                )}

                {turma.professor && (
                  <div className="flex items-center gap-2">
                    <UserRound size={16} className="text-zinc-600" />
                    <span>{turma.professor}</span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
