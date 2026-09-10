import { useEffect, useState } from "react";
import { Copy, MapPin } from "lucide-react";
import PageHeader from "./ui/PageHeader";
import EmptyState from "./ui/EmptyState";
import { listarLocais, montarLinkCheckin } from "@/services/locais";
import { useToast } from "@/contexts/ToastContext";

export default function PainelLocais() {
  const [locais, setLocais] = useState([]);
  const { mostrarToast } = useToast();

  useEffect(() => {
    let ativo = true;

    listarLocais()
      .then((dados) => {
        if (ativo) setLocais(dados);
      })
      .catch((error) => console.error("Erro ao carregar locais:", error));

    return () => {
      ativo = false;
    };
  }, []);

  async function copiar(token) {
    try {
      await navigator.clipboard.writeText(montarLinkCheckin(token));
      mostrarToast("Link do QR copiado.", "success");
    } catch {
      mostrarToast("Não foi possível copiar o link.", "error");
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        title="Locais e QR"
        subtitle="Cada local possui um link fixo para o QR Code de check-in."
      />

      {locais.length === 0 ? (
        <EmptyState
          Icon={MapPin}
          title="Nenhum local cadastrado"
          description="Cadastre os locais das aulas antes de configurar check-in."
        />
      ) : (
        <div className="space-y-3">
          {locais.map((local) => (
            <article
              key={local.id}
              className="rounded-3xl border border-white/10 bg-[#121212] p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-zinc-500">
                  <MapPin size={19} />
                </div>
                <div>
                  <h3 className="font-semibold">{local.nome}</h3>
                  <p className="text-xs text-zinc-600">
                    {local.ativo ? "Check-in ativo" : "Check-in desativado"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copiar(local.token_qr)}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-zinc-300"
              >
                <Copy size={16} />
                Copiar link do QR
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
