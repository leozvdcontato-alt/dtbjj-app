import { useMemo } from "react";
import { X } from "lucide-react";

export default function QrStoriesModal({ aberto, svg, nomeLocal, onClose }) {
  const url = useMemo(
    () => (svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : ""),
    [svg]
  );

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black">
      <div className="relative mx-auto flex min-h-[100dvh] max-w-md items-center justify-center bg-black">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar apresentação"
          className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
        >
          <X size={22} />
        </button>

        {url ? (
          <img
            src={url}
            alt={`QR Code de check-in - ${nomeLocal}`}
            className="h-[100dvh] w-full object-contain"
          />
        ) : (
          <div className="text-sm text-zinc-500">Preparando QR Code...</div>
        )}
      </div>
    </div>
  );
}
