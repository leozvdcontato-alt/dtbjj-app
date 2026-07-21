import { House, Users, GraduationCap, Ellipsis } from "lucide-react";

export default function BottomNavigation({ tela, setTela }) {
  return (
    <nav className="fixed bottom-0 left-0 w-full h-20 bg-zinc-950 border-t border-zinc-800 px-2 shadow-2xl">

      <div className="flex items-center justify-around h-full max-w-5xl mx-auto">

        <button
          onClick={() => setTela("home")}
          className={`flex-1 mx-1 py-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
            tela === "home"
              ? "bg-red-900/30 text-red-500"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <House size={22} />
          <span className="text-xs font-medium">Home</span>
        </button>

        <button
          onClick={() => setTela("alunos")}
          className={`flex-1 mx-1 py-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
            tela === "alunos"
              ? "bg-red-900/30 text-red-500"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Users size={22} />
          <span className="text-xs font-medium">Alunos</span>
        </button>

        <button
          onClick={() => setTela("turmas")}
          className={`flex-1 mx-1 py-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
            tela === "turmas"
              ? "bg-red-900/30 text-red-500"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <GraduationCap size={22} />
          <span className="text-xs font-medium">Turmas</span>
        </button>

        <button
          onClick={() => setTela("mais")}
          className={`flex-1 mx-1 py-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
            tela === "mais"
              ? "bg-red-900/30 text-red-500"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Ellipsis size={22} />
          <span className="text-xs font-medium">Mais</span>
        </button>

      </div>

    </nav>
  );
}