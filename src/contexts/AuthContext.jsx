import { createContext, useContext, useState } from "react";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = (dados) => {
    setUsuario(dados);
  };

  const logout = () => {
    setUsuario(null);
  };

useEffect(() => {
  async function carregarSessao() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const { data } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_id", session.user.id)
        .single();

      setUsuario(data);
    } else {
      setUsuario(null);
    }

    setLoading(false);
  }

  carregarSessao();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const { data } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_id", session.user.id)
        .single();

      setUsuario(data);
    } else {
      setUsuario(null);
    }

    setLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        loading,
        setLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}