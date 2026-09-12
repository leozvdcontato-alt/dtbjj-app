const ROTAS = {
  home: "/inicio",
  alunos: "/alunos",
  chamada: "/chamada",
  turmas: "/turmas",
  professores: "/professores",
  locais: "/locais",
  publicacoes: "/publicacoes",
  comunicados: "/comunicados",
  checkin: "/checkin",
  frequencia: "/frequencia",
  mais: "/mais",
  perfil: "/perfil",
};

export function paginaDaRota(pathname = "/") {
  const caminho = pathname.replace(/\/+$/, "") || "/";

  const turma = caminho.match(/^\/turmas\/(\d+)$/);
  if (turma) {
    return { pagina: "turma", turmaId: Number(turma[1]) };
  }

  if (caminho === "/") return { pagina: "home", turmaId: null };

  const encontrada = Object.entries(ROTAS).find(([, rota]) => rota === caminho);
  return encontrada
    ? { pagina: encontrada[0], turmaId: null }
    : { pagina: "home", turmaId: null };
}

export function rotaDaTela(destino = {}) {
  if (destino.pagina === "turma" && destino.turma?.id) {
    return `/turmas/${destino.turma.id}`;
  }

  return ROTAS[destino.pagina] || ROTAS.home;
}

export { ROTAS };
