import { CheckCircle, XCircle, Info } from "lucide-react";

export default function Toast({
  mensagem,
  tipo = "success",
  visivel,
}) {
  if (!visivel) return null;

  const estilos = {
    success: {
      bg: "bg-green-600",
      icon: <CheckCircle size={22} />,
    },
    error: {
      bg: "bg-red-600",
      icon: <XCircle size={22} />,
    },
    info: {
      bg: "bg-blue-600",
      icon: <Info size={22} />,
    },
  };

  const atual = estilos[tipo];

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top duration-300">
      <div
        className={`
          ${atual.bg}
          w-80
          rounded-2xl
          shadow-2xl
          overflow-hidden
        `}
      >
        <div className="flex items-center gap-3 p-4 text-white">

          {atual.icon}

          <span className="font-semibold leading-5">
            {mensagem}
          </span>

        </div>

        <div className="h-1 bg-white/20">
          <div className="h-full bg-white animate-[toast_3s_linear_forwards]" />
        </div>

      </div>
    </div>
  );
}