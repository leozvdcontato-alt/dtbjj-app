import { useState } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxY8ksEC6xEX_jvLecF1gmc6xPIAqb5LK686RginNGMzMM6xAi_gJfzkyCniHWzvdGJiw/exec";

export default function PainelChamada({
  turmas,
}) {

  const [modoChamada, setModoChamada] =
    useState(false);

  const [turmaSelecionada, setTurmaSelecionada] =
    useState("");

  const [alunosChamada, setAlunosChamada] =
    useState([]);

  const [presentes, setPresentes] =
    useState([]);

  async function abrirChamada() {

    const response = await fetch(
      `${API_URL}?action=getAlunosTurma&turma=${encodeURIComponent(turmaSelecionada)}`
    );

    const data = await response.json();

    setAlunosChamada(data.alunos || []);
    setPresentes([]);
    setModoChamada(true);
  }

  function togglePresenca(aluno) {

    const existe = presentes.find(
      (p) => p.id === aluno.id
    );

    if (existe) {

      setPresentes(
        presentes.filter(
          (p) => p.id !== aluno.id
        )
      );

    } else {

      setPresentes([
        ...presentes,
        aluno,
      ]);

    }
  }

  async function confirmarChamada() {

    const turma = turmas.find(
      (t) => t.nome === turmaSelecionada
    );

    const hoje = new Date();

    const dataFormatada =
      hoje.toLocaleDateString("pt-BR");

    const horario =
      hoje.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

    const chamadaResponse = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "criarChamada",
        turma: turmaSelecionada,
        data: dataFormatada,
        horario,
        professor: turma?.professor || "",
      }),
    });

    const chamadaData =
      await chamadaResponse.json();

    const chamadaID =
      chamadaData.chamadaID;

    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "registrarPresencas",
        chamadaID,
        alunos: presentes,
      }),
    });

    alert("Chamada confirmada!");

    setModoChamada(false);
    setPresentes([]);
    setAlunosChamada([]);
  }

  return (

    <>

      {!modoChamada && (

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 mb-6">

          <h2 className="text-2xl font-bold mb-6">
            Confirmar Chamada
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <select
              value={turmaSelecionada}
              onChange={(e) =>
                setTurmaSelecionada(
                  e.target.value
                )
              }
              className="h-14 rounded-2xl bg-[#1A1A1A] px-4"
            >

              <option value="">
                Selecionar turma
              </option>

              {turmas.map((turma, index) => (

                <option
                  key={index}
                  value={turma.nome}
                >
                  {turma.nome}
                </option>

              ))}

            </select>

            <button
              onClick={abrirChamada}
              disabled={!turmaSelecionada}
              className="h-14 rounded-2xl bg-red-700 hover:bg-red-600 font-semibold disabled:opacity-40"
            >
              Abrir Chamada
            </button>

          </div>

        </div>

      )}

      {modoChamada && (

        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 mb-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

            <div>

              <h2 className="text-3xl font-bold">
                {turmaSelecionada}
              </h2>

              <p className="text-gray-400">
                {presentes.length} presença(s)
              </p>

            </div>

            <button
              onClick={confirmarChamada}
              className="bg-green-700 hover:bg-green-600 px-6 py-4 rounded-2xl font-bold text-lg"
            >
              Confirmar Chamada
            </button>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {alunosChamada.map(
              (aluno, index) => {

                const presente =
                  presentes.find(
                    (p) => p.id === aluno.id
                  );

                return (

                  <button
                    key={index}
                    onClick={() =>
                      togglePresenca(aluno)
                    }
                    className={
                      presente
                        ? "bg-green-700 text-white rounded-3xl p-5 text-left transition"
                        : "bg-[#1A1A1A] border border-white/10 rounded-3xl p-5 text-left transition"
                    }
                  >

                    <h3 className="text-xl font-bold mb-2">
                      {aluno.nome}
                    </h3>

                    <p className="text-sm opacity-80">
                      Faixa {aluno.graduacao}
                    </p>

                  </button>

                );
              }
            )}

          </div>

        </div>

      )}

    </>

  );
}