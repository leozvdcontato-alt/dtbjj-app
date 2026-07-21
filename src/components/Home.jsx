import PainelChamada from "./PainelChamada";

export default function Home({
  turmas,
}) {
  return (
    <div className="space-y-5">

      <PainelChamada
        turmas={turmas}
      />

      <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🥋</span>

          <h2 className="text-lg font-bold">
            Próximas graduações
          </h2>
        </div>

        <p className="text-sm text-gray-400">
          Em breve você verá aqui os alunos mais próximos da próxima faixa.
        </p>

      </div>

      <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📅</span>

          <h2 className="text-lg font-bold">
            Última chamada
          </h2>
        </div>

        <p className="text-sm text-gray-400">
          Nenhuma chamada realizada hoje.
        </p>

      </div>

    </div>
  );
}