import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, Eye, MessageCircle, Newspaper, Pencil, Plus, Trash2, X } from "lucide-react";
import { listarTurmas } from "@/services/turmas";
import {
  contarInteracoes,
  excluirPublicacao,
  listarPublicacoes,
  salvarPublicacao,
} from "@/services/publicacoes";
import PublicacaoModal from "./PublicacaoModal";

const VAZIA = {
  id: null,
  tipo: "noticia",
  titulo: "",
  conteudo: "",
  evento_data: "",
  evento_horario: "",
  evento_local: "",
  publicado: true,
  turma_ids: [],
};

export default function PainelPublicacoes() {
  const [itens, setItens] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [interacoes, setInteracoes] = useState({});
  const [editando, setEditando] = useState(null);
  const [abrindo, setAbrindo] = useState(null);
  const [form, setForm] = useState(VAZIA);
  const [enviarPush, setEnviarPush] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function recarregar() {
    const [publicacoes, listaTurmas] = await Promise.all([
      listarPublicacoes(),
      listarTurmas(),
    ]);
    setItens(publicacoes);
    setTurmas(listaTurmas);
    setInteracoes(await contarInteracoes(publicacoes.map((item) => item.id)));
  }

  useEffect(() => {
    let ativo = true;

    Promise.resolve()
      .then(() => recarregar())
      .catch((error) => {
        if (ativo) console.error("Erro ao carregar publicações:", error);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const tituloForm = editando ? "Editar publicação" : "Nova publicação";

  function abrirNovo() {
    setEditando(null);
    setForm(VAZIA);
    setEnviarPush(true);
    setMensagem("");
  }

  function abrirEdicao(item) {
    setEditando(item);
    setForm({
      id: item.id,
      tipo: item.tipo,
      titulo: item.titulo,
      conteudo: item.conteudo,
      evento_data: item.evento_data || "",
      evento_horario: item.evento_horario ? String(item.evento_horario).slice(0, 5) : "",
      evento_local: item.evento_local || "",
      publicado: item.publicado,
      turma_ids: item.turmas.map((turma) => turma.id),
    });
    setEnviarPush(false);
    setMensagem("");
  }

  function alternarTurma(id) {
    setForm((atual) => ({
      ...atual,
      turma_ids: atual.turma_ids.includes(id)
        ? atual.turma_ids.filter((valor) => valor !== id)
        : [...atual.turma_ids, id],
    }));
  }

  async function salvar(event) {
    event.preventDefault();
    setMensagem("");

    if (!form.turma_ids.length) {
      setMensagem("Selecione ao menos uma turma.");
      return;
    }

    setSalvando(true);
    try {
      const resultado = await salvarPublicacao(form, { enviarPush });
      setMensagem(
        resultado.push?.erro
          ? "Publicação salva, mas o push não foi enviado: " + resultado.push.erro
          : resultado.push
            ? `Publicação salva. ${resultado.push.enviados || 0} notificação(ões) enviada(s).`
            : "Publicação salva com sucesso."
      );
      await recarregar();
      if (!editando) {
        setForm(VAZIA);
        setEnviarPush(true);
      }
    } catch (error) {
      setMensagem(error.message || "Não foi possível salvar a publicação.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(item) {
    if (!window.confirm(`Excluir “${item.titulo}”?`)) return;
    await excluirPublicacao(item.id);
    await recarregar();
  }

  const listaOrdenada = useMemo(
    () => [...itens].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [itens]
  );

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">Comunicação</p>
          <h2 className="mt-1 text-2xl font-bold">Notícias e eventos</h2>
        </div>
        <button type="button" onClick={abrirNovo} className="flex h-11 items-center gap-2 rounded-2xl bg-red-700 px-4 text-sm font-semibold text-white">
          <Plus size={18} /> Nova
        </button>
      </div>

      <form onSubmit={salvar} className="space-y-4 rounded-3xl border border-white/10 bg-[#121212] p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{tituloForm}</h3>
          {editando ? <button type="button" onClick={abrirNovo} className="text-zinc-500"><X size={19} /></button> : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[["noticia", "Notícia"], ["evento", "Evento"]].map(([valor, rotulo]) => (
            <button key={valor} type="button" onClick={() => setForm((f) => ({ ...f, tipo: valor }))} className={"rounded-2xl border px-4 py-3 text-sm font-semibold " + (form.tipo === valor ? "border-red-600 bg-red-950/50 text-red-300" : "border-white/10 bg-black/25 text-zinc-400")}>{rotulo}</button>
          ))}
        </div>

        <input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="Título" maxLength={140} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-red-700" />
        <textarea value={form.conteudo} onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))} placeholder="Conteúdo da publicação" rows={6} className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-red-700" />

        {form.tipo === "evento" ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <input type="date" value={form.evento_data} onChange={(e) => setForm((f) => ({ ...f, evento_data: e.target.value }))} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" />
            <input type="time" value={form.evento_horario} onChange={(e) => setForm((f) => ({ ...f, evento_horario: e.target.value }))} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" />
            <input value={form.evento_local} onChange={(e) => setForm((f) => ({ ...f, evento_local: e.target.value }))} placeholder="Local" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" />
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-sm font-semibold">Turmas que recebem</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {turmas.map((turma) => (
              <label key={turma.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm">
                <input type="checkbox" checked={form.turma_ids.includes(turma.id)} onChange={() => alternarTurma(turma.id)} className="h-4 w-4 accent-red-700" />
                <span>{turma.nome}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
          <span className="text-sm font-semibold">Publicado</span>
          <input type="checkbox" checked={form.publicado} onChange={(e) => setForm((f) => ({ ...f, publicado: e.target.checked }))} className="h-5 w-5 accent-red-700" />
        </label>

        {form.publicado ? (
          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold"><Bell size={16} className="text-red-500" /> Enviar push aos alunos</p>
              <p className="mt-1 text-xs text-zinc-600">Somente alunos das turmas selecionadas que ativaram notificações.</p>
            </div>
            <input type="checkbox" checked={enviarPush} onChange={(e) => setEnviarPush(e.target.checked)} className="h-5 w-5 accent-red-700" />
          </label>
        ) : null}

        {mensagem ? <p className="rounded-2xl bg-white/5 p-3 text-sm text-zinc-300">{mensagem}</p> : null}

        <button type="submit" disabled={salvando} className="h-12 w-full rounded-2xl bg-red-700 font-semibold text-white disabled:opacity-50">
          {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Criar publicação"}
        </button>
      </form>

      <section className="space-y-3">
        {listaOrdenada.map((item) => (
          <article key={item.id} className="rounded-3xl border border-white/10 bg-[#121212] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-950/50 text-red-400">
                {item.tipo === "evento" ? <CalendarDays size={19} /> : <Newspaper size={19} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold uppercase tracking-[0.12em] text-red-500">{item.tipo}</span>
                  <span className={item.publicado ? "text-emerald-400" : "text-amber-400"}>{item.publicado ? "Publicado" : "Rascunho"}</span>
                </div>
                <h3 className="mt-1 font-semibold">{item.titulo}</h3>
                <p className="mt-1 text-xs text-zinc-600">{item.turmas.map((t) => t.nome).join(" · ")}</p>
                <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Eye size={14} />{interacoes[item.id]?.visualizacoes || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={14} />{interacoes[item.id]?.comentarios || 0}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setAbrindo(item)} className="rounded-xl bg-white/5 py-2 text-xs font-semibold">Abrir</button>
              <button type="button" onClick={() => abrirEdicao(item)} className="flex items-center justify-center gap-1 rounded-xl bg-white/5 py-2 text-xs font-semibold"><Pencil size={13} />Editar</button>
              <button type="button" onClick={() => remover(item)} className="flex items-center justify-center gap-1 rounded-xl bg-red-950/30 py-2 text-xs font-semibold text-red-400"><Trash2 size={13} />Excluir</button>
            </div>
          </article>
        ))}
      </section>

      {abrindo ? <PublicacaoModal publicacao={abrindo} onClose={() => setAbrindo(null)} /> : null}
    </div>
  );
}
