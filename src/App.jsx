import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { useAuth } from "@/contexts/AuthContext";

export default function App() {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Carregando...
      </div>
    );
  }

  return usuario ? <Dashboard /> : <Login />;
}