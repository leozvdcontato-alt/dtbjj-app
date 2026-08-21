import { CalendarCheck2 } from "lucide-react";

function formatarData(data) {
  if (!data) return "Data não informada";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function AlunoFrequencia({ portal }) {
  const { presencas, loading, erro } = portal;

  if (loading) {
    return <div className="py-16 text-center text-sm text-zinc-500">Carregando frequência...</div>;
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">Histórico</p>
        <h2 className="mt-1 text-2xl font-bold">Minha frequência</h2>
        <p className="mt-1 text-sm text-zinc-500">Treinos em que sua presença foi registrada.</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#121212] p-5">
        <p className="text-sm text-zinc-500">Total de presenças</p>
        <p className="mt-1 text-4xl font-bold">{presencas.length}</p>
      </div>

      {presencas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-[#101010] px-6 py-12 text-center">
          <CalendarCheck2 className="mx-auto text-zinc-600" size={30} />
          <p className="mt-4 font-semibold">Ainda não há presenças</p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-zinc-500">
            Depois que uma chamada for registrada, o treino aparecerá no seu histórico.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {presencas.map(({ id, chamada }) => (
            <article key={id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#121212] px-4 py-4">
              <div>
                <h3 className="font-semibold">{chamada.turmas?.nome || "Treino DTBJJ"}</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {formatarData(chamada.data)}{chamada.horario ? ` · ${chamada.horario}` : ""}
                </p>
              </div>
              <span className="rounded-full bg-emerald-950/50 px-3 py-1 text-xs font-semibold text-emerald-400">
                Presente
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
