import {
  ArrowLeft,
  Clock3,
  Map,
  MapPin,
  Navigation,
  UserRound,
} from "lucide-react";
import { agruparSlots } from "@/lib/horarios";
import { montarGoogleMapsUrl, montarWazeUrl } from "@/services/locais";

export default function TelaTurma({ turma, setTela }) {
  const grupos = agruparSlots(turma.turma_horarios || []);

  return (
    <section className="space-y-5">
      <button
        type="button"
        onClick={() => setTela({ pagina: "turmas" })}
        className="flex min-h-11 items-center gap-2 rounded-2xl px-2 text-sm font-semibold text-red-500"
      >
        <ArrowLeft size={18} />
        Voltar para turmas
      </button>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
          Turma
        </p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">{turma.nome}</h2>
        {turma.locais?.nome ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
            <MapPin size={16} className="text-zinc-500" />
            {turma.locais.nome}
          </p>
        ) : null}
      </div>

      <section className="rounded-3xl border border-white/10 bg-[#121212] p-5">
        <h3 className="font-semibold">Grade de aulas</h3>
        <div className="mt-4 space-y-3">
          {grupos.length ? (
            grupos.map((grupo) => (
              <article
                key={grupo.id}
                className="rounded-2xl border border-white/5 bg-black/25 p-4"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <Clock3 size={17} className="text-red-500" />
                  {grupo.texto}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                  <UserRound size={16} className="text-zinc-500" />
                  {grupo.professor || "Professor indisponível ainda"}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-500">Horários ainda não cadastrados.</p>
          )}
        </div>
      </section>

      {turma.locais?.endereco ? (
        <section className="rounded-3xl border border-white/10 bg-[#121212] p-5">
          <h3 className="font-semibold">Como chegar</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {turma.locais.endereco}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              href={montarWazeUrl(turma.locais.endereco)}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold"
            >
              <Navigation size={17} />
              Waze
            </a>
            <a
              href={montarGoogleMapsUrl(turma.locais.endereco)}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold"
            >
              <Map size={17} />
              Maps
            </a>
          </div>
        </section>
      ) : null}
    </section>
  );
}
