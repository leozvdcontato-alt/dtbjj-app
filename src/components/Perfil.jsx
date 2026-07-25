import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Pencil,
  Lock,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { uploadAvatar } from "@/services/avatarService";
import { atualizarPerfil } from "@/services/usuarioService";
import { supabase } from "@/lib/supabase";

export default function Perfil() {
  const { usuario, atualizarUsuario } = useAuth();
  const { mostrarToast } = useToast();

  const inputFile = useRef(null);

  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [mostrarAlterarSenha, setMostrarAlterarSenha] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    cpf: "",
  });

  const [senha, setSenha] = useState({
    nova: "",
    confirmar: "",
  });

  useEffect(() => {
    if (!usuario) return;

    setForm({
      nome: usuario.nome || "",
      telefone: usuario.telefone || "",
      cpf: usuario.cpf || "",
    });
  }, [usuario]);

  async function selecionarFoto(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setEnviandoFoto(true);

      await uploadAvatar(file, usuario);

      await atualizarUsuario();

      mostrarToast("Foto atualizada com sucesso!", "success");
    } catch (error) {
      console.error(error);
      mostrarToast("Erro ao enviar a foto.", "error");
    } finally {
      setEnviandoFoto(false);
      e.target.value = "";
    }
  }

  function formatarTelefone(valor) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 2) return numeros;

    if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(
      2,
      7
    )}-${numeros.slice(7)}`;
  }

  function formatarCPF(valor) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 3) return numeros;

    if (numeros.length <= 6) {
      return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
    }

    if (numeros.length <= 9) {
      return `${numeros.slice(0, 3)}.${numeros.slice(
        3,
        6
      )}.${numeros.slice(6)}`;
    }

    return `${numeros.slice(0, 3)}.${numeros.slice(
      3,
      6
    )}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
  }

  async function salvarPerfil() {
    if (!form.nome.trim()) {
      mostrarToast("Informe seu nome.", "error");
      return;
    }

    const telefoneNumeros = form.telefone.replace(/\D/g, "");

    if (
      telefoneNumeros.length !== 10 &&
      telefoneNumeros.length !== 11
    ) {
      mostrarToast("Informe um telefone válido.", "error");
      return;
    }

    const cpfNumeros = form.cpf.replace(/\D/g, "");

    if (cpfNumeros.length !== 11) {
      mostrarToast("Informe um CPF válido.", "error");
      return;
    }

    try {
      await atualizarPerfil(usuario.id, form);

      await atualizarUsuario();

      setEditando(false);

      mostrarToast(
        "Perfil atualizado com sucesso!",
        "success"
      );
    } catch (error) {
      console.error(error);

      mostrarToast(
        "Erro ao atualizar o perfil.",
        "error"
      );
    }
  }

  async function alterarSenha() {
    if (senha.nova.length < 6) {
      mostrarToast(
        "A senha deve ter pelo menos 6 caracteres.",
        "error"
      );
      return;
    }

    if (senha.nova !== senha.confirmar) {
      mostrarToast(
        "As senhas não coincidem.",
        "error"
      );
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: senha.nova,
    });

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    mostrarToast(
      "Senha alterada com sucesso!",
      "success"
    );

    setSenha({
      nova: "",
      confirmar: "",
    });

    setMostrarAlterarSenha(false);
  }
  return (
    <div className="pb-6">
      <div className="bg-zinc-900 rounded-3xl p-7">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              Meu Perfil
            </h1>

            <p className="text-zinc-500 text-sm">
              Gerencie suas informações pessoais
            </p>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-5xl">
            {usuario?.foto ? (
              <img
                src={usuario.foto}
                alt={usuario.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              "👤"
            )}
          </div>

          <input
            ref={inputFile}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={selecionarFoto}
          />

          <button
            onClick={() => inputFile.current?.click()}
            disabled={enviandoFoto}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 text-sm mt-3 transition disabled:opacity-50"
          >
            <Camera size={15} />

            {enviandoFoto
              ? "Enviando..."
              : "Alterar foto"}
          </button>

          {editando ? (
            <input
              type="text"
              value={form.nome}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  nome: e.target.value,
                }))
              }
              className="mt-4 w-full max-w-sm rounded-xl bg-zinc-800 px-4 py-2 text-center text-xl font-bold outline-none border border-zinc-700 focus:border-red-500"
            />
          ) : (
            <h2 className="text-3xl font-bold text-center mt-4 leading-tight">
              {usuario?.nome}
            </h2>
          )}

          <p className="text-zinc-500 text-sm">
            {usuario?.cargo}
          </p>
        </div>

        {/* Informações */}
        <div className="grid grid-cols-2 gapx-4 py-3 mt-10">
          <div className="bg-zinc-900/60
border border-zinc-800
rounded-xl
px-4 py-3">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
              CPF
            </p>

            {editando ? (
              <input
                type="text"
                value={form.cpf}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    cpf: formatarCPF(e.target.value),
                  }))
                }
                className="mt-1 w-full rounded-lg bg-zinc-700 px-3 py-2 outline-none border border-zinc-600 focus:border-red-500"
              />
            ) : (
          <p className="className="mt-2 text-lg font-semibold break-all>
                {usuario?.cpf || "Não informado"}
              </p>
            )}
          </div>

          <div className="bg-zinc-900/60
border border-zinc-800
rounded-xl
px-4 py-3">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
              Telefone
            </p>

            {editando ? (
              <input
                type="text"
                value={form.telefone}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    telefone: formatarTelefone(
                      e.target.value
                    ),
                  }))
                }
                className="mt-1 w-full rounded-lg bg-zinc-700 px-3 py-2 outline-none border border-zinc-600 focus:border-red-500"
              />
            ) : (
          <p className="className="mt-2 text-lg font-semibold break-all>
                {usuario?.telefone ||
                  "Não informado"}
              </p>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/60
border border-zinc-800
rounded-xl
px-4 py-3 py-3 mt-3">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
            E-mail
          </p>

          <p className="className="mt-2 text-lg font-semibold break-all>
            {usuario?.email}
          </p>
        </div>

        {/* Botões */}
        <div className="space-y-3 mt-6">
          {editando ? (
            <div className="grid grid-cols-2 gapx-4 py-3">
              <button
                onClick={() => {
                  setForm({
                    nome: usuario.nome || "",
                    telefone:
                      usuario.telefone || "",
                    cpf: usuario.cpf || "",
                  });

                  setEditando(false);
                }}
                className="bg-zinc-700 hover:bg-zinc-600 rounded-xl py-3 font-semibold transition"
              >
                Cancelar
              </button>

              <button
                onClick={salvarPerfil}
                className="bg-red-700 hover:bg-red-600 rounded-xl py-3 font-semibold transition flex items-center justify-center gap-2"
              >
                <Pencil size={18} />
                Salvar
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() =>
                  setEditando(true)
                }
                className="w-full bg-red-700 hover:bg-red-600 rounded-xl py-3 flex items-center justify-center gap-2 font-semibold transition"
              >
                <Pencil size={18} />
                Editar perfil
              </button>

              <button
                onClick={() =>
                  setMostrarAlterarSenha(
                    !mostrarAlterarSenha
                  )
                }
                className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-xl py-3 flex items-center justify-center gap-2 font-semibold transition"
              >
                <Lock size={18} />
                {mostrarAlterarSenha
                  ? "Cancelar alteração de senha"
                  : "Alterar senha"}
              </button>

              {mostrarAlterarSenha && (
                <div className="bg-zinc-900/60
border border-zinc-800
rounded-xl
px-4 py-3 space-y-4">

                  <div>
                    <label className="text-sm text-zinc-500">
                      Nova senha
                    </label>

                    <input
                      type="password"
                      value={senha.nova}
                      onChange={(e) =>
                        setSenha((prev) => ({
                          ...prev,
                          nova: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl bg-zinc-700 px-4 py-3 border border-zinc-600 outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-500">
                      Confirmar nova senha
                    </label>

                    <input
                      type="password"
                      value={senha.confirmar}
                      onChange={(e) =>
                        setSenha((prev) => ({
                          ...prev,
                          confirmar:
                            e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl bg-zinc-700 px-4 py-3 border border-zinc-600 outline-none focus:border-red-500"
                    />
                  </div>

                  <button
                    onClick={alterarSenha}
                    className="w-full bg-red-700 hover:bg-red-600 rounded-xl py-3 font-semibold transition"
                  >
                    Salvar nova senha
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}