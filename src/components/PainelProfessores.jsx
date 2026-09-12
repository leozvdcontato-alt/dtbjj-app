import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  KeyRound,
  MessageCircle,
  Power,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
} from "lucide-react";
import PageHeader from "./ui/PageHeader";
import EmptyState from "./ui/EmptyState";
import MultiSelect from "./ui/MultiSelect";
import {
  alterarStatusProfessor,
  criarProfessor,
  definirHorariosProfessor,
  excluirProfessor,
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
  const [gerenciando, setGerenciando] = useState("");
  const [selecoes, setSelecoes] = useState({});
  const [acessoCriado, setAcessoCriado] = useState(null);
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
    let ativo = true;

    Promise.all([listarProfessores(), listarTurmas()])
      .then(([listaProfessores, listaTurmas]) => {
        if (!ativo) return;
        setProfessores(listaProfessores);
        setTurmas(listaTurmas);
        setSelecoes(montarSelecoes(listaProfessores, listaTurmas));
      })
      .catch((error) =>
        console.error("Erro ao carregar professores:", error)
      );

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
      const nomeProfessor = nome.trim();
      const acesso = await criarProfessor({
        nome: nomeProfessor,
        email: email.trim(),
      });

      setNome("");
      setEmail("");
      setAcessoCriado({ ...acesso, nome: nomeProfessor });
      await carregar();
      mostrarToast("Professor criado com senha temporária.", "success");
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

  function textoAcesso() {
    if (!acessoCriado?.senha_temporaria) return "";

    return [
      `E-mail: ${acessoCriado.email}`,
      `Senha temporária: ${acessoCriado.senha_temporaria}`,
    ].join("\n");
  }

  async function copiarAcesso() {
    try {
      await navigator.clipboard.writeText(textoAcesso());
      mostrarToast("Acesso copiado.", "success");
    } catch {
      mostrarToast("Não foi possível copiar o acesso.", "error");
    }
  }

  function urlWhatsApp() {
    if (!acessoCriado?.senha_temporaria) return "#";
    if (!acessoCriado?.senha_temporaria) return;

    const primeiroNome =
      acessoCriado.nome?.trim()?.split(/\s+/)?.[0] || "Professor";

    const mensagem = [
      `Olá, ${primeiroNome}! Seu acesso como professor ao DTBJJ APP foi criado.`,
      "",
      `E-mail: ${acessoCriado.email}`,
      `Senha temporária: ${acessoCriado.senha_temporaria}`,
      "",
      "Entre com esses dados. No primeiro acesso, o app vai pedir para você criar sua senha pessoal.",
      "",
      "Acessar o DTBJJ APP:",
      "https://dtbjj-app.vercel.app",
      "",
      "Para instalar no celular:",
      "https://dtbjj-app.vercel.app/instalar?v=2",
    ].join("\n");

    return `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  }

  async function alternarStatus(professor) {
    const novoStatus = professor.status === "Ativo" ? "Inativo" : "Ativo";
    setGerenciando(professor.id);

    try {
      await alterarStatusProfessor(professor.id, novoStatus);
      await carregar();
      await onAtualizado?.();
      mostrarToast(
        novoStatus === "Ativo"
          ? "Professor ativado."
          : "Professor inativado.",
        "success"
      );
    } catch (error) {
      mostrarToast(error.message || "Não foi possível alterar o status.", "error");
    } finally {
      setGerenciando("");
    }
  }

  async function removerProfessor(professor) {
    const confirmou = window.confirm(
      `Excluir definitivamente o professor ${professor.nome}? Essa ação remove o acesso e não pode ser desfeita.`
    );

    if (!confirmou) return;

    setGerenciando(professor.id);

    try {
      await excluirProfessor(professor.id);
      await carregar();
      await onAtualizado?.();
      mostrarToast("Professor excluído.", "success");
    } catch (error) {
      mostrarToast(error.message || "Não foi possível excluir o professor.", "error");
    } finally {
      setGerenciando("");
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        title="Professores"
        subtitle="Cadastre o professor e defina os horários em que ele atua."
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
          {enviando ? "Criando acesso..." : "Criar professor"}
        </button>
      </form>

      {acessoCriado ? (
        <section className="rounded-3xl border border-emerald-900/40 bg-emerald-950/20 p-5">
          <div className="flex items-center gap-3 text-emerald-300">
            <ShieldCheck size={20} />
            <h3 className="font-semibold">Acesso criado</h3>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
              E-mail
            </p>
            <p className="mt-1 break-all text-sm text-zinc-200">{acessoCriado.email}</p>

            <p className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
              <KeyRound size={14} />
              Senha temporária
            </p>
            <p className="mt-1 font-mono text-base font-semibold text-white">
              {acessoCriado.senha_temporaria}
            </p>
          </div>

          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Essa senha é exibida somente agora. No primeiro login, o professor será obrigado a criar uma senha pessoal.
          </p>

          <a
            href={urlWhatsApp()}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-sm font-semibold text-white"
          >
            <MessageCircle size={18} />
            Enviar acesso no WhatsApp
          </a>

          <button
            type="button"
            onClick={copiarAcesso}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold"
          >
            <Copy size={16} />
            Copiar acesso
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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{professor.nome}</p>
                  <p className="mt-1 break-all text-sm text-zinc-500">{professor.email}</p>
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold " +
                    (professor.status === "Ativo"
                      ? "bg-emerald-950/60 text-emerald-400"
                      : "bg-zinc-800 text-zinc-400")
                  }
                >
                  {professor.status}
                </span>
              </div>

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

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => alternarStatus(professor)}
                  disabled={gerenciando === professor.id}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-zinc-300 disabled:opacity-50"
                >
                  <Power size={16} />
                  {professor.status === "Ativo" ? "Inativar" : "Ativar"}
                </button>
                <button
                  type="button"
                  onClick={() => removerProfessor(professor)}
                  disabled={gerenciando === professor.id}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-900/40 bg-red-950/20 px-3 text-sm font-semibold text-red-300 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
