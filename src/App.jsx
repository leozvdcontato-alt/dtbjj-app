import { useEffect, useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ResetSenha from "./components/ResetSenha";
import InstalarPWA from "./components/InstalarPWA";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

function modoDefinicaoSenhaDaUrl() {
  const hash = window.location.hash || "";
  const params = new URLSearchParams(window.location.search);

  if (hash.includes("type=invite") || params.get("type") === "invite") {
    return "convite";
  }

  if (hash.includes("type=recovery") || params.get("type") === "recovery") {
    return "recuperacao";
  }

  return "";
}

export default function App() {
  const { usuario, loading } = useAuth();
  const paginaInstalacao = window.location.pathname.replace(/\/$/, "") === "/instalar";
  const [modoSenha, setModoSenha] = useState(modoDefinicaoSenhaDaUrl);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setModoSenha("recuperacao");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (paginaInstalacao) {
    return <InstalarPWA />;
  }

  if (modoSenha) {
    return (
      <ResetSenha
        modo={modoSenha}
        onConcluido={() => setModoSenha("")}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Carregando...
      </div>
    );
  }

  return usuario ? <Dashboard /> : <Login />;
}
