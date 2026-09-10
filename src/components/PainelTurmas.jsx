import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ChevronRight } from "lucide-react";

export default function PainelTurmas({ setTela }) {
  const [turmas, setTurmas] = useState([]);

  useEffect(() => {
    let ativo = true;

    supabase
      .from("turmas")
      .select("*")
      .order("nome")
      .then(({ data, error }) => {
        if (!ativo) return;

        if (error) {
          console.error("Erro ao carregar turmas:", error);
          return;
        }

        setTurmas(data || []);
      });

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-[#111111] p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Minhas Turmas</h2>
      </div>

      <div className="space-y-1">
        {turmas.map((turma) => (
          <button
            key={turma.id}
            type="button"
            onClick={() =>
              setTela({
                pagina: "turma",
                turma,
              })
            }
            className="w-full py-5 text-left transition-colors hover:bg-white/5"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-xl font-bold">{turma.nome}</h3>

                {turma.dias || turma.horario ? (
                  <p className="mt-0.5 text-sm text-gray-400">
                    {[turma.dias, turma.horario].filter(Boolean).join(" • ")}
                  </p>
                ) : null}
              </div>

              <ChevronRight size={20} className="shrink-0 text-white/30" />
            </div>

            <hr className="mt-4 border-white/10" />
          </button>
        ))}
      </div>
    </div>
  );
}
