import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = "Selecione",
}) {
  const [aberto, setAberto] = useState(false);

  function toggleOption(id) {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
      return;
    }

    onChange([...value, id]);
  }

  const selecionadas = options
    .filter((option) => value.includes(option.id))
    .map((option) => option.nome);

  const resumo =
    selecionadas.length === 0
      ? placeholder
      : selecionadas.length <= 2
        ? selecionadas.join(", ")
        : selecionadas.length + " turmas selecionadas";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        aria-expanded={aberto}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#171717] px-4 text-left text-sm text-white outline-none transition hover:border-white/15 focus-visible:border-red-700 focus-visible:ring-2 focus-visible:ring-red-950"
      >
        <span className={selecionadas.length ? "truncate" : "truncate text-zinc-500"}>
          {resumo}
        </span>

        <ChevronDown
          size={18}
          className={
            "shrink-0 text-zinc-500 transition-transform " +
            (aberto ? "rotate-180" : "")
          }
        />
      </button>

      {aberto ? (
        <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#171717] p-2 shadow-2xl">
          {options.length === 0 ? (
            <div className="px-3 py-3 text-sm text-zinc-500">
              Nenhuma turma cadastrada.
            </div>
          ) : (
            options.map((option) => {
              const selecionada = value.includes(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleOption(option.id)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                >
                  <span className="min-w-0 truncate">{option.nome}</span>

                  <span
                    className={
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border " +
                      (selecionada
                        ? "border-red-600 bg-red-700 text-white"
                        : "border-white/15 text-transparent")
                    }
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
