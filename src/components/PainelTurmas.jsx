import { useEffect, useState } from "react";
import { ChevronRight, Copy, MapPin } from "lucide-react";
import { listarTurmas } from "@/services/turmas";
import { useAuth } from "@/contexts/AuthContext";
import { ehAdministrador } from "@/lib/permissoes";
import { useToast } from "@/contexts/ToastContext";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function resumoHorarios(horarios = []) {
  if (!horarios.length) return "";

  return horarios
    .map(
      (item) =>
        DIAS[item.dia_semana] + " " + String(item.horario_inicio).slice(0, 5)
    )
    .join(" • ");
}

export default function PainelTurmas({ setTela }) {
  const [turmas, setTurmas] = useState([]);
  const { usuario } = useAuth();
  const admin = ehAdministrador(usuario);
  const { mostrarToast } = useToast();

  useEffect(() => {
    let ativo = true;

    listarTurmas()
      .then((dados) => {
        if (ativo) setTurmas(dados);
      })
      .catch((error) => console.error("Erro ao carregar turmas:", error));

    return () => {
      ativo = false;
    };
  }, []);

  async function copiarCodigo(codigo) {
    try {
      await navigator.clipboard.writeText(codigo);
      mostrarToast("Código da turma copiado.", "success");
    } catch {
      mostrarToast("Não foi possível copiar o código.", "error");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
          Academia
        </p>
        <h2 className="mt-1 text-2xl font-bold">Turmas</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Códigos de convite são exclusivos para cadastro de alunos.
        </p>
      </div>

      <div className="space-y-3">
        {turmas.map((turma) => (
          <article
            key={turma.id}
            className="rounded-3xl border border-white/10 bg-[#121212] p-5"
          >
            <button
              type="button"
              onClick={() => setTela({ pagina: "turma", turma })}
              className="flex w-full items-start justify-between gap-4 text-left"
            >
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold">{turma.nome}</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {resumoHorarios(turma.turma_horarios) ||
                    [turma.dias, turma.horario].filter(Boolean).join(" • ") ||
                    "Horário ainda não estruturado"}
                </p>
                {turma.locais?.nome ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600">
                    <MapPin size={14} />
                    {turma.locais.nome}
                  </p>
                ) : null}
              </div>

              <ChevronRight
                size={20}
                className="mt-1 shrink-0 text-white/30"
              />
            </button>

            {admin && turma.codigo_convite ? (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-black/30 px-4 py-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-600">
                    Código do aluno
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-zinc-300">
                    {turma.codigo_convite}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copiarCodigo(turma.codigo_convite)}
                  aria-label="Copiar código da turma"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-400"
                >
                  <Copy size={16} />
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
