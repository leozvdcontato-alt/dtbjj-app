import { useEffect, useState } from "react";

import PainelChamada from "./PainelChamada";

import { buscarUltimaChamada } from "@/services/chamadas";

export default function Home({
  turmas,
}) {

  const [ultimaChamada, setUltimaChamada] =
    useState(null);

  useEffect(() => {
    carregarUltimaChamada();
  }, []);

  function formatarData(data, horario) {
  const hoje = new Date();
  const chamada = new Date(`${data}T00:00:00`);

  const diff =
    Math.floor(
      (hoje.setHours(0, 0, 0, 0) -
        chamada.getTime()) /
        (1000 * 60 * 60 * 24)
    );

  if (diff === 0) {
    return `Hoje às ${horario}`;
  }

  if (diff === 1) {
    return `Ontem às ${horario}`;
  }

  const [ano, mes, dia] = data.split("-");

  return `${dia}/${mes} às ${horario}`;
}

function corDaBarra(percentual) {
  if (percentual < 50) {
    return "bg-red-600";
  }

  if (percentual < 75) {
    return "bg-yellow-500";
  }

  return "bg-green-600";
}

  async function carregarUltimaChamada() {
    try {
      const chamada =
        await buscarUltimaChamada();

      setUltimaChamada(chamada);
    } catch {
      setUltimaChamada(null);
    }
  }

  return (
    <div className="space-y-5">

      <PainelChamada
  turmas={turmas}
  onChamadaRegistrada={carregarUltimaChamada}
/>

      <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">

        <div className="flex items-center gap-2 mb-3">

          <span className="text-xl">
            📅
          </span>

          <h2 className="text-lg font-bold">
            Última chamada
          </h2>

        </div>

        {!ultimaChamada ? (

          <p className="text-sm text-gray-400">
            Nenhuma chamada realizada.
          </p>

        ) : (

          <>

            <h3 className="text-xl font-bold">
              {ultimaChamada.turma}
            </h3>

            <p className="text-gray-400 mt-1">
  {formatarData(
    ultimaChamada.data,
    ultimaChamada.horario
  )}
</p>

            <p className="mt-4 font-semibold">
  {ultimaChamada.presentes}
  {" de "}
  {ultimaChamada.matriculados}
  {" alunos presentes"}
  {" • "}
  {Math.round(
    ultimaChamada.matriculados === 0
      ? 0
      : (ultimaChamada.presentes /
          ultimaChamada.matriculados) *
          100
  )}
  %
</p>

            <div className="w-full bg-zinc-800 rounded-full h-2 mt-3">

              <div
  className={`${corDaBarra(
    Math.round(
      ultimaChamada.matriculados === 0
        ? 0
        : (ultimaChamada.presentes /
            ultimaChamada.matriculados) *
            100
    )
  )} h-2 rounded-full transition-all duration-500`}
  style={{
    width: `${
      ultimaChamada.matriculados === 0
        ? 0
        : (ultimaChamada.presentes /
            ultimaChamada.matriculados) *
            100
    }%`,
  }}
/>

            </div>

          </>

        )}

      </div>

    </div>
  );
}