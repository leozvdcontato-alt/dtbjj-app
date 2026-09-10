import { Search, X } from "lucide-react";

export default function SearchField({
  value,
  onChange,
  placeholder = "Buscar...",
  label = "Buscar",
}) {
  return (
    <div className="relative">
      <Search
        aria-hidden="true"
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
      />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-12 w-full rounded-2xl border border-white/10 bg-[#141414] pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-700 focus:ring-2 focus:ring-red-950"
      />

      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
        >
          <X size={17} />
        </button>
      ) : null}
    </div>
  );
}
