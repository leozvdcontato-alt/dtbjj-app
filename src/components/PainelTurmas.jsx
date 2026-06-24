import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function PainelTurmas() {

  const [turmas, setTurmas] =
    useState([]);

  const [modal, setModal] =
    useState(false);

  const [editando, setEditando] =
    useState(null);

  const [form, setForm] =
    useState({
      nome: "",
      horario: "",
      professor: "",
    });

 async function carregarTurmas() {

  const { data, error } =
    await supabase
      .from("turmas")
      .select("*");

  console.log("DATA:", data);
  console.log("ERROR:", error);

  setTurmas(data || []);
}

  useEffect(() => {

    carregarTurmas();

  }, []);

  function novaTurma() {

    setEditando(null);

    setForm({
      nome: "",
      horario: "",
      professor: "",
    });

    setModal(true);
  }

  function editarTurma(turma) {

    setEditando(turma);

    setForm({
      nome: turma.nome,
      horario: turma.horario,
      professor: turma.professor,
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
              professor: form.professor,
            },
          ]);

      if (error) {

        console.error(error);
        return;

      }

    }

    setModal(false);

    carregarTurmas();
  }

  return (

    <>

      <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 mt-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <div>

            <h2 className="text-2xl font-bold">
              Gestão de Turmas
            </h2>

            <p className="text-gray-400">
              Gerencie as turmas cadastradas
            </p>

          </div>

          <button
            onClick={novaTurma}
            className="bg-red-700 hover:bg-red-600 px-6 py-4 rounded-2xl font-bold"
          >
            Adicionar Turma
          </button>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {turmas.map((turma, index) => (

            <div
              key={index}
              className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-5"
            >

              <h3 className="text-2xl font-bold mb-3">
                {turma.nome}
              </h3>

              <p className="text-gray-400 mb-2">
                🕒 {turma.horario}
              </p>

              <p className="text-gray-400 mb-5">
                👨‍🏫 {turma.professor}
              </p>

              <button
                onClick={() =>
                  editarTurma(turma)
                }
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm"
              >
                Editar
              </button>

            </div>

          ))}

        </div>

      </div>

      {modal && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">

          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 w-full max-w-xl">

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