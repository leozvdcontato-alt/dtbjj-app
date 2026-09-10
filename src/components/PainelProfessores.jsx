import { useEffect, useState } from "react";
import { Copy, KeyRound, MessageCircle, UserPlus, UserRound } from "lucide-react";
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

function mensagemAcessoProfessor(acesso) {
  return [
    "🥋 *DTBJJ – acesso de professor*",
    "",
    `E-mail: ${acesso.email}`,
    `Senha temporária: ${acesso.senha_temporaria}`,
    "",
    "Acesse: https://dtbjj-app.vercel.app",
    "Entre com os dados acima e, depois do primeiro acesso, altere sua senha em Mais > Meu perfil > Senha.",
  ].join("\n");
}

export default function PainelProfessores() {
  const [professores, setProfessores] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [salvandoTurmas, setSalvandoTurmas] = useState("");
  const [selecoes, setSelecoes] = useState({});
  const [acessoCriado, setAcessoCriado] = useState(null);
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
    setAcessoCriado(null);

    try {
      const acesso = await criarProfessor({ nome: nome.trim(), email: email.trim() });
      setNome("");
      setEmail("");
      setAcessoCriado(acesso);
      await carregar();
      mostrarToast("Acesso do professor criado.", "success");
    } catch (error) {
      mostrarToast(error.message || "Não foi possível criar o professor.", "error");
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

  async function copiarAcesso() {
    if (!acessoCriado) return;

    try {
      await navigator.clipboard.writeText(mensagemAcessoProfessor(acessoCriado));
      mostrarToast("Acesso copiado.", "success");
    } catch {
      mostrarToast("Não foi possível copiar o acesso.", "error");
    }
  }

  function compartilharAcesso() {
    if (!acessoCriado) return;
    const texto = encodeURIComponent(mensagemAcessoProfessor(acessoCriado));
    window.open(`https://wa.me/?text=${texto}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="space-y-5">
      <PageHeader
        title="Professores"
        subtitle="Crie o acesso e defina em quais turmas cada professor atua."
      />

      <form
        onSubmit={criarAcesso}
        className="space-y-3 rounded-3xl border border-white/10 bg-[#121212] p-5"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">Nome</label>
          <input
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 outline-none focus:border-red-700"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">E-mail</label>
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
          {enviando ? "Criando acesso..." : "Criar professor"}
        </button>
      </form>

      {acessoCriado ? (
        <section className="rounded-3xl border border-emerald-900/40 bg-emerald-950/20 p-5">
          <div className="flex items-center gap-3 text-emerald-300">
            <KeyRound size={20} />
            <h3 className="font-semibold">Acesso criado</h3>
          </div>
          <p className="mt-3 text-sm text-zinc-300">{acessoCriado.email}</p>
          <div className="mt-2 rounded-2xl bg-black/30 px-4 py-3 font-mono text-sm text-white">
            {acessoCriado.senha_temporaria}
          </div>
          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Essa senha aparece somente agora. Envie ao professor e peça que ele a altere após entrar.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copiarAcesso}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold"
            >
              <Copy size={16} /> Copiar
            </button>
            <button
              type="button"
              onClick={compartilharAcesso}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-700 text-sm font-semibold text-white"
            >
              <MessageCircle size={16} /> WhatsApp
            </button>
          </div>
        </section>
      ) : null}

      {professores.length === 0 ? (
        <EmptyState
          Icon={UserRound}
          title="Nenhum professor cadastrado"
          description="Crie o primeiro acesso de professor acima."
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
                    setSelecoes((atual) => ({ ...atual, [professor.id]: valor }))
                  }
                  placeholder="Selecione as turmas"
                />
                <button
                  type="button"
                  onClick={() => salvarTurmas(professor.id)}
                  disabled={salvandoTurmas === professor.id}
                  className="mt-3 h-10 w-full rounded-2xl bg-white/10 text-sm font-semibold text-zinc-200 disabled:opacity-50"
                >
                  {salvandoTurmas === professor.id ? "Salvando..." : "Salvar turmas"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
