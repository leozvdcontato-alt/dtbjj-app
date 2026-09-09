import { ChevronRight, LogOut, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { rotuloCargo } from "@/lib/permissoes";

export default function PainelMais({ setTela }) {
  const { logout, usuario } = useAuth();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
          Conta
        </p>
        <h2 className="mt-1 text-2xl font-bold">Mais</h2>
      </div>

      <section className="rounded-3xl border border-white/10 bg-[#121212] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400">
            <ShieldCheck size={21} />
          </div>
          <div>
            <p className="font-semibold">{rotuloCargo(usuario?.cargo)} DTBJJ</p>
            <p className="mt-0.5 text-sm text-zinc-500">
              Seu acesso é definido pela função cadastrada na academia.
            </p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setTela({ pagina: "perfil", turma: null })}
        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#121212] p-4 text-left transition active:bg-zinc-900"
      >
        <div className="flex items-center gap-3">
          <User size={21} className="text-zinc-400" />
          <span className="font-medium">Meu perfil</span>
        </div>
        <ChevronRight size={18} className="text-zinc-600" />
      </button>

      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center gap-3 rounded-2xl border border-red-900/30 bg-red-950/20 p-4 text-left font-medium text-red-400 transition active:bg-red-950/40"
      >
        <LogOut size={21} />
        <span>Sair</span>
      </button>
    </div>
  );
}
