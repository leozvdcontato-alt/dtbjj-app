import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import AlunoModal from "./AlunoModal";
import AlunoPerfil from "./AlunoPerfil";
import Faixa from "./Faixa";
import EmptyState from "./ui/EmptyState";
import PageHeader from "./ui/PageHeader";
import SearchField from "./ui/SearchField";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { ehAdministrador } from "@/lib/permissoes";
import { FAIXAS, normalizarFaixa, rotuloGraus } from "@/lib/faixas";
import {
  listarAlunos,
  obterPerfilAluno,
  salvarAlunoComMatriculas,
} from "@/services/alunos";

const FORM_INICIAL = {
  nome: "",
  cpf: "",
  telefone: "",
  faixa: "Branca",
  graus: 0,
  categoria: "Adulto",
  status: "Ativo",
  turmas: [],
};

function normalizarTexto(valor = "") {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function nomesTurmas(aluno) {
  return (aluno.matriculas || [])
    .map((matricula) => matricula.turmas?.nome)
    .filter(Boolean);
}

export default function PainelAlunos({ turmas = [] }) {
  const { usuario } = useAuth();
  const admin = ehAdministrador(usuario);

  const [alunos, setAlunos] = useState([]);
  const [busca, setBusca] = useState("");
  const [turmaSelecionada, setTurmaSelecionada] = useState("todos");
  const [faixaSelecionada, setFaixaSelecionada] = useState("todas");
  const [statusSelecionado, setStatusSelecionado] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);

  const [perfilModal, setPerfilModal] = useState(false);
  const [perfilAluno, setPerfilAluno] = useState(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);

  const { mostrarToast } = useToast();

  async function carregarAlunos() {
    setCarregando(true);
    setErro("");

    try {
      const dados = await listarAlunos();
      setAlunos(dados);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      setErro("Não foi possível carregar os alunos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    let ativo = true;

    listarAlunos()
      .then((dados) => {
        if (!ativo) return;
        setAlunos(dados);
        setErro("");
      })
      .catch((error) => {
        if (!ativo) return;
        console.error("Erro ao carregar alunos:", error);
        setErro("Não foi possível carregar os alunos.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  function abrirNovoAluno() {
    if (!admin) return;
    setEditando(null);
    setForm({ ...FORM_INICIAL, turmas: [] });
    setModal(true);
  }

  function editarAluno(aluno) {
    if (!admin) return;

    setEditando(aluno);
    setForm({
      nome: aluno.nome || "",
      cpf: aluno.cpf || "",
      telefone: aluno.telefone || "",
      faixa: aluno.faixa || "Branca",
      graus: Number(aluno.graus || 0),
      categoria: aluno.categoria || "Adulto",
      status: aluno.status || "Ativo",
      turmas: (aluno.matriculas || []).map((matricula) => matricula.turma_id),
    });
    setModal(true);
  }

  async function abrirPerfil(aluno) {
    setPerfilAluno(null);
    setCarregandoPerfil(true);
    setPerfilModal(true);

    try {
      const perfil = await obterPerfilAluno(aluno.id);
      setPerfilAluno(perfil);
    } catch (error) {
      console.error("Erro ao carregar perfil do aluno:", error);
      setPerfilModal(false);
      mostrarToast("Não foi possível abrir o aluno.", "error");
    } finally {
      setCarregandoPerfil(false);
    }
  }

  async function salvarAluno(event) {
    event.preventDefault();
    if (!admin) return;

    if (!form.nome.trim()) {
      mostrarToast("Informe o nome do aluno.", "error");
      return;
    }

    setSalvando(true);

    try {
      await salvarAlunoComMatriculas(editando?.id, form);
      await carregarAlunos();
      setModal(false);

      mostrarToast(
        editando
          ? "Aluno atualizado com sucesso!"
          : "Aluno cadastrado com sucesso!",
        "success"
      );
    } catch (error) {
      console.error("Erro ao salvar aluno:", error);
      mostrarToast("Não foi possível salvar o aluno.", "error");
    } finally {
      setSalvando(false);
    }
  }

  const alunosFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca);

    return alunos.filter((aluno) => {
      const correspondeBusca =
        !termo ||
        normalizarTexto(aluno.nome).includes(termo) ||
        normalizarTexto(aluno.telefone).includes(termo) ||
        normalizarTexto(aluno.cpf).includes(termo);

      const correspondeTurma =
        turmaSelecionada === "todos" ||
        (aluno.matriculas || []).some(
          (matricula) => String(matricula.turma_id) === turmaSelecionada
        );

      const correspondeFaixa =
        faixaSelecionada === "todas" || aluno.faixa === faixaSelecionada;

      const correspondeStatus =
        statusSelecionado === "todos" || aluno.status === statusSelecionado;

      return (
        correspondeBusca &&
        correspondeTurma &&
        correspondeFaixa &&
        correspondeStatus
      );
    });
  }, [
    alunos,
    busca,
    turmaSelecionada,
    faixaSelecionada,
    statusSelecionado,
  ]);

  const possuiFiltros =
    busca ||
    turmaSelecionada !== "todos" ||
    faixaSelecionada !== "todas" ||
    statusSelecionado !== "todos";

  function limparFiltros() {
    setBusca("");
    setTurmaSelecionada("todos");
    setFaixaSelecionada("todas");
    setStatusSelecionado("todos");
  }

  return (
    <>
      <section className="space-y-5">
        <PageHeader
          title="Alunos"
          subtitle={
            alunos.length === 1
              ? "1 aluno disponível"
              : alunos.length + " alunos disponíveis"
          }
          action={
            admin ? (
              <button
                type="button"
                onClick={abrirNovoAluno}
                className="flex h-11 items-center gap-2 rounded-2xl bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Novo aluno</span>
                <span className="sm:hidden">Novo</span>
              </button>
            ) : null
          }
        />

        <SearchField
          value={busca}
          onChange={setBusca}
          placeholder="Buscar por nome, telefone ou CPF"
          label="Buscar aluno"
        />

        <div className="space-y-3">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setTurmaSelecionada("todos")}
              className={
                "min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition " +
                (turmaSelecionada === "todos"
                  ? "border-red-700 bg-red-950/50 text-red-300"
                  : "border-white/10 bg-[#141414] text-zinc-400 hover:text-white")
              }
            >
              Todas as turmas
            </button>

            {turmas.map((turma) => (
              <button
                key={turma.id}
                type="button"
                onClick={() => setTurmaSelecionada(String(turma.id))}
                className={
                  "min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition " +
                  (turmaSelecionada === String(turma.id)
                    ? "border-red-700 bg-red-950/50 text-red-300"
                    : "border-white/10 bg-[#141414] text-zinc-400 hover:text-white")
                }
              >
                {turma.nome}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#141414] text-zinc-500">
              <SlidersHorizontal size={17} />
            </div>

            <select
              value={faixaSelecionada}
              onChange={(event) => setFaixaSelecionada(event.target.value)}
              aria-label="Filtrar por faixa"
              className="min-w-0 rounded-2xl border border-white/10 bg-[#141414] px-3 text-sm text-zinc-300 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-950"
            >
              <option value="todas">Todas as faixas</option>
              {FAIXAS.map((faixa) => (
                <option key={faixa} value={faixa}>
                  {faixa}
                </option>
              ))}
            </select>

            <select
              value={statusSelecionado}
              onChange={(event) => setStatusSelecionado(event.target.value)}
              aria-label="Filtrar por status"
              className="min-w-0 rounded-2xl border border-white/10 bg-[#141414] px-3 text-sm text-zinc-300 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-950"
            >
              <option value="todos">Todos os status</option>
              <option value="Ativo">Ativos</option>
              <option value="Inativo">Inativos</option>
            </select>
          </div>
        </div>

        {!carregando && !erro ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-zinc-600">
              {alunosFiltrados.length === 1
                ? "1 resultado"
                : alunosFiltrados.length + " resultados"}
            </p>

            {possuiFiltros ? (
              <button
                type="button"
                onClick={limparFiltros}
                className="text-xs font-semibold text-red-500 transition hover:text-red-400 focus-visible:outline-none focus-visible:underline"
              >
                Limpar filtros
              </button>
            ) : null}
          </div>
        ) : null}

        {carregando ? (
          <div className="space-y-2" aria-label="Carregando alunos">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[92px] animate-pulse rounded-3xl border border-white/5 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : erro ? (
          <EmptyState
            Icon={RefreshCw}
            title="Não foi possível carregar"
            description="Verifique sua conexão e tente novamente."
            action={
              <button
                type="button"
                onClick={carregarAlunos}
                className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Tentar novamente
              </button>
            }
          />
        ) : alunosFiltrados.length === 0 ? (
          <EmptyState
            Icon={UserRound}
            title={possuiFiltros ? "Nenhum aluno encontrado" : "Nenhum aluno disponível"}
            description={
              possuiFiltros
                ? "Tente ajustar a busca ou os filtros."
                : admin
                  ? "Cadastre ou aguarde o primeiro aluno entrar por uma turma."
                  : "Nenhum aluno das suas turmas está disponível."
            }
            action={
              possuiFiltros ? (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Limpar filtros
                </button>
              ) : admin ? (
                <button
                  type="button"
                  onClick={abrirNovoAluno}
                  className="rounded-2xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  Cadastrar aluno
                </button>
              ) : null
            }
          />
        ) : (
          <div className="space-y-2">
            {alunosFiltrados.map((aluno) => {
              const turmasAluno = nomesTurmas(aluno);

              return (
                <button
                  key={aluno.id}
                  type="button"
                  onClick={() => abrirPerfil(aluno)}
                  className="group w-full rounded-3xl border border-white/10 bg-[#141414] p-4 text-left transition hover:border-white/15 hover:bg-[#171717] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-sm font-bold text-zinc-400">
                      {aluno.nome?.slice(0, 1)?.toUpperCase() || "A"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-white">
                            {aluno.nome}
                          </h3>
                          <p className="mt-0.5 truncate text-xs text-zinc-600">
                            {turmasAluno.length
                              ? turmasAluno.join(" • ")
                              : "Sem turma vinculada"}
                          </p>
                        </div>

                        <ChevronRight
                          size={19}
                          className="mt-1 shrink-0 text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-zinc-400"
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span
                          className={
                            "rounded-full px-2.5 py-1 text-[11px] font-semibold " +
                            (aluno.status === "Ativo"
                              ? "bg-emerald-950/50 text-emerald-400"
                              : "bg-zinc-800 text-zinc-400")
                          }
                        >
                          {aluno.status}
                        </span>

                        <span className="text-xs text-zinc-500">
                          {aluno.categoria || "Sem categoria"}
                        </span>

                        <div className="flex min-w-24 items-center gap-2">
                          <Faixa
                            faixa={normalizarFaixa(aluno.faixa)}
                            graus={Number(aluno.graus || 0)}
                          />
                          <span className="shrink-0 text-[11px] text-zinc-600">
                            {rotuloGraus(aluno.graus)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {admin ? (
        <AlunoModal
          modal={modal}
          editando={editando}
          form={form}
          setForm={setForm}
          salvarAluno={salvarAluno}
          setModal={setModal}
          turmas={turmas}
          salvando={salvando}
        />
      ) : null}

      <AlunoPerfil
        perfilModal={perfilModal}
        perfilAluno={perfilAluno}
        editarAluno={editarAluno}
        podeEditar={admin}
        setPerfilModal={setPerfilModal}
        carregando={carregandoPerfil}
      />
    </>
  );
}
