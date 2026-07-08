import PainelChamada from "./PainelChamada";

export default function Home({
  turmas,
  setTela,
}) {

  return (

    <div className="space-y-5">

      <PainelChamada
        turmas={turmas}
      />

      <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">

        <h2 className="text-lg font-bold mb-4">
          Gerenciar
        </h2>

        <button
          onClick={() => setTela("alunos")}
          className="w-full flex items-center justify-between h-14 px-4 rounded-xl hover:bg-white/5 transition"
        >
          <span>👤 Alunos</span>
          <span className="text-gray-500">›</span>
        </button>

        <button
          onClick={() => setTela("turmas")}
          className="w-full flex items-center justify-between h-14 px-4 rounded-xl hover:bg-white/5 transition"
        >
          <span>🥋 Turmas</span>
          <span className="text-gray-500">›</span>
        </button>

      </div>

      <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">

        <h2 className="text-lg font-bold mb-2">
          Atividade
        </h2>

        <p className="text-sm text-gray-400">
          Nenhuma chamada realizada hoje.
        </p>

      </div>

    </div>

  );

}