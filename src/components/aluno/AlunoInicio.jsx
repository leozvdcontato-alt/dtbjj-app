import { CalendarCheck2, GraduationCap, Medal } from "lucide-react";
import Faixa from "../Faixa";

function normalizarFaixa(faixa) {
  const mapa = {
    Branca: "branca",
    Cinza: "cinza",
    Amarela: "amarela",
    Laranja: "laranja",
    Verde: "verde",
    Azul: "azul",
    Roxa: "roxa",
    Marrom: "marrom",
    Preta: "preta",
    "Cinza e Branca": "cinza_branca",
    "Cinza e Preta": "cinza_preta",
    "Amarela e Branca": "amarela_branca",
    "Amarela e Preta": "amarela_preta",
    "Laranja e Branca": "laranja_branca",
    "Laranja e Preta": "laranja_preta",
    "Verde e Branca": "verde_branca",
    "Verde e Preta": "verde_preta",
  };

  return mapa[faixa] || "branca";
}

export default function AlunoInicio({ portal, setTela }) {
  const { aluno, turmas, presencas, loading, erro } = portal;

  if (loading) {
    return <div className="py-16 text-center text-sm text-zinc-500">Carregando sua área...</div>;
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
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
          Minha jornada
        </p>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{aluno?.nome || "Aluno DTBJJ"}</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {aluno?.categoria || "Aluno"} · {aluno?.status || "Ativo"}
            </p>
          </div>

          <Faixa
            faixa={normalizarFaixa(aluno?.faixa)}
            graus={aluno?.graus || 0}
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setTela({ pagina: "turmas", turma: null })}
          className="rounded-2xl border border-white/10 bg-[#121212] p-4 text-left transition active:scale-[0.99]"
        >
          <GraduationCap size={20} className="text-red-500" />
          <p className="mt-5 text-2xl font-bold">{turmas.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Turmas matriculadas</p>
        </button>

        <button
          type="button"
          onClick={() => setTela({ pagina: "frequencia", turma: null })}
          className="rounded-2xl border border-white/10 bg-[#121212] p-4 text-left transition active:scale-[0.99]"
        >
          <CalendarCheck2 size={20} className="text-red-500" />
          <p className="mt-5 text-2xl font-bold">{presencas.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Presenças registradas</p>
        </button>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#121212] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-950/50 text-red-400">
            <Medal size={20} />
          </div>
          <div>
            <h3 className="font-semibold">Graduação atual</h3>
            <p className="text-sm text-zinc-500">
              {aluno?.faixa || "Faixa não informada"} · {aluno?.graus || 0} grau{aluno?.graus === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#121212] p-5">
        <h3 className="font-semibold">Próximo passo</h3>
        {turmas.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Você ainda não está vinculado a uma turma. A academia poderá fazer essa matrícula para você.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Acompanhe suas turmas e o histórico de presença pelo menu abaixo.
          </p>
        )}
      </section>
    </div>
  );
}
