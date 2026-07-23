import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import AlunoModal from "./AlunoModal";
import AlunoPerfil from "./AlunoPerfil";
import { useToast } from "@/contexts/ToastContext";

export default function PainelAlunos({
  turmas,
  setTela,
}) {

  const [alunos, setAlunos] =
    useState([]);

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
      .select("*")
      .order("nome");

    if (error) {
      console.error(error);
      return;
    }

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

      console.log("RESULTADO INSERT:", resultado);

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
  return (

    <>

      <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 mt-6">

        <div className="flex items-center justify-between mb-5">

          <button
            onClick={() => setTela("home")}
            className="text-gray-400 hover:text-white text-sm"
          >
            ← Voltar
          </button>

          <h2 className="text-xl font-bold">
            Alunos
          </h2>

          <button
            onClick={abrirNovoAluno}
            className="h-10 px-4 bg-red-700 hover:bg-red-600 rounded-xl text-sm font-semibold"
          >
            + Novo
          </button>

        </div>

        <div className="overflow-auto">

          <table className="w-full min-w-[900px]">

            <thead>

              <tr className="border-b border-white/10 text-gray-400 text-left">

                <th className="pb-4">
                  Nome
                </th>

                <th className="pb-4">
                  CPF
                </th>

                <th className="pb-4">
                  Telefone
                </th>

                <th className="pb-4">
                  Faixa
                </th>

                <th className="pb-4">
                  Graus
                </th>

                <th className="pb-4">
                  Status
                </th>

                <th className="pb-4">
                  Ações
                </th>

              </tr>

            </thead>

            <tbody>

              {alunos.map((aluno, index) => (

                <tr
                  key={index}
                  className="border-b border-white/5"
                >

                  <td className="py-4">
                    {aluno.nome}
                  </td>

                  <td className="py-4">
                    {aluno.cpf}
                  </td>

                  <td className="py-4">
                    {aluno.telefone}
                  </td>

                  <td className="py-4">

                    {aluno.faixa === "Branca" && (
                      <span className="px-3 py-1 rounded-lg bg-white text-black text-sm font-bold">
                        BRANCA
                      </span>
                    )}

                    {aluno.faixa === "Cinza" && (
                      <span className="px-3 py-1 rounded-lg bg-gray-500 text-white text-sm font-bold">
                        CINZA
                      </span>
                    )}

                    {aluno.faixa === "Amarela" && (
                      <span className="px-3 py-1 rounded-lg bg-yellow-400 text-black text-sm font-bold">
                        AMARELA
                      </span>
                    )}

                    {aluno.faixa === "Laranja" && (
                      <span className="px-3 py-1 rounded-lg bg-orange-500 text-white text-sm font-bold">
                        LARANJA
                      </span>
                    )}

                    {aluno.faixa === "Verde" && (
                      <span className="px-3 py-1 rounded-lg bg-green-600 text-white text-sm font-bold">
                        VERDE
                      </span>
                    )}

                    {aluno.faixa === "Azul" && (
                      <span className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm font-bold">
                        AZUL
                      </span>
                    )}

                    {aluno.faixa === "Roxa" && (
                      <span className="px-3 py-1 rounded-lg bg-purple-600 text-white text-sm font-bold">
                        ROXA
                      </span>
                    )}

                    {aluno.faixa === "Marrom" && (
                      <span className="px-3 py-1 rounded-lg bg-amber-800 text-white text-sm font-bold">
                        MARROM
                      </span>
                    )}

                    {aluno.faixa === "Preta" && (
                      <span className="px-3 py-1 rounded-lg bg-black border border-white/20 text-white text-sm font-bold">
                        PRETA
                      </span>
                    )}

                  </td>

                  <td className="py-4">
                    {aluno.graus}
                  </td>

                  <td className="py-4">

                    <span
                      className={
                        aluno.status === "Ativo"
                          ? "bg-green-900/40 text-green-400 px-3 py-1 rounded-full text-sm"
                          : "bg-red-900/40 text-red-400 px-3 py-1 rounded-full text-sm"
                      }
                    >
                      {aluno.status}
                    </span>

                  </td>

                  <td className="py-4">

                    <button
                      onClick={() =>
                        abrirPerfil(aluno)
                      }
                      className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm"
                    >
                      Perfil
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

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