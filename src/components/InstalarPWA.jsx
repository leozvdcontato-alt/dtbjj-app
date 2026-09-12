import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  EllipsisVertical,
  ExternalLink,
  MoreHorizontal,
  Share,
  Smartphone,
  SquarePlus,
} from "lucide-react";

function detectarPlataforma() {
  const ua = navigator.userAgent || "";
  const iOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);

  if (iOS) return "ios";
  if (android) return "android";
  return "outro";
}

function estaInstalado() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export default function InstalarPWA() {
  const [promptInstalacao, setPromptInstalacao] = useState(null);
  const [instalado, setInstalado] = useState(estaInstalado);
  const [copiado, setCopiado] = useState(false);
  const [plataforma] = useState(detectarPlataforma);
  const urlInstalacao = window.location.origin + "/instalar";

  useEffect(() => {
    function prepararPrompt(event) {
      event.preventDefault();
      setPromptInstalacao(event);
    }

    function marcarInstalado() {
      setInstalado(true);
      setPromptInstalacao(null);
    }

    window.addEventListener("beforeinstallprompt", prepararPrompt);
    window.addEventListener("appinstalled", marcarInstalado);

    return () => {
      window.removeEventListener("beforeinstallprompt", prepararPrompt);
      window.removeEventListener("appinstalled", marcarInstalado);
    };
  }, []);

  async function instalar() {
    if (!promptInstalacao) return;

    await promptInstalacao.prompt();
    const escolha = await promptInstalacao.userChoice;

    if (escolha.outcome === "accepted") {
      setPromptInstalacao(null);
    }
  }

  async function compartilhar() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Instalar DTBJJ App",
          text: "Abra este link para instalar o DTBJJ App no celular.",
          url: urlInstalacao,
        });
        return;
      } catch {
        return;
      }
    }

    await navigator.clipboard.writeText(urlInstalacao);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1800);
  }

  async function copiar() {
    await navigator.clipboard.writeText(urlInstalacao);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <main className="mx-auto w-full max-w-xl px-4 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/dtbjjapplogo.png"
              alt="DTBJJ"
              className="h-11 w-11 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500">
                DTBJJ App
              </p>
              <h1 className="truncate text-lg font-bold">Instalação</h1>
            </div>
          </div>

          <a
            href="/"
            className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-300 transition active:bg-white/10"
          >
            Abrir app
            <ExternalLink size={16} />
          </a>
        </header>

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#121212]">
          <div className="p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-950/50 text-red-400">
              <Smartphone size={26} />
            </div>

            <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight">
              Tenha o DTBJJ App na tela do seu celular
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-zinc-400">
              O DTBJJ App funciona como um aplicativo instalado, com ícone na
              tela inicial e acesso rápido, sem precisar procurar o site toda vez.
            </p>
          </div>

          <div className="border-t border-white/10 bg-black/20 p-4">
            {instalado ? (
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-950/30 p-4 text-emerald-300">
                <CheckCircle2 size={22} className="shrink-0" />
                <div>
                  <p className="font-semibold">O DTBJJ App já está instalado</p>
                  <p className="mt-1 text-xs text-emerald-300/70">
                    Você já pode abrir pelo ícone na tela inicial.
                  </p>
                </div>
              </div>
            ) : plataforma === "android" && promptInstalacao ? (
              <button
                type="button"
                onClick={instalar}
                className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-red-700 px-5 font-semibold text-white transition active:bg-red-800"
              >
                <Download size={20} />
                Instalar DTBJJ App
              </button>
            ) : (
              <p className="px-2 py-1 text-sm leading-6 text-zinc-500">
                Siga os passos abaixo. A instalação leva menos de um minuto.
              </p>
            )}
          </div>
        </section>

        {!instalado ? (
          <section className="mt-5 rounded-3xl border border-white/10 bg-[#121212] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500">
              {plataforma === "ios"
                ? "iPhone"
                : plataforma === "android"
                  ? "Android"
                  : "No celular"}
            </p>
            <h2 className="mt-1 text-xl font-bold">
              {plataforma === "ios"
                ? "Como instalar no iPhone"
                : plataforma === "android"
                  ? "Como instalar no Android"
                  : "Abra este link no celular"}
            </h2>

            <div className="mt-5 space-y-3">
              {plataforma === "ios" ? (
                <>
                  <Passo
                    numero="1"
                    Icone={Share}
                    titulo="Abra pelo Safari e toque em Compartilhar"
                    descricao="Dependendo do layout do Safari, use Compartilhar ou Mais > Compartilhar."
                  />
                  <Passo
                    numero="2"
                    Icone={SquarePlus}
                    titulo="Toque em “Adicionar à Tela de Início”"
                    descricao="Se necessário, role as opções do menu para encontrar."
                  />
                  <Passo
                    numero="3"
                    Icone={Smartphone}
                    titulo="Ative “Abrir como App da Web”"
                    descricao="Isso faz o DTBJJ abrir com comportamento de aplicativo."
                  />
                  <Passo
                    numero="4"
                    Icone={CheckCircle2}
                    titulo="Toque em “Adicionar”"
                    descricao="O ícone do DTBJJ App aparecerá junto aos seus aplicativos."
                  />
                </>
              ) : plataforma === "android" ? (
                <>
                  <Passo
                    numero="1"
                    Icone={MoreHorizontal}
                    titulo="Abra este link no Chrome"
                    descricao="Se o botão automático não aparecer, use o menu do navegador."
                  />
                  <Passo
                    numero="2"
                    Icone={EllipsisVertical}
                    titulo="Toque no menu de três pontos"
                    descricao="Procure por “Instalar app” ou “Adicionar à tela inicial”."
                  />
                  <Passo
                    numero="3"
                    Icone={CheckCircle2}
                    titulo="Confirme a instalação"
                    descricao="Depois disso, abra o DTBJJ App pelo novo ícone."
                  />
                </>
              ) : (
                <>
                  <Passo
                    numero="1"
                    Icone={Copy}
                    titulo="Envie ou copie este link para o celular"
                    descricao={urlInstalacao}
                  />
                  <Passo
                    numero="2"
                    Icone={Smartphone}
                    titulo="Abra o link no navegador do celular"
                    descricao="A página detecta o aparelho e mostra o passo a passo correto."
                  />
                </>
              )}
            </div>
          </section>
        ) : null}

        <section className="mt-5 rounded-3xl border border-white/10 bg-[#121212] p-5">
          <h2 className="font-semibold">Mandar para outra pessoa</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Este mesmo link pode ser enviado no WhatsApp para professores e alunos.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={compartilhar}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-zinc-200 transition active:bg-white/10"
            >
              <Share size={17} />
              Compartilhar
            </button>
            <button
              type="button"
              onClick={copiar}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-zinc-200 transition active:bg-white/10"
            >
              <Copy size={17} />
              {copiado ? "Copiado" : "Copiar link"}
            </button>
          </div>
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-zinc-600">
          A instalação precisa ser confirmada no próprio aparelho por segurança.
        </p>
      </main>
    </div>
  );
}

function Passo({ numero, Icone, titulo, descricao }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-950/50 text-red-400">
        <Icone size={19} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-600">
          Passo {numero}
        </p>
        <p className="mt-1 text-sm font-semibold text-zinc-100">{titulo}</p>
        <p className="mt-1 break-words text-xs leading-5 text-zinc-500">
          {descricao}
        </p>
      </div>
      <ArrowRight size={16} className="mt-3 shrink-0 text-zinc-700" />
    </div>
  );
}
