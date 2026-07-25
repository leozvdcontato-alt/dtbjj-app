import { User, Shield, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PainelMais({ setTela }) {
  const { logout } = useAuth();

  return (
    <div className="space-y-3">

      <button
        onClick={() =>
          setTela({
            pagina: "perfil",
            turma: null,
          })
        }
        className="w-full bg-zinc-900 rounded-2xl p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <User size={22} />
          <span>Meu Perfil</span>
        </div>

        <ChevronRight size={20} />
      </button>

      <button
        className="w-full bg-zinc-900 rounded-2xl p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Shield size={22} />
          <span>Permissões</span>
        </div>

        <ChevronRight size={20} />
      </button>

      <button
        onClick={logout}
        className="w-full bg-red-900/20 text-red-400 rounded-2xl p-4 flex items-center gap-3"
      >
        <LogOut size={22} />
        <span>Sair</span>
      </button>

    </div>
  );
}