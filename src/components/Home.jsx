import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Newspaper,
  Users,
} from "lucide-react";
import { buscarUltimaChamada } from "@/services/chamadas";
import { useAuth } from "@/contexts/AuthContext";
import { normalizarCargo } from "@/lib/permissoes";

function formatarData(data, horario) {
  if (!data) return "Data não informada";

  const chamada = new Date(data + "T00:00:00");
  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);
  const diff = Math.floor((inicioHoje.getTime() - chamada.getTime()) / 86400000);

  if (diff === 0) return "Hoje" + (horario ? " às " + horario : "");
  if (diff === 1) return "Ontem" + (horario ? " às " + horario : "");

  const [, mes, dia] = data.split("-");
  return dia + "/" + mes + (horario ? " às " + horario : "");
}

export default function Home({ alunos, turmas, setTela }) {
  const { usuario } = useAuth();
  const professor = normalizarCargo(usuario?.cargo) === "professor";
  const [ultimaChamada, setUltimaChamada] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const chamada = await buscarUltimaChamada();
        if (ativo) setUltimaChamada(chamada);
      } catch {
        if (ativo) setUltimaChamada(null);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  const alunosAtivos = alunos.filter((aluno) => aluno.status === "Ativo").length;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
          Visão geral
        </p>
        <h2 className="mt-1 text-2xl font-bold">Academia hoje</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Acesso rápido ao que precisa acontecer no tatame.
        </p>
      </div>

      {professor ? (
        <section className="rounded-3xl border border-white/10 bg-[#121212] p-4">
          <p className="text-sm font-semibold text-white">
            Publicar para minhas turmas
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Crie um aviso ou evento sem precisar ir até o menu Mais.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setTela({
                  pagina: "publicacoes",
                  turma: null,
                  tipoPublicacao: "noticia",
                })
              }
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-zinc-200 transition active:bg-white/10"
            >
              <Newspaper size={17} className="text-red-500" />
              Nova notícia
            </button>

            <button
              type="button"
              onClick={() =>
                setTela({
                  pagina: "publicacoes",
                  turma: null,
                  tipoPublicacao: "evento",
                })
              }
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-zinc-200 transition active:bg-white/10"
            >
              <CalendarDays size={17} className="text-red-500" />
              Novo evento
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setTela({ pagina: "alunos", turma: null })}
          className="rounded-3xl border border-white/10 bg-[#121212] p-4 text-left transition active:scale-[0.99]"
        >
          <Users size={20} className="text-red-500" />
          <p className="mt-5 text-3xl font-bold">{alunosAtivos}</p>
          <p className="mt-1 text-xs text-zinc-500">Alunos ativos</p>
        </button>

        <button
          type="button"
          onClick={() => setTela({ pagina: "turmas", turma: null })}
          className="rounded-3xl border border-white/10 bg-[#121212] p-4 text-left transition active:scale-[0.99]"
        >
          <GraduationCap size={20} className="text-red-500" />
          <p className="mt-5 text-3xl font-bold">{turmas.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Turmas</p>
        </button>
      </section>

      <button
        type="button"
        onClick={() => setTela({ pagina: "chamada", turma: null })}
        className="flex w-full items-center justify-between rounded-3xl bg-red-700 p-5 text-left text-white transition active:bg-red-800"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/20">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <p className="font-bold">Iniciar chamada</p>
            <p className="mt-0.5 text-sm text-red-100/80">
              Escolha uma turma e registre as presenças.
            </p>
          </div>
        </div>
        <ArrowRight size={20} />
      </button>

      <section className="rounded-3xl border border-white/10 bg-[#121212] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400">
            <CalendarCheck2 size={20} />
          </div>
          <div>
            <h3 className="font-semibold">Última chamada</h3>
            <p className="text-sm text-zinc-500">Registro mais recente da academia</p>
          </div>
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-zinc-500">Carregando...</p>
        ) : !ultimaChamada ? (
          <p className="mt-5 text-sm text-zinc-500">Nenhuma chamada realizada.</p>
        ) : (
          <div className="mt-5 rounded-2xl bg-black/30 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{ultimaChamada.turma}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {formatarData(ultimaChamada.data, ultimaChamada.horario)}
                </p>
              </div>
              <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
                {ultimaChamada.presentes}/{ultimaChamada.matriculados}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
