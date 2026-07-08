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

<div className="flex items-center justify-between mb-5">

  <div className="flex items-center gap-3">

    <img
      src="/dtbjjapplogo.png"
      className="w-12 h-12 object-contain"
      alt="Logo"
    />

    <div>

      <h1 className="text-2xl font-bold leading-none">
        Dashboard
      </h1>

      <p className="text-sm text-gray-400">
        Dream Team Brazilian Jiu-Jitsu
      </p>

    </div>

  </div>

  <button
    onClick={() => setUser(null)}
    className="h-10 px-4 bg-red-700 hover:bg-red-600 rounded-xl font-semibold text-sm"
  >
    Sair
  </button>

</div>

<div className="bg-[#111111] border border-white/10 rounded-2xl p-4 mb-6">

  <div className="flex justify-between items-center py-2">

    <span className="text-gray-400">
      Alunos
    </span>

    <span className="text-2xl font-bold">
      {alunos.length}
    </span>

  </div>

  <div className="border-t border-white/10 my-2" />

  <div className="flex justify-between items-center py-2">

    <span className="text-gray-400">
      Turmas
    </span>

    <span className="text-2xl font-bold">
      {turmas.length}
    </span>

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