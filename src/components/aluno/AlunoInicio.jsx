import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarCheck2,
  CalendarDays,
  GraduationCap,
  Newspaper,
} from "lucide-react";
import Faixa from "../Faixa";
import PublicacaoModal from "../PublicacaoModal";
import { listarPublicacoes } from "@/services/publicacoes";
import { ativarPush, pushDisponivel, statusPush } from "@/services/push";
import { useAuth } from "@/contexts/AuthContext";

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

function ordenarDestaques(itens) {
  const hoje = new Date().toISOString().slice(0, 10);
  const futuros = itens
    .filter((item) => item.tipo === "evento" && item.evento_data >= hoje)
    .sort((a, b) => String(a.evento_data).localeCompare(String(b.evento_data)));
  const noticias = itens
    .filter((item) => item.tipo === "noticia")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const passados = itens
    .filter((item) => item.tipo === "evento" && item.evento_data < hoje)
    .sort((a, b) => String(b.evento_data).localeCompare(String(a.evento_data)));

  return [...futuros, ...noticias, ...passados];
}

export default function AlunoInicio({ portal, setTela }) {
  const { usuario } = useAuth();
  const { aluno, turmas, presencas, loading, erro } = portal;
  const [publicacoes, setPublicacoes] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [push, setPush] = useState("carregando");
  const [ativandoPush, setAtivandoPush] = useState(false);
  const [erroPush, setErroPush] = useState("");

  useEffect(() => {
    let cancelado = false;

    Promise.resolve()
      .then(async () => {
        const dados = await listarPublicacoes();
        if (!cancelado) {
          setPublicacoes(dados.filter((item) => item.publicado));
        }

        if (!pushDisponivel()) {
          if (!cancelado) setPush("indisponivel");
          return;
        }

        try {
          const status = await statusPush(usuario?.id);
          if (!cancelado) setPush(status);
        } catch {
          if (!cancelado) setPush("inativo");
        }
      })
      .catch((error) => {
        if (!cancelado) console.error("Erro ao carregar a Home do aluno:", error);
      });

    return () => {
      cancelado = true;
    };
  }, [usuario?.id]);

  const destaques = useMemo(
    () => ordenarDestaques(publicacoes).slice(0, 3),
    [publicacoes]
  );

  async function habilitarPush() {
    setAtivandoPush(true);
    setErroPush("");
    try {
      await ativarPush(usuario.id);
      setPush("ativo");
    } catch (error) {
      setErroPush(error.message || "Não foi possível ativar as notificações.");
      setPush(Notification?.permission === "denied" ? "negado" : "inativo");
    } finally {
      setAtivandoPush(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-zinc-500">
        Carregando sua área...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-3xl border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-300">
        {erro}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
          Minha jornada
        </p>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">
              {aluno?.nome || "Aluno DTBJJ"}
            </h2>
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

      <section className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTela({ pagina: "turmas", turma: null })}
          className="rounded-2xl border border-white/10 bg-[#121212] p-3 text-left transition active:scale-[0.99]"
        >
          <GraduationCap size={20} className="text-red-500" />
          <p className="mt-2 text-xl font-bold">{turmas.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Turmas matriculadas</p>
        </button>

        <button
          type="button"
          onClick={() => setTela({ pagina: "frequencia", turma: null })}
          className="rounded-2xl border border-white/10 bg-[#121212] p-3 text-left transition active:scale-[0.99]"
        >
          <CalendarCheck2 size={20} className="text-red-500" />
          <p className="mt-2 text-xl font-bold">{presencas.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Presenças registradas</p>
        </button>
      </section>

      {push === "inativo" ? (
        <section className="rounded-2xl border border-red-900/30 bg-red-950/15 p-3">
          <div className="flex items-start gap-3">
            <Bell size={20} className="mt-0.5 shrink-0 text-red-500" />
            <div className="flex-1">
              <h3 className="font-semibold">Receba avisos da sua turma</h3>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Ative as notificações para receber novas notícias e eventos.
              </p>
              {erroPush ? (
                <p className="mt-2 text-xs text-amber-400">{erroPush}</p>
              ) : null}
              <button
                type="button"
                onClick={habilitarPush}
                disabled={ativandoPush}
                className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {ativandoPush ? "Ativando..." : "Ativar notificações"}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-[#121212] p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Notícias e eventos</h3>
          <button
            type="button"
            onClick={() => setTela({ pagina: "comunicados", turma: null })}
            className="text-xs font-semibold text-red-500"
          >
            Ver todas
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {destaques.length ? (
            destaques.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelecionada(item)}
                className="flex w-full items-start gap-3 rounded-2xl bg-black/25 p-3 text-left transition active:bg-black/40"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-950/50 text-red-400">
                  {item.tipo === "evento" ? (
                    <CalendarDays size={17} />
                  ) : (
                    <Newspaper size={17} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">
                    {item.tipo === "evento" ? "Evento" : "Notícia"}
                    {item.evento_data
                      ? " · " +
                        new Date(
                          item.evento_data + "T12:00:00"
                        ).toLocaleDateString("pt-BR")
                      : ""}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-zinc-200">
                    {item.titulo}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-zinc-600">
                    {item.conteudo}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <p className="py-3 text-sm text-zinc-600">
              Nenhuma notícia ou evento publicado para suas turmas.
            </p>
          )}
        </div>
      </section>

      {selecionada ? (
        <PublicacaoModal
          publicacao={selecionada}
          onClose={() => setSelecionada(null)}
        />
      ) : null}
    </div>
  );
}
