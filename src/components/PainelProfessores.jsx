import { useEffect, useState } from "react";
import { MailPlus, UserRound } from "lucide-react";
import PageHeader from "./ui/PageHeader";
import EmptyState from "./ui/EmptyState";
import { convidarProfessor, listarProfessores } from "@/services/professores";
import { useToast } from "@/contexts/ToastContext";

export default function PainelProfessores() {
  const [professores, setProfessores] = useState([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { mostrarToast } = useToast();

  async function carregar() {
    setProfessores(await listarProfessores());
  }

  useEffect(() => {
    let ativo = true;

    listarProfessores()
      .then((dados) => {
        if (ativo) setProfessores(dados);
      })
      .catch((error) => console.error("Erro ao carregar professores:", error));

    return () => {
      ativo = false;
    };
  }, []);

  async function enviarConvite(event) {
    event.preventDefault();

    if (!nome.trim() || !email.trim()) {
      mostrarToast("Informe nome e e-mail do professor.", "error");
      return;
    }

    setEnviando(true);

    try {
      await convidarProfessor({ nome: nome.trim(), email: email.trim() });
      setNome("");
      setEmail("");
      await carregar();
      mostrarToast("Convite enviado ao professor.", "success");
    } catch (error) {
      mostrarToast(error.message || "Não foi possível enviar o convite.", "error");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        title="Professores"
        subtitle="Apenas administradores podem criar acessos de professor."
      />

      <form
        onSubmit={enviarConvite}
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
          <MailPlus size={18} />
          {enviando ? "Enviando..." : "Convidar professor"}
        </button>
      </form>

      {professores.length === 0 ? (
        <EmptyState
          Icon={UserRound}
          title="Nenhum professor cadastrado"
          description="Os professores convidados aparecerão aqui."
        />
      ) : (
        <div className="space-y-2">
          {professores.map((professor) => (
            <article
              key={professor.id}
              className="rounded-2xl border border-white/10 bg-[#121212] p-4"
            >
              <p className="font-semibold">{professor.nome}</p>
              <p className="mt-1 text-sm text-zinc-500">{professor.email}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
