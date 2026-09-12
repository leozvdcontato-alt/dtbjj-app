import { useEffect, useState } from "react";
import { Plus, UsersRound, X } from "lucide-react";
import { buscarAlunosDaTurma } from "@/services/alunos";
import {
  abrirAulaExtra,
  cancelarAulaExtra,
  criarChamada,
  listarAlunosAulaExtra,
  salvarPresencasAulaExtra,
} from "@/services/chamadas";
import { registrarPresencas } from "@/services/presencas";
import { listarLocais } from "@/services/locais";
import { useToast } from "@/contexts/ToastContext";
import { horaAgoraApp } from "@/lib/dataHora";

export default function PainelChamada({
  turmas,
  onChamadaRegistrada,
}) {
  const { mostrarToast } = useToast();

  const [modoChamada, setModoChamada] = useState(false);
  const [tipo, setTipo] = useState("turma");
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [alunosChamada, setAlunosChamada] = useState([]);
  const [presentes, setPresentes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [locais, setLocais] = useState([]);
  const [extra, setExtra] = useState({
    nome: "",
    localId: "",
    horario: horaAgoraApp(),
  });
  const [extraAberta, setExtraAberta] = useState(null);

  useEffect(() => {
    listarLocais()
      .then(setLocais)
      .catch((error) => console.error("Erro ao carregar locais:", error));
  }, []);

  async function abrirChamadaTurma() {
    if (!turmaSelecionada) return;

    try {
      setCarregando(true);
      const alunos = await buscarAlunosDaTurma(Number(turmaSelecionada));
      setAlunosChamada(alunos);
      setPresentes([]);
      setExtraAberta(null);
      setModoChamada(true);
    } catch (error) {
      console.error(error);
      mostrarToast("Erro ao carregar alunos.", "error");
    } finally {
      setCarregando(false);
    }
  }

  async function abrirExtra() {
    if (!extra.localId || !extra.horario) {
      mostrarToast("Informe o local e o horário da aula extra.", "error");
      return;
    }

    try {
      setCarregando(true);

      const alunos = await listarAlunosAulaExtra();
      const criada = await abrirAulaExtra(extra);

      setAlunosChamada(alunos);
      setPresentes([]);
      setExtraAberta(criada);
      setModoChamada(true);

      const enviados = criada.notificacao?.enviados;
      mostrarToast(
        typeof enviados === "number"
          ? `Aula extra aberta. ${enviados} notificação(ões) enviada(s).`
          : "Aula extra aberta para todos os alunos.",
        "success"
      );
    } catch (error) {
      console.error(error);
      mostrarToast(error.message || "Não foi possível abrir a aula extra.", "error");
    } finally {
      setCarregando(false);
    }
  }

  function togglePresenca(aluno) {
    const existe = presentes.some((p) => p.id === aluno.id);

    if (existe) {
      setPresentes((prev) => prev.filter((p) => p.id !== aluno.id));
    } else {
      setPresentes((prev) => [...prev, aluno]);
    }
  }

  function limpar() {
    setModoChamada(false);
    setPresentes([]);
    setAlunosChamada([]);
    setTurmaSelecionada("");
    setExtraAberta(null);
    setExtra((atual) => ({ ...atual, nome: "" }));
  }

  async function cancelarExtra() {
    if (!extraAberta?.aula_extra_id || carregando) return;

    try {
      setCarregando(true);
      await cancelarAulaExtra(extraAberta.aula_extra_id);
      mostrarToast("Aula extra cancelada.", "success");
      limpar();
      onChamadaRegistrada?.();
    } catch (error) {
      console.error(error);
      mostrarToast(error.message || "Não foi possível cancelar a aula extra.", "error");
    } finally {
      setCarregando(false);
    }
  }

  async function confirmarChamada() {
    try {
      setCarregando(true);

      if (tipo === "extra") {
        if (!extraAberta?.chamada_id) {
          throw new Error("Aula extra não encontrada.");
        }

        await salvarPresencasAulaExtra(extraAberta.chamada_id, presentes);
      } else {
        const turma = turmas.find((t) => t.id === Number(turmaSelecionada));

        if (!turma) {
          mostrarToast("Turma não encontrada.", "error");
          return;
        }

        const professores = (turma.turma_professores || [])
          .map((item) => item.usuarios?.nome)
          .filter(Boolean);

        const { id: chamadaId } = await criarChamada({
          turmaId: turma.id,
          professor: professores.join(", ") || "Professor indisponível ainda",
        });

        await registrarPresencas(chamadaId, presentes);
      }

      mostrarToast("Chamada registrada com sucesso!", "success");
      onChamadaRegistrada?.();
      limpar();
    } catch (error) {
      console.error(error);
      mostrarToast(error.message || "Erro ao registrar chamada.", "error");
    } finally {
      setCarregando(false);
    }
  }

  const turmaAtual = turmas.find(
    (t) => String(t.id) === String(turmaSelecionada)
  );

  const tituloAtual =
    tipo === "extra"
      ? extra.nome.trim() || "Aula extra"
      : turmaAtual?.nome || "Chamada";

  return (
    <>
      {!modoChamada && (
        <div className="mb-5 rounded-3xl border border-white/10 bg-[#111111] p-5">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
              Aula
            </p>
            <h2 className="mt-1 text-3xl font-bold">Iniciar chamada</h2>
            <p className="mt-2 text-gray-400">
              Use uma turma da grade ou abra uma aula extra para toda a academia.
            </p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo("turma")}
              className={
                tipo === "turma"
                  ? "min-h-11 rounded-2xl bg-red-700 px-3 text-sm font-semibold"
                  : "min-h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-zinc-400"
              }
            >
              Turma da grade
            </button>
            <button
              type="button"
              onClick={() => setTipo("extra")}
              className={
                tipo === "extra"
                  ? "min-h-11 rounded-2xl bg-red-700 px-3 text-sm font-semibold"
                  : "min-h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-zinc-400"
              }
            >
              Aula extra
            </button>
          </div>

          {tipo === "turma" ? (
            <div className="space-y-3">
              <select
                value={turmaSelecionada}
                onChange={(event) => setTurmaSelecionada(event.target.value)}
                className="h-14 w-full rounded-2xl bg-[#1A1A1A] px-4 text-lg"
              >
                <option value="">Selecionar turma</option>
                {turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome}
                  </option>
                ))}
              </select>

              <button
                onClick={abrirChamadaTurma}
                disabled={!turmaSelecionada || carregando}
                className="h-14 w-full rounded-2xl bg-red-700 text-lg font-bold transition hover:bg-red-600 disabled:opacity-40"
              >
                {carregando ? "Carregando..." : "Iniciar chamada"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border border-red-900/30 bg-red-950/15 p-4">
                <div className="flex gap-3">
                  <UsersRound size={20} className="mt-0.5 shrink-0 text-red-500" />
                  <p className="text-sm leading-6 text-zinc-400">
                    A aula extra fica disponível para todos os alunos ativos e envia uma notificação para quem estiver com o push ativado.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Nome da aula <span className="text-zinc-600">(opcional)</span>
                </label>
                <input
                  value={extra.nome}
                  onChange={(event) =>
                    setExtra((atual) => ({ ...atual, nome: event.target.value }))
                  }
                  placeholder="Ex.: Open mat, treino de domingo"
                  className="h-12 min-w-0 w-full max-w-full rounded-2xl border border-white/10 bg-[#1A1A1A] px-4 outline-none focus:border-red-700"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">Local</label>
                <select
                  value={extra.localId}
                  onChange={(event) =>
                    setExtra((atual) => ({ ...atual, localId: event.target.value }))
                  }
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#1A1A1A] px-4 outline-none focus:border-red-700"
                >
                  <option value="">Selecionar local</option>
                  {locais.map((local) => (
                    <option key={local.id} value={local.id}>
                      {local.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 overflow-hidden">
                <label className="mb-2 block text-sm text-zinc-400">Horário</label>
                <input
                  type="time"
                  value={extra.horario}
                  onChange={(event) =>
                    setExtra((atual) => ({ ...atual, horario: event.target.value }))
                  }
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#1A1A1A] px-4 outline-none focus:border-red-700"
                />
              </div>

              <button
                type="button"
                onClick={abrirExtra}
                disabled={!extra.localId || !extra.horario || carregando}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-700 text-lg font-bold transition hover:bg-red-600 disabled:opacity-40"
              >
                <Plus size={20} />
                {carregando ? "Abrindo..." : "Abrir aula extra"}
              </button>
            </div>
          )}
        </div>
      )}

      {modoChamada && (
        <div className="mb-5 rounded-3xl border border-white/10 bg-[#111111] p-4">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              {tipo === "extra" ? (
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-red-500">
                  Aula extra
                </p>
              ) : null}
              <h2 className="text-2xl font-bold">{tituloAtual}</h2>
              <p className="text-gray-400">{presentes.length} presença(s)</p>
            </div>

            <div className="flex gap-2">
              {tipo === "extra" ? (
                <button
                  type="button"
                  onClick={cancelarExtra}
                  disabled={carregando}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-900/50 bg-red-950/30 px-4 text-sm font-semibold text-red-300 disabled:opacity-50"
                >
                  <X size={16} />
                  Cancelar
                </button>
              ) : null}
              <button
                onClick={confirmarChamada}
                disabled={carregando}
                className="h-11 rounded-xl bg-green-700 px-5 font-semibold hover:bg-green-600 disabled:opacity-50"
              >
                {carregando ? "Salvando..." : "Confirmar chamada"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alunosChamada.map((aluno) => {
              const presente = presentes.some((p) => p.id === aluno.id);

              return (
                <button
                  key={aluno.id}
                  onClick={() => togglePresenca(aluno)}
                  className={
                    presente
                      ? "rounded-2xl bg-green-700 p-4 text-left text-white transition"
                      : "rounded-2xl border border-white/10 bg-[#1A1A1A] p-4 text-left transition"
                  }
                >
                  <h3 className="mb-2 text-lg font-bold">{aluno.nome}</h3>
                  <p className="text-sm opacity-80">
                    Faixa {aluno.faixa}
                    {aluno.graus > 0 && ` • ${aluno.graus}º grau`}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
