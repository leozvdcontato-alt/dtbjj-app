import { Check, Circle } from "lucide-react";
import { validarSenha } from "@/lib/senha";

export default function RequisitosSenha({ senha = "" }) {
  const regras = validarSenha(senha);
  const itens = [
    ["tamanho", "8 ou mais caracteres"],
    ["letra", "Pelo menos 1 letra"],
    ["numero", "Pelo menos 1 número"],
  ];

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      {itens.map(([chave, rotulo]) => {
        const ok = regras[chave];
        return (
          <p
            key={chave}
            className={
              "flex items-center gap-2 text-xs " +
              (ok ? "text-emerald-400" : "text-zinc-500")
            }
          >
            {ok ? <Check size={14} /> : <Circle size={10} />}
            {rotulo}
          </p>
        );
      })}
    </div>
  );
}
