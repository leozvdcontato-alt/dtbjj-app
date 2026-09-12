import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erroPerfil, setErroPerfil] = useState("");

  async function carregarUsuario(authUser) {
    if (!authUser) {
      setUsuario(null);
      setErroPerfil("");
      return null;
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("auth_id", authUser.id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar perfil:", error);
      setUsuario(null);
      setErroPerfil("Não foi possível carregar seu perfil.");
      return null;
    }

    if (!data) {
      setUsuario(null);
      setErroPerfil("Seu acesso ainda não possui um perfil válido.");
      return null;
    }

    if (data.status !== "Ativo") {
      setUsuario(null);
      setErroPerfil("Seu acesso está inativo. Procure a administração da DTBJJ.");
      await supabase.auth.signOut();
      return null;
    }

    const perfil = {
      ...data,
      email: authUser.email,
    };

    setUsuario(perfil);
    setErroPerfil("");
    return perfil;
  }

  async function atualizarUsuario() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setUsuario(null);
      return null;
    }

    return carregarUsuario(session.user);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUsuario(null);
    setErroPerfil("");
  }

  useEffect(() => {
    let ativo = true;

    async function carregarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!ativo) return;

      if (session?.user) {
        await carregarUsuario(session.user);
      } else {
        setUsuario(null);
        setErroPerfil("");
      }

      if (ativo) setLoading(false);
    }

    carregarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ativo) return;

      if (!session?.user) {
        setUsuario(null);
        setErroPerfil("");
        setLoading(false);
        return;
      }

      setLoading(true);

      setTimeout(async () => {
        if (!ativo) return;
        await carregarUsuario(session.user);
        if (ativo) setLoading(false);
      }, 0);
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    usuario,
    loading,
    erroPerfil,
    logout,
    atualizarUsuario,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return contexto;
}
