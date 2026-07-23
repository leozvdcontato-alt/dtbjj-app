import { useState } from "react";
import { buscarAlunosDaTurma } from "@/services/alunos";
import { criarChamada } from "@/services/chamadas";
import { registrarPresencas } from "@/services/presencas";
import { useToast } from "@/contexts/ToastContext";

export default function PainelChamada({ turmas }) {
  const { mostrarToast } = useToast();

  const [modoChamada, setModoChamada] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [alunosChamada, setAlunosChamada] = useState([]);
  const [presentes, setPresentes] = useState([]);
  const [carregando, setCarregando] = useState(false);

  async function abrirChamada() {
    if (!turmaSelecionada) return;

    try {
      setCarregando(true);

      const alunos = await buscarAlunosDaTurma(
        Number(turmaSelecionada)
      );

      setAlunosChamada(alunos);
      setPresentes([]);
      setModoChamada(true);
    } catch (error) {
      console.error(error);
      mostrarToast("Erro ao carregar alunos.", "error");
    } finally {
      setCarregando(false);
    }
  }

  function togglePresenca(aluno) {
    const existe = presentes.some((p) => p.id === aluno.id);

    if (existe) {
      setPresentes((prev) =>
        prev.filter((p) => p.id !== aluno.id)
      );
    } else {
      setPresentes((prev) => [...prev, aluno]);
    }
  }

  async function confirmarChamada() {
    try {
      setCarregando(true);

      const turma = turmas.find(
        (t) => t.id === Number(turmaSelecionada)
      );

      if (!turma) {
        mostrarToast("Turma não encontrada.", "error");
        return;
      }

      const { id: chamadaId } = await criarChamada({
        turmaId: turma.id,
        professor: turma.professor,
      });

      await registrarPresencas(
        chamadaId,
        presentes
      );

      mostrarToast("Chamada registrada com sucesso!");

      setModoChamada(false);
      setPresentes([]);
      setAlunosChamada([]);
      setTurmaSelecionada("");
    } catch (error) {
      console.error(error);

      mostrarToast(
        error.message || "Erro ao registrar chamada.",
        "error"
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      {!modoChamada && (
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 mb-5">
          <div className="mb-5">
            <p className="text-sm text-red-500 font-semibold uppercase tracking-wider">
              Aula
            </p>

            <h2 className="text-3xl font-bold mt-1">
              Iniciar chamada
            </h2>

            <p className="text-gray-400 mt-2">
              Selecione uma turma para começar.
            </p>
          </div>

          <div className="space-y-3">
            <select
              value={turmaSelecionada}
              onChange={(e) =>
                setTurmaSelecionada(e.target.value)
              }
              className="w-full h-14 rounded-2xl bg-[#1A1A1A] px-4 text-lg"
            >
              <option value="">
                Selecionar turma
              </option>

              {turmas.map((turma) => (
                <option
                  key={turma.id}
                  value={turma.id}
                >
                  {turma.nome}
                </option>
              ))}
            </select>

            <button
              onClick={abrirChamada}
              disabled={!turmaSelecionada || carregando}
              className="w-full h-14 rounded-2xl bg-red-700 hover:bg-red-600 disabled:opacity-40 font-bold text-lg transition"
            >
              {carregando
                ? "Carregando..."
                : "Iniciar chamada"}
            </button>
          </div>
        </div>
      )}

      {modoChamada && (
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 mb-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                {
                  turmas.find(
                    (t) =>
                      String(t.id) ===
                      String(turmaSelecionada)
                  )?.nome
                }
              </h2>

              <p className="text-gray-400">
                {presentes.length} presença(s)
              </p>
            </div>

            <button
              onClick={confirmarChamada}
              disabled={carregando}
              className="h-11 px-5 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-xl font-semibold"
            >
              {carregando
                ? "Salvando..."
                : "Confirmar chamada"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alunosChamada.map((aluno) => {
              const presente = presentes.some(
                (p) => p.id === aluno.id
              );

              return (
                <button
                  key={aluno.id}
                  onClick={() =>
                    togglePresenca(aluno)
                  }
                  className={
                    presente
                      ? "bg-green-700 text-white rounded-2xl p-4 text-left transition"
                      : "bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 text-left transition"
                  }
                >
                  <h3 className="text-lg font-bold mb-2">
                    {aluno.nome}
                  </h3>

                  <p className="text-sm opacity-80">
                    Faixa {aluno.faixa}
                    {aluno.graus > 0 &&
                      ` • ${aluno.graus}º grau`}
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