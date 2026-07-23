export default function AlunoPerfil({
  perfilModal,
  perfilAluno,
  editarAluno,
  setPerfilModal,
}) {

  if (!perfilModal || !perfilAluno) return null;

  return (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">

          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 w-full max-w-4xl">
            <h2 className="text-3xl font-bold mb-6">
              {perfilAluno.aluno.nome}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">

              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <p className="text-gray-400">
                  Faixa
                </p>

                <div>

                  {perfilAluno.aluno.faixa === "Branca" && (
                    <span className="px-4 py-2 rounded-xl bg-white text-black font-bold">
                      BRANCA
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Cinza" && (
                    <span className="px-4 py-2 rounded-xl bg-gray-500 text-white font-bold">
                      CINZA
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Amarela" && (
                    <span className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold">
                      AMARELA
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Laranja" && (
                    <span className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold">
                      LARANJA
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Verde" && (
                    <span className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold">
                      VERDE
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Azul" && (
                    <span className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold">
                      AZUL
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Roxa" && (
                    <span className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold">
                      ROXA
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Marrom" && (
                    <span className="px-4 py-2 rounded-xl bg-amber-800 text-white font-bold">
                      MARROM
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Preta" && (
                    <span className="px-4 py-2 rounded-xl bg-black border border-white/20 text-white font-bold">
                      PRETA
                    </span>
                  )}

                </div></div>

              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <p className="text-gray-400">
                  Graus
                </p>

                <p className="text-3xl mt-2">
                  {Number(perfilAluno.aluno.graus || 0) === 0
                    ? "Nenhum"
                    : "⬜".repeat(
                      Number(perfilAluno.aluno.graus || 0)
                    )}
                </p>
              </div>

              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <p className="text-gray-400">
                  Status
                </p>

                <p className="text-xl font-bold">
                  {perfilAluno.aluno.status === "Ativo"
                    ? "🟢 Ativo"
                    : "🔴 Inativo"}
                </p>
              </div>

              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <p className="text-gray-400">
                  Presenças
                </p>
                <p className="text-xl font-bold">
                  {perfilAluno.totalPresencas}
                </p>
              </div>

              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <p className="text-gray-400">
                  Meta
                </p>
                <p className="text-xl font-bold">
                  {perfilAluno.metaGraduacao}
                </p>
              </div>

              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <p className="text-gray-400">
                  Faltam
                </p>

                <p className="text-xl font-bold">
                  {perfilAluno.faltam}
                </p>

                <p
                  className={
                    perfilAluno.aptoGraduacao
                      ? "text-green-400 text-sm mt-2"
                      : "text-red-400 text-sm mt-2"
                  }
                >
                  {perfilAluno.aptoGraduacao
                    ? "🟢 Apto"
                    : "🔴 Não apto"}
                </p>
              </div>

            </div>

            <div className="mb-6">

              <h3 className="text-xl font-bold mb-3">
                Turmas
              </h3>

              {perfilAluno.turmas.map((turma) => (

                <div
                  key={turma.id}
                  className="bg-[#1A1A1A] p-3 rounded-xl mb-2"
                >
                  {turma.nome}
                </div>

              ))}

            </div>

            <div className="flex gap-3 mt-6">

              <button
                onClick={() => {
                  setPerfilModal(false);
                  editarAluno(perfilAluno.aluno);
                }}
                className="bg-blue-700 hover:bg-blue-600 px-6 py-3 rounded-2xl"
              >
                Editar
              </button>

              <button
                onClick={() =>
                  setPerfilModal(false)
                }
                className="bg-red-700 hover:bg-red-600 px-6 py-3 rounded-2xl"
              >
                Fechar
              </button>

            </div>
          </div>

        </div>

      )}