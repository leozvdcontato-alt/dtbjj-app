import { useEffect, useState } from "react";
import {
  Copy,
  ExternalLink,
  Mail,
  UserPlus,
  UserRound,
} from "lucide-react";
import PageHeader from "./ui/PageHeader";
import EmptyState from "./ui/EmptyState";
import MultiSelect from "./ui/MultiSelect";
import {
  criarProfessor,
  definirTurmasProfessor,
  listarProfessores,
} from "@/services/professores";
import { listarTurmas } from "@/services/turmas";
import { useToast } from "@/contexts/ToastContext";

export default function PainelProfessores() {
  const [professores, setProfessores] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [salvandoTurmas, setSalvandoTurmas] = useState("");
  const [selecoes, setSelecoes] = useState({});
  const [conviteCriado, setConviteCriado] = useState(null);
  const { mostrarToast } = useToast();

  async function carregar() {
    const [listaProfessores, listaTurmas] = await Promise.all([
      listarProfessores(),
      listarTurmas(),
    ]);

    setProfessores(listaProfessores);
    setTurmas(listaTurmas);
    setSelecoes(
      Object.fromEntries(
        listaProfessores.map((professor) => [
          professor.id,
          (professor.turma_professores || []).map((item) => item.turma_id),
        ])
      )
    );
  }

  useEffect(() => {
    let ativo = true;

    Promise.all([listarProfessores(), listarTurmas()])
      .then(([listaProfessores, listaTurmas]) => {
        if (!ativo) return;
        setProfessores(listaProfessores);
        setTurmas(listaTurmas);
        setSelecoes(
          Object.fromEntries(
            listaProfessores.map((professor) => [
              professor.id,
              (professor.turma_professores || []).map((item) => item.turma_id),
            ])
          )
        );
      })
      .catch((error) => console.error("Erro ao carregar professores:", error));

    return () => {
      ativo = false;
    };
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
      const convite = await criarProfessor({
        nome: nome.trim(),
        email: email.trim(),
      });

      setNome("");
      setEmail("");
      setConviteCriado(convite);
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

  async function salvarTurmas(professorId) {
    setSalvandoTurmas(professorId);

    try {
      await definirTurmasProfessor(professorId, selecoes[professorId] || []);
      await carregar();
      mostrarToast("Turmas do professor atualizadas.", "success");
    } catch (error) {
      console.error("Erro ao salvar turmas do professor:", error);
      mostrarToast("Não foi possível atualizar as turmas.", "error");
    } finally {
      setSalvandoTurmas("");
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

  function visualizarEmail() {
    if (!conviteCriado?.email_html) return;

    const blob = new Blob([conviteCriado.email_html], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const janela = window.open(url, "_blank", "noopener,noreferrer");

    if (!janela) {
      mostrarToast("Permita pop-ups para visualizar o e-mail.", "error");
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  return (
    <section className="space-y-5">
      <PageHeader
        title="Professores"
        subtitle="Crie o convite e defina em quais turmas cada professor atua."
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
            <Mail size={20} />
            <h3 className="font-semibold">Convite preparado</h3>
          </div>

          <p className="mt-3 text-sm text-zinc-300">
            {conviteCriado.email}
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            O professor já foi criado, mas o e-mail automático ainda está
            desativado enquanto o modelo passa por aprovação.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={visualizarEmail}
              className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold"
            >
              <ExternalLink size={16} />
              Ver e-mail
            </button>
            <button
              type="button"
              onClick={copiarLink}
              className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold"
            >
              <Copy size={16} />
              Copiar link
            </button>
          </div>
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
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">
                  Turmas do professor
                </label>
                <MultiSelect
                  options={turmas}
                  value={selecoes[professor.id] || []}
                  onChange={(valor) =>
                    setSelecoes((atual) => ({
                      ...atual,
                      [professor.id]: valor,
                    }))
                  }
                  placeholder="Selecione as turmas"
                />
                <button
                  type="button"
                  onClick={() => salvarTurmas(professor.id)}
                  disabled={salvandoTurmas === professor.id}
                  className="mt-3 h-10 w-full rounded-2xl bg-white/10 text-sm font-semibold text-zinc-200 disabled:opacity-50"
                >
                  {salvandoTurmas === professor.id
                    ? "Salvando..."
                    : "Salvar turmas"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
