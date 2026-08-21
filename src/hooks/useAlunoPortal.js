import { useCallback, useEffect, useState } from "react";
import { carregarPortalAluno } from "@/services/alunoPortal";

const ESTADO_INICIAL = {
  aluno: null,
  turmas: [],
  presencas: [],
};

export function useAlunoPortal(alunoId, ativo = true) {
  const [dados, setDados] = useState(ESTADO_INICIAL);
  const [loading, setLoading] = useState(Boolean(ativo && alunoId));
  const [erro, setErro] = useState("");

  const recarregar = useCallback(async () => {
    if (!ativo || !alunoId) {
      setDados(ESTADO_INICIAL);
      setLoading(false);
      setErro("");
      return;
    }

    try {
      setLoading(true);
      setErro("");
      const resultado = await carregarPortalAluno(alunoId);
      setDados(resultado);
    } catch (error) {
      console.error("Erro ao carregar portal do aluno:", error);
      setErro("Não foi possível carregar seus dados agora.");
    } finally {
      setLoading(false);
    }
  }, [alunoId, ativo]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return {
    ...dados,
    loading,
    erro,
    recarregar,
  };
}
