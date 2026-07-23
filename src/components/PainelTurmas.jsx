import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ChevronRight } from "lucide-react";

export default function PainelTurmas() {

  const formularioInicial = {
  nome: "",
  horario: "",
  dias: "",
  professor: "",
};

  const [turmas, setTurmas] =
    useState([]);

  const [modal, setModal] =
    useState(false);

  const [editando, setEditando] =
    useState(null);

  const [form, setForm] =
    useState(formularioInicial);
    
    async function carregarTurmas() {

  const { data, error } = await supabase
    .from("turmas")
    .select("*")
    .order("nome");

  if (error) {
    console.error(error);
    return;
  }

  setTurmas(data);

}

  useEffect(() => {

    carregarTurmas();

  }, []);

function novaTurma() {

  setEditando(null);

  setForm(formularioInicial);

  setModal(true);

}
function editarTurma(turma) {

  setEditando(turma);

  setForm({
    ...formularioInicial,
    ...turma,
  });

  setModal(true);

}
  async function salvarTurma() {

    if (editando) {

      const { error } =
        await supabase
          .from("turmas")
          .update({
  nome: form.nome,
  horario: form.horario,
  dias: form.dias,
  professor: form.professor,
})
          .eq("id", editando.id);

      if (error) {

        console.error(error);
        return;

      }

    } else {

      const { error } =
        await supabase
          .from("turmas")
          .insert([
  {
    nome: form.nome,
    horario: form.horario,
    dias: form.dias,
    professor: form.professor,
  },
]);

      if (error) {

        console.error(error);
        return;

      }

    }

await carregarTurmas();

setForm(formularioInicial);

setEditando(null);

setModal(false);

}

  return (

    <>

      <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 mt-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <div>

            <h2 className="text-2xl font-bold">
              Minhas Turmas
            </h2>

          </div>

          {/*<button
            onClick={novaTurma}
            className="bg-red-700 hover:bg-red-600 px-6 py-4 rounded-2xl font-bold"
          >
            Adicionar Turma
          </button>*/}

        </div>

<div className="space-y-4">

  {turmas.map((turma) => (

    <button
      key={turma.id}
      type="button"
      onClick={() => {
        console.log("Entrar na turma:", turma);
      }}
className="w-full py-5 text-left hover:bg-white/5 transition-colors"
>

      <div className="flex items-center justify-between">

        <div>

          <h3 className="text-xl font-bold">
          {turma.nome}
          </h3>

{(turma.dias || turma.horario) && (
  <p className="text-sm text-gray-400 mt-0.5">
    {[turma.dias, turma.horario]
      .filter(Boolean)
      .join(" • ")}
  </p>
)}
        </div>

        <ChevronRight
    size={20}
    className="text-white/30"
/>

      </div>
<hr className="border-white/10 mt-4" />

    </button>

  ))}

</div>

      </div>

      {modal && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">

          <div className="bg-[#111111] border border-white/10 rounded-2xl p-4 w-full max-w-xl">

            <h2 className="text-2xl font-bold mb-6">

              {editando
                ? "Editar Turma"
                : "Nova Turma"}

            </h2>

            <div className="grid grid-cols-1 gap-4">

              <input
                placeholder="Nome da turma"
                value={form.nome}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nome: e.target.value,
                  })
                }
                className="h-14 rounded-2xl bg-[#1A1A1A] px-4"
              />

              <input
                placeholder="Horário"
                value={form.horario}
                onChange={(e) =>
                  setForm({
                    ...form,
                    horario: e.target.value,
                  })
                }
                className="h-14 rounded-2xl bg-[#1A1A1A] px-4"
              />

<div>
  <label className="block text-sm text-gray-400 mb-3">
    Dias da semana
  </label>

  <div className="flex flex-wrap gap-2">

    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((dia) => {

      const selecionado = form.dias.includes(dia);

      return (
        <button
          key={dia}
          type="button"
          onClick={() => {

            const dias = form.dias
              ? form.dias.split(" • ")
              : [];

            const novosDias = dias.includes(dia)
              ? dias.filter((d) => d !== dia)
              : [...dias, dia];

            setForm({
              ...form,
              dias: novosDias.join(" • "),
            });

          }}
          className={`px-4 py-2 rounded-xl text-sm transition
            ${
              selecionado
                ? "bg-red-700 text-white"
                : "bg-[#1A1A1A] border border-white/10 hover:border-red-700"
            }`}
        >
          {dia}
        </button>
      );

    })}

  </div>

</div>
              <input
                placeholder="Professor"
                value={form.professor}
                onChange={(e) =>
                  setForm({
                    ...form,
                    professor: e.target.value,
                  })
                }
                className="h-14 rounded-2xl bg-[#1A1A1A] px-4"
              />

            </div>

            <div className="flex justify-end gap-4 mt-6">

              <button
                onClick={() =>
                  setModal(false)
                }
                className="bg-white/10 hover:bg-white/20 px-6 py-4 rounded-2xl font-semibold"
              >
                Cancelar
              </button>

              <button
                onClick={salvarTurma}
                className="bg-red-700 hover:bg-red-600 px-6 py-4 rounded-2xl font-semibold"
              >
                Salvar
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}