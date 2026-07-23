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
    } else {
      onChange([...value, id]);
    }
  }

  return (
    <div className="relative">

      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="w-full h-14 bg-[#1A1A1A] rounded-2xl px-4 flex items-center justify-between"
      >
        <span className="truncate">
          {value.length > 0
            ? `${value.length} selecionada${value.length > 1 ? "s" : ""}`
            : placeholder}
        </span>

        <span
          className={`transition-transform ${
            aberto ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {aberto && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-[#1A1A1A] p-2 shadow-xl">

          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              Nenhuma opção encontrada.
            </div>
          ) : (
            options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleOption(option.id)}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/10 transition"
              >
                <span>{option.nome}</span>

                <span className="text-green-400 font-bold">
                  {value.includes(option.id) ? "✓" : ""}
                </span>
              </button>
            ))
          )}

        </div>
      )}

    </div>
  );
}