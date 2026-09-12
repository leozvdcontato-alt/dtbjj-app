import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ehAdministrador, ehAluno, rotuloCargo } from "@/lib/permissoes";
import { paginaDaRota, rotaDaTela } from "@/lib/rotas";
import { useAlunoPortal } from "@/hooks/useAlunoPortal";
import { listarTurmas } from "@/services/turmas";

import PainelMais from "./PainelMais";
import Perfil from "./Perfil";
import TelaTurma from "./TelaTurma";
import Home from "./Home";
import PainelAlunos from "./PainelAlunos";
import PainelTurmas from "./PainelTurmas";
import PainelChamada from "./PainelChamada";
import PainelProfessores from "./PainelProfessores";
import PainelLocais from "./PainelLocais";
import PainelPublicacoes from "./PainelPublicacoes";
import BottomNavigation from "./navigation/BottomNavigation";
import AlunoInicio from "./aluno/AlunoInicio";
import AlunoTurmas from "./aluno/AlunoTurmas";
import AlunoFrequencia from "./aluno/AlunoFrequencia";
import AlunoCheckin from "./aluno/AlunoCheckin";
import AlunoPublicacoes from "./aluno/AlunoPublicacoes";

const PAGINAS_ALUNO = new Set([
  "home",
  "turmas",
  "checkin",
  "frequencia",
  "comunicados",
  "mais",
  "perfil",
]);

const PAGINAS_GESTAO = new Set([
  "home",
  "alunos",
  "chamada",
  "turmas",
  "turma",
  "locais",
  "publicacoes",
  "mais",
  "perfil",
]);

const PAGINAS_ADMIN = ["professores"];

export default function Dashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const aluno = ehAluno(usuario);
  const admin = ehAdministrador(usuario);
  const paramsUrl = new URLSearchParams(location.search);
  const tokenCheckin = paramsUrl.get("checkin") || "";
  const publicacaoInicialId = paramsUrl.get("publicacao") || "";
  const tipoPublicacao = paramsUrl.get("tipo") || "noticia";

  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [gestaoCarregada, setGestaoCarregada] = useState(false);

  const rota = paginaDaRota(location.pathname);
  const paginaSolicitada =
    aluno && tokenCheckin
      ? "checkin"
      : aluno && publicacaoInicialId
        ? "comunicados"
        : rota.pagina;

  const portalAluno = useAlunoPortal(usuario?.aluno_id, aluno);

  const paginasPermitidas = useMemo(
    () =>
      aluno
        ? PAGINAS_ALUNO
        : new Set([...PAGINAS_GESTAO, ...(admin ? PAGINAS_ADMIN : [])]),
    [admin, aluno]
  );

  const paginaAtual = paginasPermitidas.has(paginaSolicitada)
    ? paginaSolicitada
    : "home";

  const turmaAtual =
    paginaAtual === "turma"
      ? turmas.find((turma) => turma.id === rota.turmaId) || null
      : null;

  async function recarregarGestao() {
    if (aluno) return;

    const [resultadoAlunos, listaTurmas] = await Promise.all([
      supabase.from("alunos").select("*").order("nome"),
      listarTurmas(),
    ]);

    setAlunos(resultadoAlunos.error ? [] : resultadoAlunos.data || []);
    setTurmas(listaTurmas || []);
    setGestaoCarregada(true);
  }

  useEffect(() => {
    if (aluno) return undefined;

    let ativo = true;

    Promise.all([
      supabase.from("alunos").select("*").order("nome"),
      listarTurmas(),
    ]).then(([resultadoAlunos, listaTurmas]) => {
      if (!ativo) return;
      setAlunos(resultadoAlunos.error ? [] : resultadoAlunos.data || []);
      setTurmas(listaTurmas || []);
      setGestaoCarregada(true);
    });

    return () => {
      ativo = false;
    };
  }, [aluno]);

  function setTela(destino) {
    const rotaDestino = rotaDaTela(destino);
    const busca = new URLSearchParams();

    if (destino.tipoPublicacao) {
      busca.set("tipo", destino.tipoPublicacao);
    }

    navigate(busca.size ? `${rotaDestino}?${busca.toString()}` : rotaDestino);
  }

  function limparParametro(nome) {
    const busca = new URLSearchParams(location.search);
    busca.delete(nome);
    navigate(
      {
        pathname: location.pathname,
        search: busca.toString() ? `?${busca.toString()}` : "",
      },
      { replace: true }
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-[max(20px,env(safe-area-inset-top))]">
        {paginaAtual !== "perfil" && (
          <header className="mb-7 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setTela({ pagina: "perfil" })}
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
            {paginaAtual === "home" && (
              <AlunoInicio portal={portalAluno} setTela={setTela} />
            )}
            {paginaAtual === "turmas" && <AlunoTurmas portal={portalAluno} />}
            {paginaAtual === "checkin" && (
              <AlunoCheckin
                tokenInicial={tokenCheckin}
                onTokenConsumido={() => limparParametro("checkin")}
                onFechar={() => setTela({ pagina: "home" })}
              />
            )}
            {paginaAtual === "frequencia" && (
              <AlunoFrequencia portal={portalAluno} />
            )}
            {paginaAtual === "comunicados" && (
              <AlunoPublicacoes
                publicacaoInicialId={publicacaoInicialId}
                onPublicacaoConsumida={() => limparParametro("publicacao")}
              />
            )}
          </>
        ) : (
          <>
            {paginaAtual === "home" && (
              <Home alunos={alunos} turmas={turmas} setTela={setTela} />
            )}
            {paginaAtual === "alunos" && <PainelAlunos turmas={turmas} />}
            {paginaAtual === "chamada" && (
              <PainelChamada
                turmas={turmas}
                onChamadaRegistrada={recarregarGestao}
              />
            )}
            {paginaAtual === "turmas" && <PainelTurmas setTela={setTela} />}
            {paginaAtual === "turma" && (
              gestaoCarregada ? (
                turmaAtual ? (
                  <TelaTurma turma={turmaAtual} setTela={setTela} />
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-[#121212] p-6 text-sm text-zinc-400">
                    Turma não encontrada.
                  </div>
                )
              ) : (
                <div className="py-16 text-center text-sm text-zinc-500">
                  Carregando turma...
                </div>
              )
            )}
            {paginaAtual === "professores" && admin && (
              <PainelProfessores onAtualizado={recarregarGestao} />
            )}
            {paginaAtual === "locais" && <PainelLocais />}
            {paginaAtual === "publicacoes" && (
              <PainelPublicacoes tipoInicial={tipoPublicacao} />
            )}
          </>
        )}

        {paginaAtual === "mais" && <PainelMais setTela={setTela} />}
        {paginaAtual === "perfil" && <Perfil setTela={setTela} />}
      </main>

      <BottomNavigation
        tela={{ pagina: paginaAtual }}
        setTela={setTela}
        usuario={usuario}
      />
    </div>
  );
}
