import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ehAluno, rotuloCargo } from "@/lib/permissoes";
import { useAlunoPortal } from "@/hooks/useAlunoPortal";

import PainelMais from "./PainelMais";
import Perfil from "./Perfil";
import TelaTurma from "./TelaTurma";
import Home from "./Home";
import PainelAlunos from "./PainelAlunos";
import PainelTurmas from "./PainelTurmas";
import PainelChamada from "./PainelChamada";
import BottomNavigation from "./navigation/BottomNavigation";
import AlunoInicio from "./aluno/AlunoInicio";
import AlunoTurmas from "./aluno/AlunoTurmas";
import AlunoFrequencia from "./aluno/AlunoFrequencia";

const PAGINAS_ALUNO = new Set(["home", "turmas", "frequencia", "mais", "perfil"]);
const PAGINAS_GESTAO = new Set([
  "home",
  "alunos",
  "chamada",
  "turmas",
  "turma",
  "mais",
  "perfil",
]);

export default function Dashboard() {
  const { usuario } = useAuth();
  const aluno = ehAluno(usuario);

  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [tela, setTela] = useState({ pagina: "home", turma: null });

  const portalAluno = useAlunoPortal(usuario?.aluno_id, aluno);

  useEffect(() => {
    const paginasPermitidas = aluno ? PAGINAS_ALUNO : PAGINAS_GESTAO;

    if (!paginasPermitidas.has(tela.pagina)) {
      setTela({ pagina: "home", turma: null });
    }
  }, [aluno, tela.pagina]);

  useEffect(() => {
    if (aluno) {
      setAlunos([]);
      setTurmas([]);
      return;
    }

    let ativo = true;

    async function carregarGestao() {
      const [resultadoAlunos, resultadoTurmas] = await Promise.all([
        supabase.from("alunos").select("*").order("nome"),
        supabase.from("turmas").select("*").order("nome"),
      ]);

      if (!ativo) return;

      if (resultadoAlunos.error) {
        console.error("Erro ao carregar alunos:", resultadoAlunos.error);
      } else {
        setAlunos(resultadoAlunos.data || []);
      }

      if (resultadoTurmas.error) {
        console.error("Erro ao carregar turmas:", resultadoTurmas.error);
      } else {
        setTurmas(resultadoTurmas.data || []);
      }
    }

    carregarGestao();

    return () => {
      ativo = false;
    };
  }, [aluno]);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-[max(20px,env(safe-area-inset-top))]">
        {tela.pagina !== "perfil" && (
          <header className="mb-7 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setTela({ pagina: "perfil", turma: null })}
              className="flex min-w-0 items-center gap-3 text-left"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                {usuario?.foto ? (
                  <img
                    src={usuario.foto}
                    alt={usuario.nome}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-zinc-400">
                    {usuario?.nome?.slice(0, 1)?.toUpperCase() || "D"}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-500">
                  {rotuloCargo(usuario?.cargo)} DTBJJ
                </p>
                <h1 className="truncate text-xl font-bold">
                  Olá, {usuario?.nome?.split(" ")[0] || "Atleta"}
                </h1>
              </div>
            </button>

            <img
              src="/dtbjjapplogo.png"
              alt="DTBJJ"
              className="h-9 w-9 object-contain opacity-80"
            />
          </header>
        )}

        {aluno ? (
          <>
            {tela.pagina === "home" && (
              <AlunoInicio portal={portalAluno} setTela={setTela} />
            )}
            {tela.pagina === "turmas" && <AlunoTurmas portal={portalAluno} />}
            {tela.pagina === "frequencia" && (
              <AlunoFrequencia portal={portalAluno} />
            )}
          </>
        ) : (
          <>
            {tela.pagina === "home" && (
              <Home alunos={alunos} turmas={turmas} setTela={setTela} />
            )}
            {tela.pagina === "alunos" && (
              <PainelAlunos turmas={turmas} setTela={setTela} />
            )}
            {tela.pagina === "chamada" && (
              <PainelChamada turmas={turmas} />
            )}
            {tela.pagina === "turmas" && <PainelTurmas setTela={setTela} />}
            {tela.pagina === "turma" && (
              <TelaTurma turma={tela.turma} setTela={setTela} />
            )}
          </>
        )}

        {tela.pagina === "mais" && <PainelMais setTela={setTela} />}
        {tela.pagina === "perfil" && <Perfil setTela={setTela} />}
      </main>

      <BottomNavigation tela={tela} setTela={setTela} usuario={usuario} />
    </div>
  );
}
