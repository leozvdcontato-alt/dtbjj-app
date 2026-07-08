import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxY8ksEC6xEX_jvLecF1gmc6xPIAqb5LK686RginNGMzMM6xAi_gJfzkyCniHWzvdGJiw/exec";

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

  const [form, setForm] =
    useState({
      nome: "",
      cpf: "",
      telefone: "",
      faixa: "Branca",
      graus: 0,
      categoria: "Adulto",
      status: "Ativo",
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

    alert("salvarAluno foi chamada");

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
      return;
    }

    await carregarAlunos();

    setModal(false);

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

      {modal && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">

          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 w-full max-w-2xl">

            <h2 className="text-2xl font-bold mb-6">

              {editando
                ? "Editar Aluno"
                : "Novo Aluno"}

            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Nome
                </label>

                <input
                  value={form.nome}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nome: e.target.value,
                    })
                  }
                  className="w-full h-14 rounded-2xl bg-[#1A1A1A] px-4"
                />
              </div>

              <input
                placeholder="CPF"
                value={form.cpf}
                onChange={(e) =>
                  setForm({
                    ...form,
                    cpf: e.target.value,
                  })
                }
                className="h-14 rounded-2xl bg-[#1A1A1A] px-4"
              />

              <input
                placeholder="Telefone"
                value={form.telefone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    telefone: e.target.value,
                  })
                }
                className="h-14 rounded-2xl bg-[#1A1A1A] px-4"
              />

              <select
                value={form.faixa}
                onChange={(e) =>
                  setForm({
                    ...form,
                    faixa: e.target.value,
                  })
                }
                className="h-14 rounded-2xl bg-[#1A1A1A] px-4"
              >

                <option value="Branca">Branca</option>

                <option value="Cinza e Branca">Cinza e Branca</option>
                <option value="Cinza">Cinza</option>
                <option value="Cinza e Preta">Cinza e Preta</option>

                <option value="Amarela e Branca">Amarela e Branca</option>
                <option value="Amarela">Amarela</option>
                <option value="Amarela e Preta">Amarela e Preta</option>

                <option value="Laranja e Branca">Laranja e Branca</option>
                <option value="Laranja">Laranja</option>
                <option value="Laranja e Preta">Laranja e Preta</option>

                <option value="Verde e Branca">Verde e Branca</option>
                <option value="Verde">Verde</option>
                <option value="Verde e Preta">Verde e Preta</option>

                <option value="Azul">Azul</option>
                <option value="Roxa">Roxa</option>
                <option value="Marrom">Marrom</option>
                <option value="Preta">Preta</option>

              </select>

              <select
                value={form.graus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    graus: Number(e.target.value),
                  })
                }
                className="h-14 rounded-2xl bg-[#1A1A1A] px-4"
              >

                <option value="0">0 Grau</option>
                <option value="1">1 Grau</option>
                <option value="2">2 Graus</option>
                <option value="3">3 Graus</option>
                <option value="4">4 Graus</option>

              </select>

              <select
                value={form.categoria}
                onChange={(e) =>
                  setForm({
                    ...form,
                    categoria: e.target.value,
                  })
                }
                className="h-14 rounded-2xl bg-[#1A1A1A] px-4"
              >

                <option value="Kids">
                  Kids
                </option>

                <option value="Juvenil">
                  Juvenil
                </option>

                <option value="Adulto">
                  Adulto
                </option>

              </select>

              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value,
                  })
                }
                className="h-14 rounded-2xl bg-[#1A1A1A] px-4"
              >

                <option value="Ativo">
                  Ativo
                </option>

                <option value="Inativo">
                  Inativo
                </option>

              </select>

            </div>

            <div className="flex justify-end gap-4 mt-6">

              <button
                onClick={() =>
                  setModal(false)
                }
                className="bg-white/10 hover:bg-white/20 px-6 py-4 rounded-2xl font-semibold"
              >
                Cancelar
              </button>

              <button
                onClick={salvarAluno}
                className="bg-red-700 hover:bg-red-600 px-6 py-4 rounded-2xl font-semibold"
              >
                Salvar
              </button>

            </div>

          </div>

        </div>

      )}
      {perfilModal && perfilAluno && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">

          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 w-full max-w-4xl">
            <h2 className="text-3xl font-bold mb-6">
              {perfilAluno.aluno.nome}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">

              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <p className="text-gray-400">
                  Faixa
                </p>

                <div>

                  {perfilAluno.aluno.faixa === "Branca" && (
                    <span className="px-4 py-2 rounded-xl bg-white text-black font-bold">
                      BRANCA
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Cinza" && (
                    <span className="px-4 py-2 rounded-xl bg-gray-500 text-white font-bold">
                      CINZA
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Amarela" && (
                    <span className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold">
                      AMARELA
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Laranja" && (
                    <span className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold">
                      LARANJA
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Verde" && (
                    <span className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold">
                      VERDE
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Azul" && (
                    <span className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold">
                      AZUL
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Roxa" && (
                    <span className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold">
                      ROXA
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Marrom" && (
                    <span className="px-4 py-2 rounded-xl bg-amber-800 text-white font-bold">
                      MARROM
                    </span>
                  )}

                  {perfilAluno.aluno.faixa === "Preta" && (
                    <span className="px-4 py-2 rounded-xl bg-black border border-white/20 text-white font-bold">
                      PRETA
                    </span>
                  )}

                </div></div>

              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <p className="text-gray-400">
                  Graus
                </p>

                <p className="text-3xl mt-2">
                  {Number(perfilAluno.aluno.graus || 0) === 0
                    ? "Nenhum"
                    : "⬜".repeat(
                      Number(perfilAluno.aluno.graus || 0)
                    )}
                </p>
              </div>

              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <p className="text-gray-400">
                  Status
                </p>

                <p className="text-xl font-bold">
                  {perfilAluno.aluno.status === "Ativo"
                    ? "🟢 Ativo"
                    : "🔴 Inativo"}
                </p>
              </div>

              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <p className="text-gray-400">
                  Presenças
                </p>
                <p className="text-xl font-bold">
                  {perfilAluno.totalPresencas}
                </p>
              </div>

              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <p className="text-gray-400">
                  Meta
                </p>
                <p className="text-xl font-bold">
                  {perfilAluno.metaGraduacao}
                </p>
              </div>

              <div className="bg-[#1A1A1A] p-4 rounded-2xl">
                <p className="text-gray-400">
                  Faltam
                </p>

                <p className="text-xl font-bold">
                  {perfilAluno.faltam}
                </p>

                <p
                  className={
                    perfilAluno.aptoGraduacao
                      ? "text-green-400 text-sm mt-2"
                      : "text-red-400 text-sm mt-2"
                  }
                >
                  {perfilAluno.aptoGraduacao
                    ? "🟢 Apto"
                    : "🔴 Não apto"}
                </p>
              </div>

            </div>

            <div className="mb-6">

              <h3 className="text-xl font-bold mb-3">
                Turmas
              </h3>

              {perfilAluno.turmas.map((turma) => (

                <div
                  key={turma.id}
                  className="bg-[#1A1A1A] p-3 rounded-xl mb-2"
                >
                  {turma.nome}
                </div>

              ))}

            </div>

            <div className="flex gap-3 mt-6">

              <button
                onClick={() => {
                  setPerfilModal(false);
                  editarAluno(perfilAluno.aluno);
                }}
                className="bg-blue-700 hover:bg-blue-600 px-6 py-3 rounded-2xl"
              >
                Editar
              </button>

              <button
                onClick={() =>
                  setPerfilModal(false)
                }
                className="bg-red-700 hover:bg-red-600 px-6 py-3 rounded-2xl"
              >
                Fechar
              </button>

            </div>
          </div>

        </div>

      )}
    
      </>

  );
}