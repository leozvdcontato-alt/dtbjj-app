import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

import TelaTurma from "./TelaTurma";
import Home from "./Home";
import PainelAlunos from "./PainelAlunos";
import PainelTurmas from "./PainelTurmas";
import BottomNavigation from "./navigation/BottomNavigation";

export default function Dashboard() {
  const { usuario, logout } = useAuth();

  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [tela, setTela] = useState({
    pagina: "home",
    turma: null,
  });

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
    <div className="min-h-screen bg-black text-white flex flex-col">

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 pb-24">

        <header className="flex items-center justify-between mb-6">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">

              {usuario?.foto ? (
                <img
                  src={usuario.foto}
                  alt={usuario.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-7 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0"
                  />
                </svg>
              )}

            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Olá, {usuario?.nome?.split(" ")[0]} 👋
              </h1>

              <p className="text-sm text-gray-400">
                {usuario?.cargo}
              </p>
            </div>

          </div>

          <button
            onClick={logout}
            className="text-sm text-red-400 hover:text-red-300 transition"
          >
            Sair
          </button>

        </header>

        {tela.pagina === "home" && (
          <Home
            alunos={alunos}
            turmas={turmas}
            setTela={setTela}
          />
        )}

        {tela.pagina === "alunos" && (
          <PainelAlunos
            turmas={turmas}
            setTela={setTela}
          />
        )}

        {tela.pagina === "turmas" && (
          <PainelTurmas
            setTela={setTela}
          />
        )}

        {tela.pagina === "turma" && (
          <TelaTurma
            turma={tela.turma}
            setTela={setTela}
          />
        )}

      </main>

      <BottomNavigation
        tela={tela}
        setTela={setTela}
      />

    </div>
  );
}