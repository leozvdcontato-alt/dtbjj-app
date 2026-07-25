import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  async function carregarUsuario(authId, email) {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("auth_id", authId)
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    setUsuario({
      ...data,
      email,
    });

    return data;
  }

  async function atualizarUsuario() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return;

    await carregarUsuario(
      session.user.id,
      session.user.email
    );
  }

  const login = (dados) => {
    setUsuario(dados);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  useEffect(() => {
    async function carregarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await carregarUsuario(
          session.user.id,
          session.user.email
        );
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
        await carregarUsuario(
          session.user.id,
          session.user.email
        );
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
        login,
        logout,
        atualizarUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}