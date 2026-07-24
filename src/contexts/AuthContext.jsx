import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState({
    id: 1,
    nome: "Leonardo Azevedo Barbosa",
    cargo: "Administrador DTBJJ",
    foto: null,
  });

  return (
    <AuthContext.Provider
      value={{
        usuario,
        setUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}