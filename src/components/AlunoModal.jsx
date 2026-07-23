import MultiSelect from "./ui/MultiSelect";

export default function AlunoModal({
  modal,
  editando,
  form,
  setForm,
  salvarAluno,
  setModal,
  turmas,
}) {

  if (!modal) return null;
console.log("Turmas:", turmas);
return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-xl max-h-[90vh] bg-[#121212] rounded-3xl flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {editando ? "Editar Aluno" : "Novo Aluno"}
        </h2>

        <button
          onClick={() => setModal(false)}
          className="text-gray-400 hover:text-white text-2xl"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">

        <div className="space-y-5">

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Nome
            </label>

            <input
              value={form.nome}
              onChange={(e) =>
                setForm({
                  ...form,
                  nome: e.target.value,
                })
              }
              className="w-full h-14 rounded-2xl bg-[#1A1A1A] px-4"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              CPF
            </label>

            <input
              value={form.cpf}
              onChange={(e) =>
                setForm({
                  ...form,
                  cpf: e.target.value,
                })
              }
              className="w-full h-14 rounded-2xl bg-[#1A1A1A] px-4"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Telefone
            </label>

            <input
              value={form.telefone}
              onChange={(e) =>
                setForm({
                  ...form,
                  telefone: e.target.value,
                })
              }
              className="w-full h-14 rounded-2xl bg-[#1A1A1A] px-4"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">

            <select
              value={form.faixa}
              onChange={(e) =>
                setForm({
                  ...form,
                  faixa: e.target.value,
                })
              }
              className="h-14 rounded-2xl bg-[#1A1A1A] px-4"
            >
              <option value="Branca">Branca</option>
              <option value="Cinza e Branca">Cinza e Branca</option>
              <option value="Cinza">Cinza</option>
              <option value="Cinza e Preta">Cinza e Preta</option>
              <option value="Amarela e Branca">Amarela e Branca</option>
              <option value="Amarela">Amarela</option>
              <option value="Amarela e Preta">Amarela e Preta</option>
              <option value="Laranja e Branca">Laranja e Branca</option>
              <option value="Laranja">Laranja</option>
              <option value="Laranja e Preta">Laranja e Preta</option>
              <option value="Verde e Branca">Verde e Branca</option>
              <option value="Verde">Verde</option>
              <option value="Verde e Preta">Verde e Preta</option>
              <option value="Azul">Azul</option>
              <option value="Roxa">Roxa</option>
              <option value="Marrom">Marrom</option>
              <option value="Preta">Preta</option>
            </select>

            <select
              value={form.graus}
              onChange={(e) =>
                setForm({
                  ...form,
                  graus: Number(e.target.value),
                })
              }
              className="h-14 rounded-2xl bg-[#1A1A1A] px-4"
            >
              <option value="0">0 Grau</option>
              <option value="1">1 Grau</option>
              <option value="2">2 Graus</option>
              <option value="3">3 Graus</option>
              <option value="4">4 Graus</option>
            </select>

            <select
              value={form.categoria}
              onChange={(e) =>
                setForm({
                  ...form,
                  categoria: e.target.value,
                })
              }
              className="h-14 rounded-2xl bg-[#1A1A1A] px-4"
            >
              <option value="Kids">Kids</option>
              <option value="Juvenil">Juvenil</option>
              <option value="Adulto">Adulto</option>
            </select>

            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value,
                })
              }
              className="h-14 rounded-2xl bg-[#1A1A1A] px-4"
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>

          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Turmas
            </label>

            <MultiSelect
              options={turmas}
              value={form.turmas}
              onChange={(turmasSelecionadas) =>
                setForm({
                  ...form,
                  turmas: turmasSelecionadas,
                })
              }
              placeholder="Selecione as turmas"
            />
          </div>

        </div>

      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-5 flex justify-end gap-3 bg-[#121212]">

        <button
          onClick={() => setModal(false)}
          className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition"
        >
          Cancelar
        </button>

        <button
          onClick={salvarAluno}
          className="px-6 py-3 rounded-2xl bg-red-700 hover:bg-red-600 transition"
        >
          Salvar
        </button>

      </div>

    </div>
  </div>
)}