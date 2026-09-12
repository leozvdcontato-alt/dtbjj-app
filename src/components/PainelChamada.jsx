import { useEffect, useMemo, useState } from "react";
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
import { diaSemanaApp, horaAgoraApp } from "@/lib/dataHora";
import { horaCurta } from "@/lib/horarios";
import { useAuth } from "@/contexts/AuthContext";
import { ehAdministrador } from "@/lib/permissoes";

export default function PainelChamada({ turmas, onChamadaRegistrada }) {
  const { mostrarToast } = useToast();
  const { usuario } = useAuth();
  const admin = ehAdministrador(usuario);

  const [modoChamada, setModoChamada] = useState(false);
  const [tipo, setTipo] = useState("turma");
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
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

  const aulasHoje = useMemo(() => {
    const dia = diaSemanaApp();

    return turmas
      .flatMap((turma) =>
        (turma.turma_horarios || [])
          .filter((horario) => Number(horario.dia_semana) === dia)
          .filter(
            (horario) =>
              admin ||
              (horario.turma_horario_professores || []).length > 0
          )
          .map((horario) => ({
            ...horario,
            turma,
          }))
      )
      .sort((a, b) =>
        String(a.horario_inicio).localeCompare(String(b.horario_inicio))
      );
  }, [admin, turmas]);

  const aulaSelecionada = aulasHoje.find(
    (item) => String(item.id) === String(horarioSelecionado)
  );

  async function abrirChamadaTurma() {
    if (!aulaSelecionada) return;

    try {
      setCarregando(true);
      const alunos = await buscarAlunosDaTurma(aulaSelecionada.turma.id);
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
    setPresentes((atuais) =>
      atuais.some((item) => item.id === aluno.id)
        ? atuais.filter((item) => item.id !== aluno.id)
        : [...atuais, aluno]
    );
  }

  function limpar() {
    setModoChamada(false);
    setPresentes([]);
    setAlunosChamada([]);
    setHorarioSelecionado("");
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
      mostrarToast(error.message || "Não foi possível cancelar a aula extra.", "error");
    } finally {
      setCarregando(false);
    }
  }

  async function confirmarChamada() {
    try {
      setCarregando(true);

      let chamadaId;

      if (tipo === "extra") {
        if (!extraAberta?.chamada_id) throw new Error("Aula extra não encontrada.");
        chamadaId = extraAberta.chamada_id;
        await salvarPresencasAulaExtra(chamadaId, presentes);
      } else {
        if (!aulaSelecionada) throw new Error("Horário não encontrado.");
        const chamada = await criarChamada({ horarioId: aulaSelecionada.id });
        chamadaId = chamada.id;
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

  const tituloAtual =
    tipo === "extra"
      ? extra.nome.trim() || "Aula extra"
      : aulaSelecionada?.turma?.nome || "Chamada";

  return (
    <>
      {!modoChamada ? (
        <div className="mb-5 rounded-3xl border border-white/10 bg-[#111111] p-5">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-red-500">Aula</p>
            <h2 className="mt-1 text-3xl font-bold">Iniciar chamada</h2>
            <p className="mt-2 text-gray-400">
              Abra uma aula da grade de hoje ou uma aula extra para toda a academia.
            </p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            {[
              ["turma", "Grade de hoje"],
              ["extra", "Aula extra"],
            ].map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setTipo(valor)}
                className={
                  tipo === valor
                    ? "min-h-11 rounded-2xl bg-red-700 px-3 text-sm font-semibold"
                    : "min-h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-zinc-400"
                }
              >
                {rotulo}
              </button>
            ))}
          </div>

          {tipo === "turma" ? (
            <div className="space-y-3">
              {aulasHoje.length ? (
                <>
                  <select
                    value={horarioSelecionado}
                    onChange={(event) => setHorarioSelecionado(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-white/10 bg-[#1A1A1A] px-4 text-base"
                  >
                    <option value="">Selecionar aula de hoje</option>
                    {aulasHoje.map((aula) => (
                      <option key={aula.id} value={aula.id}>
                        {aula.turma.nome} · {horaCurta(aula.horario_inicio)}
                        {aula.professor ? ` · ${aula.professor}` : ""}
                      </option>
                    ))}
                  </select>

                  {aulaSelecionada ? (
                    <div className="rounded-2xl bg-black/25 p-3 text-sm text-zinc-400">
                      <p className="font-semibold text-zinc-200">
                        {aulaSelecionada.turma.nome}
                      </p>
                      <p className="mt-1">
                        {horaCurta(aulaSelecionada.horario_inicio)} ·{" "}
                        {aulaSelecionada.professor || "Professor indisponível ainda"}
                      </p>
                    </div>
                  ) : null}

                  <button
                    onClick={abrirChamadaTurma}
                    disabled={!horarioSelecionado || carregando}
                    className="h-14 w-full rounded-2xl bg-red-700 text-lg font-bold disabled:opacity-40"
                  >
                    {carregando ? "Carregando..." : "Iniciar chamada"}
                  </button>
                </>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-500">
                  Não há aulas da sua grade disponíveis hoje.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border border-red-900/30 bg-red-950/15 p-4">
                <div className="flex gap-3">
                  <UsersRound size={20} className="mt-0.5 shrink-0 text-red-500" />
                  <p className="text-sm leading-6 text-zinc-400">
                    Disponível para todos os alunos ativos e com notificação push.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">Nome da aula <span className="text-zinc-500">(opcional)</span></label>
                <input
                  value={extra.nome}
                  onChange={(event) => setExtra((atual) => ({ ...atual, nome: event.target.value }))}
                  placeholder="Ex.: Open mat, treino de domingo"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#1A1A1A] px-4 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">Local</label>
                <select
                  value={extra.localId}
                  onChange={(event) => setExtra((atual) => ({ ...atual, localId: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#1A1A1A] px-4"
                >
                  <option value="">Selecionar local</option>
                  {locais.map((local) => (
                    <option key={local.id} value={local.id}>{local.nome}</option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 overflow-hidden">
                <label className="mb-2 block text-sm text-zinc-400">Horário</label>
                <input
                  type="time"
                  value={extra.horario}
                  onChange={(event) => setExtra((atual) => ({ ...atual, horario: event.target.value }))}
                  className="h-12 min-w-0 w-full max-w-full rounded-2xl border border-white/10 bg-[#1A1A1A] px-4"
                />
              </div>

              <button
                type="button"
                onClick={abrirExtra}
                disabled={!extra.localId || !extra.horario || carregando}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-red-700 text-lg font-bold disabled:opacity-40"
              >
                <Plus size={20} />
                {carregando ? "Abrindo..." : "Abrir aula extra"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-5 rounded-3xl border border-white/10 bg-[#111111] p-4">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              {tipo === "extra" ? (
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-red-500">Aula extra</p>
              ) : (
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-red-500">
                  {horaCurta(aulaSelecionada?.horario_inicio)}
                </p>
              )}
              <h2 className="text-2xl font-bold">{tituloAtual}</h2>
              <p className="text-gray-400">{presentes.length} presença(s)</p>
            </div>

            <div className="flex gap-2">
              {tipo === "extra" ? (
                <button
                  type="button"
                  onClick={cancelarExtra}
                  disabled={carregando}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-900/50 bg-red-950/30 px-4 text-sm font-semibold text-red-300"
                >
                  <X size={16} /> Cancelar
                </button>
              ) : null}
              <button
                onClick={confirmarChamada}
                disabled={carregando}
                className="h-11 rounded-xl bg-green-700 px-5 font-semibold disabled:opacity-50"
              >
                {carregando ? "Salvando..." : "Confirmar chamada"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {alunosChamada.map((aluno) => {
              const presente = presentes.some((item) => item.id === aluno.id);
              return (
                <button
                  key={aluno.id}
                  onClick={() => togglePresenca(aluno)}
                  className={
                    presente
                      ? "rounded-2xl bg-green-700 p-4 text-left text-white"
                      : "rounded-2xl border border-white/10 bg-[#1A1A1A] p-4 text-left"
                  }
                >
                  <h3 className="font-bold">{aluno.nome}</h3>
                  <p className="mt-1 text-sm opacity-80">
                    Faixa {aluno.faixa}{aluno.graus > 0 ? ` · ${aluno.graus}º grau` : ""}
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
