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
    let cancelado = false;

    if (!ativo || !alunoId) {
      Promise.resolve().then(() => {
        if (cancelado) return;
        setDados(ESTADO_INICIAL);
        setLoading(false);
        setErro("");
      });

      return () => {
        cancelado = true;
      };
    }

    Promise.resolve().then(() => {
      if (cancelado) return;
      setLoading(true);
      setErro("");
    });

    carregarPortalAluno(alunoId)
      .then((resultado) => {
        if (!cancelado) setDados(resultado);
      })
      .catch((error) => {
        if (cancelado) return;
        console.error("Erro ao carregar portal do aluno:", error);
        setErro("Não foi possível carregar seus dados agora.");
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [alunoId, ativo]);

  return {
    ...dados,
    loading,
    erro,
    recarregar,
  };
}
