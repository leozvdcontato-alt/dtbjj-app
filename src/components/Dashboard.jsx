import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import Home from "./Home";
import PainelAlunos from "./PainelAlunos";
import PainelTurmas from "./PainelTurmas";

export default function Dashboard({ user, setUser }) {

  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [tela, setTela] = useState("home");

  async function carregarAlunos() {

    const { data, error } = await supabase
      .from("alunos")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    setAlunos(data || []);

  }

  async function carregarTurmas() {

    const { data, error } = await supabase
      .from("turmas")
      .select("*")
      .order("nome");

    if (error) {
      console.error(error);
      return;
    }

    setTurmas(data || []);

  }

  useEffect(() => {

    carregarAlunos();
    carregarTurmas();

  }, []);

  return (

    <div className="min-h-screen bg-black text-white">

      <div className="max-w-5xl mx-auto p-4">

        <div className="flex items-center justify-between mb-6">

          <div className="flex items-center gap-3">

            <img
              src="/dtbjjapplogo.png"
              className="w-12 h-12 object-contain"
              alt="Logo"
            />

            <div>

              <h1 className="text-2xl font-bold">
                Olá, {user?.nome || "Professor"} 
              </h1>

              <p className="text-sm text-gray-400">
                Dream Team Brazilian Jiu-Jitsu
              </p>

            </div>

          </div>

          <button
            onClick={() => setUser(null)}
            className="h-10 px-4 bg-red-700 hover:bg-red-600 rounded-xl text-sm font-semibold"
          >
            Sair
          </button>

        </div>

        {tela === "home" && (

          <Home
            alunos={alunos}
            turmas={turmas}
            setTela={setTela}
          />

        )}

        {tela === "alunos" && (

          <PainelAlunos
            turmas={turmas}
            setTela={setTela}
          />

        )}

        {tela === "turmas" && (

          <PainelTurmas
            setTela={setTela}
          />

        )}

      </div>

    </div>

  );

}