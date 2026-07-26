import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import AlunoModal from "./AlunoModal";
import AlunoPerfil from "./AlunoPerfil";
import { useToast } from "@/contexts/ToastContext";
import Faixa from "./Faixa";
import { Search, X } from "lucide-react";

function normalizarFaixa(faixa) {
  const mapa = {
    Branca: "branca",
    Cinza: "cinza",
    Amarela: "amarela",
    Laranja: "laranja",
    Verde: "verde",
    Azul: "azul",
    Roxa: "roxa",
    Marrom: "marrom",
    Preta: "preta",

    "Cinza e Branca": "cinza_branca",
    "Cinza e Preta": "cinza_preta",

    "Amarela e Branca": "amarela_branca",
    "Amarela e Preta": "amarela_preta",

    "Laranja e Branca": "laranja_branca",
    "Laranja e Preta": "laranja_preta",

    "Verde e Branca": "verde_branca",
    "Verde e Preta": "verde_preta",
  };

  return mapa[faixa] || "branca";
}

export default function PainelAlunos({
  turmas,
  setTela,
}) {

  const [alunos, setAlunos] =
    useState([]);

    const [busca, setBusca] = useState("");

    const [turmaSelecionada, setTurmaSelecionada] = useState("Todos");

  const [modal, setModal] =
    useState(false);

  const [perfilModal, setPerfilModal] =
    useState(false);

  const [perfilAluno, setPerfilAluno] =
    useState(null);

  const [editando, setEditando] =
    useState(null);

  const { mostrarToast } = useToast();

  const [form, setForm] =
    useState({
      nome: "",
      cpf: "",
      telefone: "",
      faixa: "Branca",
      graus: 0,
      categoria: "Adulto",
      status: "Ativo",
      turmas: [],
    });

  async function carregarAlunos() {

const { data, error } = await supabase
  .from("alunos")
  .select(`
    *,
    matriculas(*)
  `)
  .order("nome");
  
    if (error) {
      console.error(error);
      return;
    }

console.log(data);
    setAlunos(data);

  }

  useEffect(() => {

    carregarAlunos();

  }, []);

  function abrirNovoAluno() {

    setEditando(null);

    setForm({
      nome: "",
      cpf: "",
      telefone: "",
      faixa: "Branca",
      graus: 0,
      categoria: "Adulto",
      status: "Ativo",
      turmas: [],
    });

    setModal(true);
  }

  function editarAluno(aluno) {

    console.log(aluno);

    setEditando(aluno);

    setForm({
      nome: aluno.nome,
      cpf: aluno.cpf,
      telefone: aluno.telefone,
      faixa: aluno.faixa || "Branca",
      graus: aluno.graus || 0,
      categoria: aluno.categoria || "Adulto",
      status: aluno.status,
      turmas: [],
    });

    setModal(true);
  }

  async function abrirPerfil(aluno) {

    const { data: matriculas, error: erroMatriculas } =
      await supabase
        .from("matriculas")
        .select(`
        turma_id,
        turmas (
          id,
          nome
        )
      `)
        .eq("aluno_id", aluno.id);

    if (erroMatriculas) {
      console.error(erroMatriculas);
      return;
    }

    const { data: presencas, error: erroPresencas } =
      await supabase
        .from("presencas")
        .select("*")
        .eq("aluno_id", aluno.id);

    if (erroPresencas) {
      console.error(erroPresencas);
      return;
    }

    const totalPresencas = presencas.length;
    const metaGraduacao = 60;

    setPerfilAluno({
      aluno,
      turmas: matriculas.map(m => m.turmas),
      totalPresencas,
      metaGraduacao,
      faltam: Math.max(0, metaGraduacao - totalPresencas),
      aptoGraduacao: totalPresencas >= metaGraduacao,
    });

    setPerfilModal(true);

  }

  async function salvarAluno() {

    console.log("EDITANDO:", editando);
    console.log("ID:", editando?.id);
    console.log("FORM:", form);

    let error = null;

    if (editando) {

      const resultado = await supabase
        .from("alunos")
        .update({
          nome: form.nome,
          cpf: form.cpf,
          telefone: form.telefone,
          faixa: form.faixa,
          graus: form.graus,
          categoria: form.categoria,
          status: form.status,
        })
        .eq("id", editando.id)
        .select();

      const alunoId = resultado.data[0].id;

      console.log("Aluno editado:", alunoId);
      console.log("Turmas selecionadas:", form.turmas);

      const { data: antesDelete } = await supabase
        .from("matriculas")
        .select("*")
        .eq("aluno_id", alunoId);

      console.log("ANTES DO DELETE:", antesDelete);

      // Remove todas as matrículas atuais do aluno
      const { error: erroDelete } = await supabase
        .from("matriculas")
        .delete()
        .eq("aluno_id", alunoId);

      console.log("ALUNO ID PARA DELETE:", alunoId);
      console.log("ERRO DELETE:", erroDelete);

      const { data: depoisDelete } = await supabase
        .from("matriculas")
        .select("*")
        .eq("aluno_id", alunoId);

      console.log("DEPOIS DO DELETE:", depoisDelete);

      if (erroDelete) {
        console.error("Erro ao remover matrículas:", erroDelete);
      }

      // Cria novamente as matrículas selecionadas
      if (form.turmas.length > 0) {

        const matriculas = form.turmas.map((turmaId) => ({
          aluno_id: alunoId,
          turma_id: turmaId,
        }));

        console.log("MATRÍCULAS PARA INSERIR:", matriculas);

        const {
          data: dadosMatriculas,
          error: erroMatriculas,
        } = await supabase
          .from("matriculas")
          .insert(matriculas)
          .select();

        console.log("RETORNO MATRÍCULAS:", dadosMatriculas);
        console.log("ERRO MATRÍCULAS:", erroMatriculas);

        if (erroMatriculas) {
          console.error("Erro ao salvar matrículas:", erroMatriculas);
        }
      }

      console.log("RESULTADO UPDATE:", JSON.stringify(resultado, null, 2));

      error = resultado.error;

    } else {

      const resultado = await supabase
        .from("alunos")
        .insert([
          {
            nome: form.nome,
            cpf: form.cpf,
            telefone: form.telefone,
            faixa: form.faixa,
            graus: form.graus,
            categoria: form.categoria,
            status: form.status,
          },
        ])
        .select();

      const alunoId = resultado.data[0].id;

      console.log("Aluno criado:", alunoId);
      console.log("Turmas selecionadas:", form.turmas);

      if (form.turmas.length > 0) {

        const matriculas = form.turmas.map((turmaId) => ({
          aluno_id: alunoId,
          turma_id: turmaId,
        }));

        console.log("MATRÍCULAS:", matriculas);

        const { error: erroMatriculas } = await supabase
          .from("matriculas")
          .insert(matriculas);

        console.log("ERRO MATRÍCULAS:", erroMatriculas);
      }

      error = resultado.error;

    }

    if (error) {
      console.error("ERRO:", error);

      mostrarToast(
        "Não foi possível salvar o aluno.",
        "error"
      );
      
      return;
    }
    await carregarAlunos();

    setModal(false);

mostrarToast(
  editando
    ? "Aluno atualizado com sucesso!"
    : "Aluno cadastrado com sucesso!",
  "success"
);
  }

  const alunosFiltrados = alunos.filter((aluno) =>
  aluno.nome.toLowerCase().includes(busca.toLowerCase())
);
  return (

    <>

<div className="mt-6 px-2">

<div className="flex items-center justify-between mb-5">

  <h2 className="text-2xl font-bold">
  Alunos
  <span className="ml-2 text-lg text-gray-400 font-medium">
    ({alunos.length})
  </span>
</h2>

  <button
    onClick={abrirNovoAluno}
    className="h-10 px-4 bg-red-700 hover:bg-red-600 rounded-xl text-sm font-semibold"
  >
    + Novo
  </button>

</div>

<div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">

<div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">

  <button
    onClick={() => setTurmaSelecionada("Todos")}
    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
      turmaSelecionada === "Todos"
        ? "bg-red-700 text-white"
        : "bg-[#171717] text-gray-300"
    }`}
  >
    Todos
  </button>

  {turmas.map((turma) => (

    <button
      key={turma.id}
      onClick={() => setTurmaSelecionada(turma.id)}
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        turmaSelecionada === turma.id
          ? "bg-red-700 text-white"
          : "bg-[#171717] text-gray-300"
      }`}
    >
      {turma.nome}
    </button>

  ))}

</div>
</div>

<div className="space-y-2">

{alunosFiltrados.length === 0 ? (

  <div className="py-10 text-center text-sm text-gray-500">
    Nenhum aluno encontrado.
  </div>

) : (

  alunosFiltrados.map((aluno) => (

    <button
      key={aluno.id}
      onClick={() => abrirPerfil(aluno)}
      className="w-full text-left bg-[#171717] hover:bg-[#1d1d1d] rounded-2xl px-4 py-3 transition-colors"
    >

      <div className="flex items-center justify-between">

        <div>

          <h3 className="font-semibold text-base">
            {aluno.nome}
          </h3>

          <div className="flex items-center gap-2 mt-1">

            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                aluno.status === "Ativo"
                  ? "bg-green-900/40 text-green-400"
                  : "bg-red-900/40 text-red-400"
              }`}
            >
              {aluno.status}
            </span>

            <Faixa
              faixa={normalizarFaixa(aluno.faixa)}
              graus={aluno.graus}
            />

          </div>

        </div>

        <span className="text-gray-500 text-xl">
          ›
        </span>

      </div>

    </button>

  ))

)}

</div>

<div className="h-24"></div>

      </div>
<div className="fixed bottom-28 left-0 right-0 px-4 z-30">
  <div className="relative max-w-lg mx-auto">

    <Search
      size={18}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
    />

    <input
      type="text"
      placeholder="Buscar aluno..."
      value={busca}
      onChange={(e) => setBusca(e.target.value)}
className="w-full rounded-full bg-[#171717] border border-white/10 ring-1 ring-white/5 pl-11 pr-11 py-3 text-sm text-white placeholder:text-gray-500 shadow-2xl focus:outline-none focus:border-red-600 transition-colors"    />

    {busca && (
      <button
        onClick={() => setBusca("")}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
      >
        <X size={18} />
      </button>
    )}

  </div>
</div>
      <AlunoModal
        modal={modal}
        editando={editando}
        form={form}
        setForm={setForm}
        salvarAluno={salvarAluno}
        setModal={setModal}
        turmas={turmas}
      />

      <AlunoPerfil
        perfilModal={perfilModal}
        perfilAluno={perfilAluno}
        editarAluno={editarAluno}
        setPerfilModal={setPerfilModal}
      />
    </>

  );
}