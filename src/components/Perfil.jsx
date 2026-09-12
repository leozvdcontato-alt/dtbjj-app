import { useRef, useState } from "react";
import { Camera, Lock, Pencil, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { uploadAvatar } from "@/services/avatarService";
import { atualizarPerfil } from "@/services/usuarioService";
import { supabase } from "@/lib/supabase";
import { rotuloCargo } from "@/lib/permissoes";
import SenhaInput from "./ui/SenhaInput";
import RequisitosSenha from "./ui/RequisitosSenha";
import { senhaValida, TEXTO_REGRA_SENHA } from "@/lib/senha";

export default function Perfil({ setTela }) {
  const { usuario, atualizarUsuario } = useAuth();
  const { mostrarToast } = useToast();
  const inputFile = useRef(null);

  const [editando, setEditando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [alterandoSenha, setAlterandoSenha] = useState(false);
  const [form, setForm] = useState(() => ({
    nome: usuario?.nome || "",
    telefone: usuario?.telefone || "",
    cpf: usuario?.cpf || "",
  }));
  const [senha, setSenha] = useState({ nova: "", confirmar: "" });

  async function selecionarFoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setEnviandoFoto(true);
      await uploadAvatar(file, usuario);
      await atualizarUsuario();
      mostrarToast("Foto atualizada com sucesso!", "success");
    } catch (error) {
      console.error(error);
      mostrarToast("Não foi possível atualizar a foto.", "error");
    } finally {
      setEnviandoFoto(false);
      event.target.value = "";
    }
  }

  async function salvarPerfil() {
    if (!form.nome.trim()) {
      mostrarToast("Informe seu nome.", "error");
      return;
    }

    try {
      await atualizarPerfil(usuario.id, form);
      await atualizarUsuario();
      setEditando(false);
      mostrarToast("Perfil atualizado com sucesso!", "success");
    } catch (error) {
      console.error(error);
      mostrarToast("Não foi possível atualizar o perfil.", "error");
    }
  }

  async function salvarSenha() {
    if (!senhaValida(senha.nova)) {
      mostrarToast(TEXTO_REGRA_SENHA, "error");
      return;
    }

    if (senha.nova !== senha.confirmar) {
      mostrarToast("As senhas não coincidem.", "error");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: senha.nova });

    if (error) {
      mostrarToast(error.message, "error");
      return;
    }

    setSenha({ nova: "", confirmar: "" });
    setAlterandoSenha(false);
    mostrarToast("Senha alterada com sucesso!", "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
            Conta
          </p>
          <h1 className="mt-1 text-2xl font-bold">Meu perfil</h1>
        </div>

        <button
          type="button"
          onClick={() => setTela?.({ pagina: "home", turma: null })}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#121212] text-zinc-400"
        >
          <X size={19} />
        </button>
      </div>

      <section className="rounded-3xl border border-white/10 bg-[#121212] p-5">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 text-2xl font-bold text-zinc-500">
            {usuario?.foto ? (
              <img
                src={usuario.foto}
                alt={usuario.nome}
                className="h-full w-full object-cover"
              />
            ) : (
              usuario?.nome?.slice(0, 1)?.toUpperCase() || "D"
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
            type="button"
            onClick={() => inputFile.current?.click()}
            disabled={enviandoFoto}
            className="mt-3 flex items-center gap-2 text-sm font-medium text-red-500 disabled:opacity-50"
          >
            <Camera size={15} />
            {enviandoFoto ? "Enviando..." : "Alterar foto"}
          </button>

          <h2 className="mt-4 text-xl font-bold">{usuario?.nome}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {rotuloCargo(usuario?.cargo)} DTBJJ
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-[#121212] p-5">
        <Campo
          rotulo="Nome"
          valor={form.nome}
          editando={editando}
          onChange={(valor) =>
            setForm((atual) => ({ ...atual, nome: valor }))
          }
        />
        <Campo
          rotulo="Telefone"
          valor={form.telefone}
          editando={editando}
          placeholder="Não informado"
          onChange={(valor) =>
            setForm((atual) => ({ ...atual, telefone: valor }))
          }
        />
        <Campo
          rotulo="CPF"
          valor={form.cpf}
          editando={editando}
          placeholder="Não informado"
          onChange={(valor) =>
            setForm((atual) => ({ ...atual, cpf: valor }))
          }
        />

        <div className="rounded-2xl bg-black/30 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-600">
            E-mail
          </p>
          <p className="mt-1 break-all text-sm font-medium text-zinc-300">
            {usuario?.email}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        {editando ? (
          <>
            <button
              type="button"
              onClick={() => {
                setForm({
                  nome: usuario?.nome || "",
                  telefone: usuario?.telefone || "",
                  cpf: usuario?.cpf || "",
                });
                setEditando(false);
              }}
              className="h-12 rounded-2xl border border-white/10 bg-[#121212] font-semibold text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvarPerfil}
              className="h-12 rounded-2xl bg-red-700 font-semibold text-white"
            >
              Salvar
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-700 font-semibold text-white"
            >
              <Pencil size={17} /> Editar
            </button>
            <button
              type="button"
              onClick={() => setAlterandoSenha((valor) => !valor)}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#121212] font-semibold text-zinc-300"
            >
              <Lock size={17} /> Senha
            </button>
          </>
        )}
      </div>

      {alterandoSenha && (
        <section className="space-y-3 rounded-3xl border border-white/10 bg-[#121212] p-5">
          <h3 className="font-semibold">Alterar senha</h3>
          <div>
            <SenhaInput
              autoComplete="new-password"
              placeholder="Nova senha"
              value={senha.nova}
              onChange={(event) =>
                setSenha((atual) => ({ ...atual, nova: event.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 outline-none focus:border-red-700"
            />
            <RequisitosSenha senha={senha.nova} />
          </div>
          <SenhaInput
            autoComplete="new-password"
            placeholder="Confirmar nova senha"
            value={senha.confirmar}
            onChange={(event) =>
              setSenha((atual) => ({ ...atual, confirmar: event.target.value }))
            }
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 outline-none focus:border-red-700"
          />
          <button
            type="button"
            onClick={salvarSenha}
            className="h-12 w-full rounded-2xl bg-red-700 font-semibold text-white"
          >
            Salvar nova senha
          </button>
        </section>
      )}
    </div>
  );
}

function Campo({ rotulo, valor, editando, onChange, placeholder = "" }) {
  return (
    <div className="rounded-2xl bg-black/30 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.15em] text-zinc-600">
        {rotulo}
      </p>
      {editando ? (
        <input
          type="text"
          value={valor}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 w-full bg-transparent text-sm font-medium text-white outline-none"
        />
      ) : (
        <p className="mt-1 break-words text-sm font-medium text-zinc-300">
          {valor || placeholder}
        </p>
      )}
    </div>
  );
}
