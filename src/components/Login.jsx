import { useState } from "react";
import { supabase } from "../lib/supabase";
import CadastroModal from "../components/CadastroModal";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [modalCadastro, setModalCadastro] = useState(false);

  async function handleLogin() {
    console.log("Iniciando login");

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      console.log("DATA:", data);
      console.log("ERROR:", error);

      if (error) {
        setErro(error.message);
      }
    } catch (err) {
      console.error(err);
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/dtbjjapplogo.png"
            className="w-36 h-36 object-contain mx-auto mb-4"
            alt="DTBJJ"
          />

          <h1 className="text-4xl font-bold">
            DTBJJ
          </h1>

          <p className="text-gray-400 mt-2">
            Bem vindo à Dream Team!
          </p>
        </div>

        <div className="bg-[#111111] border border-red-900/30 rounded-3xl p-6">

          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-2">
              E-mail
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-xl bg-[#1A1A1A] px-4 outline-none"
            />
          </div>

          <div className="mb-6">
            <label className="text-sm text-gray-400 block mb-2">
              Senha
            </label>

            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full h-12 rounded-xl bg-[#1A1A1A] px-4 outline-none"
            />
          </div>

          {erro && (
            <div className="bg-red-900/30 text-red-300 text-sm rounded-xl p-3 mb-4">
              {erro}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-red-700 hover:bg-red-600 font-semibold transition"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">

            <p className="text-sm text-gray-400">
              Não possui uma conta?
            </p>

            <button
  onClick={() => setModalCadastro(true)}
  className="mt-2 text-red-500 hover:text-red-400 font-semibold transition-colors"
>
  Criar conta
</button>

          </div>

        </div>
      </div>

      <CadastroModal
  aberto={modalCadastro}
  fechar={() => setModalCadastro(false)}
/>

    </div>
  );
}