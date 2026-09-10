import { useEffect, useState } from "react";
import { ChevronRight, Copy, MapPin, MessageCircle } from "lucide-react";
import { listarTurmas } from "@/services/turmas";
import { useToast } from "@/contexts/ToastContext";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const APP_URL = "https://dtbjj-app.vercel.app";

function resumoHorarios(horarios = []) {
  if (!horarios.length) return "";

  return horarios
    .map(
      (item) =>
        DIAS[item.dia_semana] + " " + String(item.horario_inicio).slice(0, 5)
    )
    .join(" • ");
}

function mensagemConvite(turma) {
  return [
    `🥋 *DTBJJ – ${turma.nome}*`,
    "",
    "Para criar sua conta de aluno:",
    `1. Acesse ${APP_URL}`,
    "2. Toque em *Criar conta*",
    "3. Preencha seus dados",
    "4. No campo *Código da turma*, use:",
    `*${turma.codigo_convite}*`,
    "5. Finalize o cadastro e entre no app.",
    "",
    "Esse código é exclusivo para alunos desta turma.",
  ].join("\n");
}

export default function PainelTurmas({ setTela }) {
  const [turmas, setTurmas] = useState([]);
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

  function compartilharWhatsApp(turma) {
    const texto = encodeURIComponent(mensagemConvite(turma));
    window.open(`https://wa.me/?text=${texto}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
          Academia
        </p>
        <h2 className="mt-1 text-2xl font-bold">Turmas</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Compartilhe o código somente com novos alunos da turma.
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

              <ChevronRight size={20} className="mt-1 shrink-0 text-white/30" />
            </button>

            {turma.codigo_convite ? (
              <div className="mt-4 rounded-2xl bg-black/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-600">
                      Código para novos alunos
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

                <button
                  type="button"
                  onClick={() => compartilharWhatsApp(turma)}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  <MessageCircle size={17} />
                  Compartilhar cadastro no WhatsApp
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
