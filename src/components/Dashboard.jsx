import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import PainelChamada from "./PainelChamada";
import PainelAlunos from "./PainelAlunos";
import PainelTurmas from "./PainelTurmas";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxY8ksEC6xEX_jvLecF1gmc6xPIAqb5LK686RginNGMzMM6xAi_gJfzkyCniHWzvdGJiw/exec";

export default function Dashboard({
  user,
  setUser,
}) {

  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);

async function carregarAlunos() {

  const { data, error } = await supabase
    .from("alunos")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  setAlunos(data);

}

  async function carregarTurmas() {

    try {

      const response = await fetch(
        `${API_URL}?action=getTurmas`
      );

      const data = await response.json();

      setTurmas(data.turmas || []);

    } catch (error) {

      console.error("Erro ao carregar turmas:", error);

    }

  }

  useEffect(() => {

    carregarAlunos();
    carregarTurmas();

  }, []);

  return (

    <div className="min-h-screen bg-black text-white">

      <div className="max-w-7xl mx-auto p-4 md:p-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <div className="flex items-center gap-4">

            <img
              src="/dtbjjapplogo.png"
              className="w-16 h-16 object-contain"
              alt="Logo"
            />

            <div>

              <h1 className="text-3xl font-bold">
                Dashboard Admin
              </h1>

              <p className="text-gray-400">
                Dream Team Brazilian Jiu-Jitsu
              </p>

            </div>

          </div>

          <button
            onClick={() => setUser(null)}
            className="bg-red-700 hover:bg-red-600 px-5 py-3 rounded-2xl font-semibold"
          >
            Sair
          </button>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          <div className="bg-[#111111] border border-white/10 rounded-3xl p-5">

            <p className="text-gray-400 text-sm mb-2">
              Alunos
            </p>

            <h2 className="text-4xl font-bold">
              {alunos.length}
            </h2>

          </div>

          <div className="bg-[#111111] border border-white/10 rounded-3xl p-5">

            <p className="text-gray-400 text-sm mb-2">
              Turmas
            </p>

            <h2 className="text-4xl font-bold">
              {turmas.length}
            </h2>

          </div>

          <div className="bg-[#111111] border border-white/10 rounded-3xl p-5">

            <p className="text-gray-400 text-sm mb-2">
              Sistema
            </p>

            <h2 className="text-2xl font-bold text-green-500">
              Online
            </h2>

          </div>

        </div>

        <PainelChamada
          turmas={turmas}
        />

        <PainelAlunos
          turmas={turmas}
        />

        <PainelTurmas />

      </div>

    </div>

  );
}