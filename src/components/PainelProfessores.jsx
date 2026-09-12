import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  MessageCircle,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import PageHeader from "./ui/PageHeader";
import EmptyState from "./ui/EmptyState";
import MultiSelect from "./ui/MultiSelect";
import {
  criarProfessor,
  definirHorariosProfessor,
  listarProfessores,
} from "@/services/professores";
import { listarTurmas } from "@/services/turmas";
import { agruparSlots } from "@/lib/horarios";
import { useToast } from "@/contexts/ToastContext";

function montarOpcoes(turmas) {
  return turmas.flatMap((turma) =>
    agruparSlots(turma.turma_horarios || [], { separarProfessor: false }).map(
      (grupo) => ({
        id: `${turma.id}:${grupo.horario}`,
        nome: `${turma.nome} · ${grupo.texto}`,
        horarioIds: grupo.horarioIds,
      })
    )
  );
}

export default function PainelProfessores({ onAtualizado }) {
  const [professores, setProfessores] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState("");
  const [selecoes, setSelecoes] = useState({});
  const [conviteCriado, setConviteCriado] = useState(null);
  const { mostrarToast } = useToast();

  const opcoes = useMemo(() => montarOpcoes(turmas), [turmas]);

  function montarSelecoes(listaProfessores, listaTurmas) {
    const grade = montarOpcoes(listaTurmas);

    return Object.fromEntries(
      listaProfessores.map((professor) => {
        const ids = new Set(
          (professor.turma_horario_professores || []).map(
            (item) => item.horario_id
          )
        );

        return [
          professor.id,
          grade
            .filter((opcao) =>
              opcao.horarioIds.every((horarioId) => ids.has(horarioId))
            )
            .map((opcao) => opcao.id),
        ];
      })
    );
  }

  async function carregar() {
    const [listaProfessores, listaTurmas] = await Promise.all([
      listarProfessores(),
      listarTurmas(),
    ]);

    setProfessores(listaProfessores);
    setTurmas(listaTurmas);
    setSelecoes(montarSelecoes(listaProfessores, listaTurmas));
  }

  useEffect(() => {
    carregar().catch((error) =>
      console.error("Erro ao carregar professores:", error)
    );
  }, []);

  async function criarAcesso(event) {
    event.preventDefault();

    if (!nome.trim() || !email.trim()) {
      mostrarToast("Informe nome e e-mail do professor.", "error");
      return;
    }

    setEnviando(true);
    setConviteCriado(null);

    try {
      const nomeProfessor = nome.trim();
      const convite = await criarProfessor({
        nome: nomeProfessor,
        email: email.trim(),
      });

      setNome("");
      setEmail("");
      setConviteCriado({ ...convite, nome: nomeProfessor });
      await carregar();
      mostrarToast("Convite do professor preparado.", "success");
    } catch (error) {
      mostrarToast(
        error.message || "Não foi possível criar o professor.",
        "error"
      );
    } finally {
      setEnviando(false);
    }
  }

  async function salvarHorarios(professorId) {
    setSalvando(professorId);

    try {
      const selecionadas = new Set(selecoes[professorId] || []);
      const horarioIds = opcoes
        .filter((opcao) => selecionadas.has(opcao.id))
        .flatMap((opcao) => opcao.horarioIds);

      await definirHorariosProfessor(professorId, horarioIds);
      await carregar();
      await onAtualizado?.();
      mostrarToast("Horários do professor atualizados.", "success");
    } catch (error) {
      console.error("Erro ao salvar horários do professor:", error);
      mostrarToast("Não foi possível atualizar os horários.", "error");
    } finally {
      setSalvando("");
    }
  }

  async function copiarLink() {
    if (!conviteCriado?.invite_link) return;

    try {
      await navigator.clipboard.writeText(conviteCriado.invite_link);
      mostrarToast("Link de convite copiado.", "success");
    } catch {
      mostrarToast("Não foi possível copiar o link.", "error");
    }
  }

  function enviarWhatsApp() {
    if (!conviteCriado?.invite_link) return;

    const primeiroNome =
      conviteCriado.nome?.trim()?.split(/\s+/)?.[0] || "Professor";

    const mensagem = [
      `Olá, ${primeiroNome}! Seu acesso como professor ao DTBJJ APP foi criado.`,
      "",
      "Use o link abaixo para criar sua senha:",
      conviteCriado.invite_link,
      "",
      "Depois, você já poderá acessar o app normalmente.",
      "",
      "Para instalar o DTBJJ APP no celular:",
      "https://dtbjj-app.vercel.app/instalar?v=2",
    ].join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(mensagem)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <section className="space-y-5">
      <PageHeader
        title="Professores"
        subtitle="Crie o convite e defina os horários em que cada professor atua."
      />

      <form
        onSubmit={criarAcesso}
        className="space-y-3 rounded-3xl border border-white/10 bg-[#121212] p-5"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Nome
          </label>
          <input
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 outline-none focus:border-red-700"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 outline-none focus:border-red-700"
          />
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-700 font-semibold text-white disabled:opacity-50"
        >
          <UserPlus size={18} />
          {enviando ? "Preparando convite..." : "Criar professor"}
        </button>
      </form>

      {conviteCriado ? (
        <section className="rounded-3xl border border-emerald-900/40 bg-emerald-950/20 p-5">
          <div className="flex items-center gap-3 text-emerald-300">
            <ShieldCheck size={20} />
            <h3 className="font-semibold">Convite seguro pronto</h3>
          </div>

          <p className="mt-3 text-sm text-zinc-300">{conviteCriado.email}</p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Envie o convite para o professor definir a própria senha.
          </p>

          <button
            type="button"
            onClick={enviarWhatsApp}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-sm font-semibold text-white"
          >
            <MessageCircle size={18} />
            Enviar convite no WhatsApp
          </button>

          <button
            type="button"
            onClick={copiarLink}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold"
          >
            <Copy size={16} />
            Copiar link do convite
          </button>
        </section>
      ) : null}

      {professores.length === 0 ? (
        <EmptyState
          Icon={UserRound}
          title="Nenhum professor cadastrado"
          description="Crie o primeiro convite de professor acima."
        />
      ) : (
        <div className="space-y-3">
          {professores.map((professor) => (
            <article
              key={professor.id}
              className="rounded-3xl border border-white/10 bg-[#121212] p-5"
            >
              <p className="font-semibold">{professor.nome}</p>
              <p className="mt-1 text-sm text-zinc-500">{professor.email}</p>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Horários do professor
                </label>
                <MultiSelect
                  options={opcoes}
                  value={selecoes[professor.id] || []}
                  onChange={(valor) =>
                    setSelecoes((atual) => ({
                      ...atual,
                      [professor.id]: valor,
                    }))
                  }
                  placeholder="Selecione os horários"
                />
                <button
                  type="button"
                  onClick={() => salvarHorarios(professor.id)}
                  disabled={salvando === professor.id}
                  className="mt-3 h-11 w-full rounded-2xl bg-white/10 text-sm font-semibold text-zinc-200 disabled:opacity-50"
                >
                  {salvando === professor.id
                    ? "Salvando..."
                    : "Salvar horários"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
