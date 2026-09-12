import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function SenhaInput({ className = "", ...props }) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visivel ? "text" : "password"}
        className={className + " pr-12"}
      />
      <button
        type="button"
        onClick={() => setVisivel((valor) => !valor)}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visivel}
        className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
      >
        {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
