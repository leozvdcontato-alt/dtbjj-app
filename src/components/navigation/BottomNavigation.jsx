import {
  CalendarCheck2,
  ClipboardCheck,
  Ellipsis,
  GraduationCap,
  House,
  Users,
} from "lucide-react";
import { ehAluno } from "@/lib/permissoes";

const ITENS_ALUNO = [
  { pagina: "home", rotulo: "Início", Icone: House },
  { pagina: "turmas", rotulo: "Turmas", Icone: GraduationCap },
  { pagina: "frequencia", rotulo: "Frequência", Icone: CalendarCheck2 },
  { pagina: "mais", rotulo: "Mais", Icone: Ellipsis },
];

const ITENS_GESTAO = [
  { pagina: "home", rotulo: "Início", Icone: House },
  { pagina: "alunos", rotulo: "Alunos", Icone: Users },
  { pagina: "chamada", rotulo: "Chamada", Icone: ClipboardCheck },
  { pagina: "turmas", rotulo: "Turmas", Icone: GraduationCap },
  { pagina: "mais", rotulo: "Mais", Icone: Ellipsis },
];

export default function BottomNavigation({ tela, setTela, usuario }) {
  const itens = ehAluno(usuario) ? ITENS_ALUNO : ITENS_GESTAO;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-around">
        {itens.map(({ pagina, rotulo, Icone }) => {
          const ativo = tela.pagina === pagina;

          return (
            <button
              key={pagina}
              type="button"
              onClick={() => setTela({ pagina, turma: null })}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs font-medium transition ${
                ativo ? "text-red-500" : "text-zinc-500 active:text-zinc-200"
              }`}
            >
              <div className={`rounded-xl p-1.5 transition ${ativo ? "bg-red-950/50" : ""}`}>
                <Icone size={20} strokeWidth={ativo ? 2.4 : 2} />
              </div>
              <span className="truncate">{rotulo}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
