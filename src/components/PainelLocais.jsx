import { useEffect, useState } from "react";
import {
  Copy,
  Download,
  Expand,
  Loader2,
  MapPin,
  QrCode,
} from "lucide-react";
import PageHeader from "./ui/PageHeader";
import EmptyState from "./ui/EmptyState";
import QrStoriesModal from "./QrStoriesModal";
import { listarLocais, montarLinkCheckin } from "@/services/locais";
import { baixarSvgComoPng, gerarMaterialQr } from "@/services/qrMateriais";
import { useToast } from "@/contexts/ToastContext";

function svgDataUrl(svg) {
  return svg
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    : "";
}

export default function PainelLocais() {
  const [locais, setLocais] = useState([]);
  const [previews, setPreviews] = useState({});
  const [gerando, setGerando] = useState("");
  const [stories, setStories] = useState({
    aberto: false,
    svg: "",
    nome: "",
  });
  const { mostrarToast } = useToast();

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const dados = await listarLocais();
        if (!ativo) return;

        setLocais(dados);

        const resultados = await Promise.allSettled(
          dados.map(async (local) => {
            const material = await gerarMaterialQr(local.id, "qr");
            return [local.id, material.svg];
          })
        );

        if (!ativo) return;

        setPreviews(
          Object.fromEntries(
            resultados
              .filter((resultado) => resultado.status === "fulfilled")
              .map((resultado) => resultado.value)
          )
        );
      } catch (error) {
        console.error("Erro ao carregar locais:", error);
      }
    }

    carregar();

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

  async function baixarA4(local) {
    const chave = `${local.id}-a4`;
    setGerando(chave);

    try {
      const material = await gerarMaterialQr(local.id, "a4");
      await baixarSvgComoPng(
        material.svg,
        `dtbjj-checkin-${local.nome
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")}-a4.png`,
        2480,
        3508
      );
      mostrarToast("Imagem A4 gerada.", "success");
    } catch (error) {
      mostrarToast(error.message || "Não foi possível gerar o A4.", "error");
    } finally {
      setGerando("");
    }
  }

  async function abrirStories(local) {
    const chave = `${local.id}-story`;
    setGerando(chave);

    try {
      const material = await gerarMaterialQr(local.id, "story");
      setStories({ aberto: true, svg: material.svg, nome: local.nome });
    } catch (error) {
      mostrarToast(error.message || "Não foi possível abrir o QR.", "error");
    } finally {
      setGerando("");
    }
  }

  return (
    <>
      <section className="space-y-5">
        <PageHeader
          title="Locais e QR"
          subtitle="Cada local tem um QR fixo de check-in. Baixe o A4 ou exiba em tela cheia durante a aula."
        />

        {locais.length === 0 ? (
          <EmptyState
            Icon={MapPin}
            title="Nenhum local cadastrado"
            description="Cadastre os locais das aulas antes de configurar check-in."
          />
        ) : (
          <div className="space-y-4">
            {locais.map((local) => {
              const preview = previews[local.id];

              return (
                <article
                  key={local.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-[#121212]"
                >
                  <div className="p-5">
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

                    <div className="mt-5 rounded-3xl bg-white p-4">
                      {preview ? (
                        <img
                          src={svgDataUrl(preview)}
                          alt={`QR Code de check-in - ${local.nome}`}
                          className="mx-auto aspect-square w-full max-w-[260px]"
                        />
                      ) : (
                        <div className="flex aspect-square w-full items-center justify-center text-zinc-400">
                          <div className="text-center">
                            <Loader2 className="mx-auto animate-spin" size={24} />
                            <p className="mt-2 text-xs">Carregando QR...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-zinc-500">
                      <QrCode size={15} />
                      <span>QR fixo deste local</span>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => baixarA4(local)}
                        disabled={Boolean(gerando)}
                        className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-700 px-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                      >
                        {gerando === `${local.id}-a4` ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <Download size={17} />
                        )}
                        Baixar A4
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirStories(local)}
                        disabled={Boolean(gerando)}
                        className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 disabled:opacity-50"
                      >
                        {gerando === `${local.id}-story` ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <Expand size={17} />
                        )}
                        Tela cheia
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => copiar(local.token_qr)}
                      className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-2xl text-xs font-semibold text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
                    >
                      <Copy size={15} />
                      Copiar link do check-in
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <QrStoriesModal
        aberto={stories.aberto}
        svg={stories.svg}
        nomeLocal={stories.nome}
        onClose={() => setStories({ aberto: false, svg: "", nome: "" })}
      />
    </>
  );
}
