import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MessageCircle, Newspaper } from "lucide-react";
import { listarPublicacoes } from "@/services/publicacoes";
import PublicacaoModal from "../PublicacaoModal";

function dataCurta(data) {
  return data ? new Date(data + "T12:00:00").toLocaleDateString("pt-BR") : "";
}

export default function AlunoPublicacoes({ publicacaoInicialId, onPublicacaoConsumida }) {
  const [itens, setItens] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [selecionada, setSelecionada] = useState(null);

  useEffect(() => {
    listarPublicacoes()
      .then((dados) => {
        const publicados = dados.filter((item) => item.publicado);
        setItens(publicados);
        if (publicacaoInicialId) {
          const alvo = publicados.find((item) => String(item.id) === String(publicacaoInicialId));
          if (alvo) setSelecionada(alvo);
        }
      })
      .catch((error) => console.error("Erro ao listar publicações:", error));
  }, [publicacaoInicialId]);

  const filtrados = useMemo(
    () => filtro === "todos" ? itens : itens.filter((item) => item.tipo === filtro),
    [filtro, itens]
  );

  function fecharModal() {
    setSelecionada(null);
    onPublicacaoConsumida?.();
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">Comunicação</p>
        <h2 className="mt-1 text-2xl font-bold">Notícias e eventos</h2>
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {[["todos", "Todos"], ["noticia", "Notícias"], ["evento", "Eventos"]].map(([valor, rotulo]) => (
          <button key={valor} type="button" onClick={() => setFiltro(valor)} className={"min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition " +  + (filtro === valor ? "bg-red-700 text-white" : "bg-white/5 text-zinc-400")}>{rotulo}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtrados.length ? filtrados.map((item) => (
          <button key={item.id} type="button" onClick={() => setSelecionada(item)} className="w-full rounded-3xl border border-white/10 bg-[#121212] p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-950/50 text-red-400">
                {item.tipo === "evento" ? <CalendarDays size={19} /> : <Newspaper size={19} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-red-500">
                  <span>{item.tipo === "evento" ? "Evento" : "Notícia"}</span>
                  {item.evento_data ? <span className="text-zinc-600">{dataCurta(item.evento_data)}</span> : null}
                </div>
                <h3 className="mt-1 font-semibold text-white">{item.titulo}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{item.conteudo}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600"><MessageCircle size={14} />Abrir e comentar</div>
              </div>
            </div>
          </button>
        )) : <div className="rounded-3xl border border-white/10 bg-[#121212] p-6 text-center text-sm text-zinc-500">Nenhuma publicação encontrada.</div>}
      </div>

      {selecionada ? <PublicacaoModal publicacao={selecionada} onClose={fecharModal} /> : null}
    </div>
  );
}
