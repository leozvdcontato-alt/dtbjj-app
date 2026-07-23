export default function TelaTurma({ turma, setTela }) {
  return (
    <div className="mt-6">

      <button
        onClick={() =>
          setTela({
            pagina: "turmas",
            turma: null,
          })
        }
        className="text-red-500 mb-6"
      >
        ← Voltar
      </button>

      <h2 className="text-3xl font-bold">
        {turma.nome}
      </h2>

      <p className="text-gray-400 mt-2">
        {[turma.dias, turma.horario]
          .filter(Boolean)
          .join(" • ")}
      </p>

    </div>
  );
}