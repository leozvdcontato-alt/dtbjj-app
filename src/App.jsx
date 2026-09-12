import { useEffect, useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ResetSenha from "./components/ResetSenha";
import InstalarPWA from "./components/InstalarPWA";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

function urlTemRecuperacao() {
  const hash = window.location.hash || "";
  const params = new URLSearchParams(window.location.search);

  return hash.includes("type=recovery") || params.get("type") === "recovery";
}

export default function App() {
  const { usuario, loading } = useAuth();
  const paginaInstalacao = window.location.pathname.replace(/\/$/, "") === "/instalar";
  const [recuperandoSenha, setRecuperandoSenha] = useState(urlTemRecuperacao);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecuperandoSenha(true);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (paginaInstalacao) {
    return <InstalarPWA />;
  }

  if (recuperandoSenha) {
    return <ResetSenha onConcluido={() => setRecuperandoSenha(false)} />;
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
