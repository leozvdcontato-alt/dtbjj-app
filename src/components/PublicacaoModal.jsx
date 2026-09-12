import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clock3, MapPin, MessageCircle, Send, Trash2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ehAluno, podeGerenciarAcademia } from "@/lib/permissoes";
import {
  buscarRespostaEvento,
  comentarPublicacao,
  excluirComentario,
  listarAlunosDasTurmas,
  listarComentarios,
  listarRespostasEvento,
  registrarVisualizacao,
  responderEvento,
} from "@/services/publicacoes";

function dataBR(data) {
  if (!data) return "";
  return new Date(data + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function dataHoraBR(valor, { curta = false } = {}) {
  if (!valor) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: curta ? undefined : "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

const RESPOSTAS = [
  { valor: "confirmado", rotulo: "Vou" },
  { valor: "talvez", rotulo: "Talvez" },
  { valor: "nao_vai", rotulo: "Não vou" },
];

export default function PublicacaoModal({ publicacao, onClose }) {
  const { usuario } = useAuth();
  const aluno = ehAluno(usuario);
  const gestao = podeGerenciarAcademia(usuario);
  const [comentarios, setComentarios] = useState([]);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resposta, setResposta] = useState(null);
  const [respostas, setRespostas] = useState([]);
  const [publico, setPublico] = useState([]);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let ativo = true;

    async function carregar() {
      const tarefas = [
        listarComentarios(publicacao.id),
        registrarVisualizacao(publicacao.id, usuario.id),
      ];

      if (publicacao.tipo === "evento" && aluno) {
        tarefas.push(buscarRespostaEvento(publicacao.id, usuario.aluno_id));
      }

      if (publicacao.tipo === "evento" && gestao) {
        tarefas.push(listarRespostasEvento(publicacao.id));
        tarefas.push(listarAlunosDasTurmas(publicacao.turmas.map((t) => t.id)));
      }

      const resultados = await Promise.all(tarefas);
      if (!ativo) return;

      setComentarios(resultados[0] || []);
      let indice = 2;
      if (publicacao.tipo === "evento" && aluno) {
        setResposta(resultados[indice]?.resposta || null);
        indice += 1;
      }
      if (publicacao.tipo === "evento" && gestao) {
        setRespostas(resultados[indice] || []);
        setPublico(resultados[indice + 1] || []);
      }
    }

    carregar().catch((error) => console.error("Erro ao abrir publicação:", error));
    return () => {
      ativo = false;
      document.body.style.overflow = overflowAnterior;
    };
  }, [aluno, gestao, publicacao, usuario]);

  const resumo = useMemo(() => {
    if (!gestao || publicacao.tipo !== "evento") return null;
    const mapa = { confirmado: [], talvez: [], nao_vai: [], sem_resposta: [] };
    const respondidos = new Set();

    respostas.forEach((item) => {
      respondidos.add(item.aluno_id);
      mapa[item.resposta]?.push(item.alunos);
    });

    publico.forEach((item) => {
      if (!respondidos.has(item.id)) mapa.sem_resposta.push(item);
    });

    return mapa;
  }, [gestao, publico, publicacao.tipo, respostas]);

  async function enviarComentario(event) {
    event.preventDefault();
    const texto = comentario.trim();
    if (!texto) return;

    setEnviando(true);
    try {
      await comentarPublicacao(publicacao.id, usuario.id, texto);
      setComentario("");
      setComentarios(await listarComentarios(publicacao.id));
    } finally {
      setEnviando(false);
    }
  }

  async function removerComentario(item) {
    if (item.usuario_id !== usuario.id) return;

    const confirmou = window.confirm("Excluir seu comentário?");
    if (!confirmou) return;

    try {
      await excluirComentario(item.id);
      setComentarios((atuais) =>
        atuais.filter((comentarioAtual) => comentarioAtual.id !== item.id)
      );
    } catch (error) {
      console.error("Erro ao excluir comentário:", error);
    }
  }

  async function definirResposta(valor) {
    setResposta(valor);
    await responderEvento(publicacao.id, usuario.aluno_id, valor);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#101010] sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#101010]/95 px-5 py-4 backdrop-blur-xl">
          <span className="rounded-full bg-red-950/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-red-400">
            {publicacao.tipo === "evento" ? "Evento" : "Notícia"}
          </span>
          <button type="button" onClick={onClose} aria-label="Fechar publicação" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-zinc-300 transition active:bg-white/10">
            <X size={20} />
          </button>
        </header>

        <div className="space-y-6 p-5 pb-[max(24px,env(safe-area-inset-bottom))]">
          <div>
            <h2 className="text-2xl font-bold leading-tight">{publicacao.titulo}</h2>
            <p className="mt-2 text-xs text-zinc-500">
              {publicacao.autor_nome ? "Publicado por " + publicacao.autor_nome : "DTBJJ"}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Publicado em {dataHoraBR(publicacao.created_at)}
            </p>
          </div>

          {publicacao.tipo === "evento" ? (
            <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
              <div className="flex items-center gap-2"><CalendarDays size={17} className="text-red-500" />{dataBR(publicacao.evento_data)}</div>
              {publicacao.evento_horario ? <div className="flex items-center gap-2"><Clock3 size={17} className="text-red-500" />{String(publicacao.evento_horario).slice(0, 5)}</div> : null}
              {publicacao.evento_local ? <div className="flex items-center gap-2"><MapPin size={17} className="text-red-500" />{publicacao.evento_local}</div> : null}
            </div>
          ) : null}

          <p className="whitespace-pre-wrap text-[15px] leading-7 text-zinc-300">{publicacao.conteudo}</p>

          {publicacao.tipo === "evento" && aluno ? (
            <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <h3 className="font-semibold">Você vai participar?</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {RESPOSTAS.map((item) => (
                  <button
                    key={item.valor}
                    type="button"
                    onClick={() => definirResposta(item.valor)}
                    className={"flex min-h-12 items-center justify-center gap-1 rounded-xl border px-2 text-sm font-semibold transition " + (resposta === item.valor ? "border-red-600 bg-red-700 text-white" : "border-white/10 bg-white/5 text-zinc-300")}
                  >
                    {resposta === item.valor ? <Check size={15} /> : null}
                    {item.rotulo}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {resumo ? (
            <section className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
              <h3 className="font-semibold">Confirmações dos alunos</h3>
              {[
                ["confirmado", "Confirmados"],
                ["talvez", "Talvez"],
                ["nao_vai", "Não vão"],
                ["sem_resposta", "Sem resposta"],
              ].map(([chave, titulo]) => (
                <div key={chave} className="rounded-xl bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{titulo}</span>
                    <span className="text-sm text-zinc-400">{resumo[chave].length}</span>
                  </div>
                  {resumo[chave].length ? (
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      {resumo[chave].map((item) => item?.nome).filter(Boolean).join(", ")}
                    </p>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}

          <section className="border-t border-white/10 pt-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle size={18} className="text-red-500" />
              <h3 className="font-semibold">Comentários</h3>
              <span className="text-xs text-zinc-600">{comentarios.length}</span>
            </div>

            <div className="space-y-3">
              {comentarios.length ? comentarios.map((item) => {
                const proprio = item.usuario_id === usuario.id;

                return (
                  <div key={item.id} className="rounded-2xl bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-200">
                          {item.autor_nome || "Usuário"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-600">
                          {dataHoraBR(item.created_at, { curta: true })}
                        </p>
                      </div>

                      {proprio ? (
                        <button
                          type="button"
                          onClick={() => removerComentario(item)}
                          aria-label="Excluir meu comentário"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition active:bg-red-950/30 active:text-red-400"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                      {item.conteudo}
                    </p>
                  </div>
                );
              }) : <p className="text-sm text-zinc-600">Ainda não há comentários.</p>}
            </div>

            <form onSubmit={enviarComentario} className="mt-4 flex gap-2">
              <input
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                maxLength={1000}
                placeholder="Escreva um comentário..."
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-red-700"
              />
              <button type="submit" disabled={enviando || !comentario.trim()} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-700 text-white disabled:opacity-40">
                <Send size={18} />
              </button>
            </form>
          </section>
        </div>
      </section>
    </div>
  );
}
