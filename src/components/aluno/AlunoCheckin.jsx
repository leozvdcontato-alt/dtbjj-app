import { useEffect, useRef, useState } from "react";
import { CheckCircle2, RotateCcw, X, XCircle } from "lucide-react";
import QrScanner from "qr-scanner";
import { registrarCheckin } from "@/services/checkin";

function extrairToken(valor) {
  if (!valor) return "";

  try {
    const url = new URL(valor);
    return url.searchParams.get("checkin") || valor;
  } catch {
    return valor;
  }
}

export default function AlunoCheckin({
  tokenInicial = "",
  onTokenConsumido,
  onFechar,
}) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const processandoRef = useRef(false);

  const [estado, setEstado] = useState(
    tokenInicial ? "processando" : "camera"
  );
  const [mensagem, setMensagem] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [erroCamera, setErroCamera] = useState("");

  function encerrarScanner() {
    scannerRef.current?.stop();
    scannerRef.current?.destroy();
    scannerRef.current = null;
  }

  async function concluir(token) {
    if (!token || processandoRef.current) return;

    processandoRef.current = true;
    encerrarScanner();
    setEstado("processando");
    setMensagem("");
    setDetalhe("");

    try {
      const resultado = await registrarCheckin(token);
      const sucesso = ["registrado", "ja_registrado"].includes(
        resultado?.status
      );

      setEstado(sucesso ? "sucesso" : "erro");
      setMensagem(
        resultado?.mensagem || "Não foi possível realizar o check-in."
      );
      setDetalhe(
        resultado?.turma_nome
          ? resultado.turma_nome +
              (resultado.horario ? " • " + resultado.horario : "")
          : ""
      );

      if (sucesso) onTokenConsumido?.();
    } catch (error) {
      console.error("Erro no check-in:", error);
      setEstado("erro");
      setMensagem("Não foi possível validar o check-in agora.");
    } finally {
      processandoRef.current = false;
    }
  }

  async function iniciarCamera() {
    setErroCamera("");
    setEstado("camera");

    if (!navigator.mediaDevices?.getUserMedia) {
      setErroCamera("A câmera não está disponível neste aparelho.");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 0));

    if (!videoRef.current) return;

    try {
      encerrarScanner();

      const scanner = new QrScanner(
        videoRef.current,
        (resultado) => {
          const valor =
            typeof resultado === "string" ? resultado : resultado?.data;

          if (!valor) return;
          concluir(extrairToken(valor));
        },
        {
          preferredCamera: "environment",
          highlightScanRegion: false,
          highlightCodeOutline: false,
          returnDetailedScanResult: true,
          maxScansPerSecond: 10,
          calculateScanRegion(video) {
            const menorLado = Math.min(video.videoWidth, video.videoHeight);
            const tamanho = Math.round(menorLado * 0.68);

            return {
              x: Math.round((video.videoWidth - tamanho) / 2),
              y: Math.round((video.videoHeight - tamanho) / 2),
              width: tamanho,
              height: tamanho,
              downScaledWidth: 400,
              downScaledHeight: 400,
            };
          },
        }
      );

      scannerRef.current = scanner;
      await scanner.start();
    } catch (error) {
      encerrarScanner();

      const nome = error?.name || "";
      setErroCamera(
        nome === "NotAllowedError"
          ? "Permita o acesso à câmera para fazer o check-in."
          : nome === "NotFoundError"
            ? "Nenhuma câmera foi encontrada neste aparelho."
            : "Não foi possível abrir a câmera. Tente novamente."
      );
    }
  }

  function fecharCamera() {
    encerrarScanner();
    onFechar?.();
  }

  useEffect(() => {
    if (tokenInicial) {
      Promise.resolve().then(() => concluir(tokenInicial));
      return undefined;
    }

    const timer = setTimeout(() => iniciarCamera(), 0);
    return () => clearTimeout(timer);
    // O efeito reinicia apenas quando muda o token recebido pelo QR externo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenInicial]);

  useEffect(() => () => encerrarScanner(), []);

  const sucesso = estado === "sucesso";

  if (estado === "camera") {
    return (
      <section className="fixed inset-0 z-50 flex flex-col bg-black">
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative aspect-square w-[72vw] max-w-[340px] rounded-[32px] shadow-[0_0_0_9999px_rgba(0,0,0,0.58)]">
              <span className="absolute left-0 top-0 h-14 w-14 rounded-tl-[28px] border-l-4 border-t-4 border-red-600" />
              <span className="absolute right-0 top-0 h-14 w-14 rounded-tr-[28px] border-r-4 border-t-4 border-red-600" />
              <span className="absolute bottom-0 left-0 h-14 w-14 rounded-bl-[28px] border-b-4 border-l-4 border-red-600" />
              <span className="absolute bottom-0 right-0 h-14 w-14 rounded-br-[28px] border-b-4 border-r-4 border-red-600" />
              <div className="absolute left-5 right-5 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-red-500/80 shadow-[0_0_14px_rgba(239,68,68,0.85)]" />
            </div>
          </div>

          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pb-5 pt-[max(18px,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={fecharCamera}
              aria-label="Fechar câmera"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md"
            >
              <X size={22} />
            </button>

            <div className="rounded-full bg-black/45 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
              Check-in
            </div>

            <div className="h-11 w-11" aria-hidden="true" />
          </div>

          <div className="absolute inset-x-0 bottom-0 px-6 pb-[max(28px,env(safe-area-inset-bottom))] text-center">
            <p className="text-lg font-semibold text-white">
              Posicione o QR dentro do quadrado
            </p>
            <p className="mt-2 text-sm text-white/70">
              A leitura acontece automaticamente.
            </p>
            <p className="mt-1 text-xs text-white/50">
              Check-in disponível de 15 min antes até 60 min após o início da
              aula.
            </p>

            {erroCamera ? (
              <div className="mt-4 rounded-2xl border border-amber-500/20 bg-black/65 p-4 text-sm text-amber-300 backdrop-blur-md">
                <p>{erroCamera}</p>
                <button
                  type="button"
                  onClick={iniciarCamera}
                  className="mt-3 rounded-xl bg-white/10 px-4 py-2 font-semibold text-white"
                >
                  Tentar novamente
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {estado === "processando" ? (
        <section className="rounded-3xl border border-white/10 bg-[#121212] p-8 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-red-600" />
          <p className="mt-4 text-sm text-zinc-400">Validando sua aula...</p>
        </section>
      ) : estado === "sucesso" || estado === "erro" ? (
        <section className="rounded-3xl border border-white/10 bg-[#121212] p-6 text-center">
          {sucesso ? (
            <CheckCircle2 size={42} className="mx-auto text-emerald-400" />
          ) : (
            <XCircle size={42} className="mx-auto text-red-400" />
          )}

          <h3 className="mt-4 text-lg font-semibold">
            {sucesso ? "Presença registrada" : "Check-in não realizado"}
          </h3>

          <p className="mt-2 text-sm leading-6 text-zinc-400">{mensagem}</p>

          {detalhe ? (
            <p className="mt-2 text-sm font-semibold text-white">{detalhe}</p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setMensagem("");
              setDetalhe("");
              iniciarCamera();
            }}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white/10 text-sm font-semibold text-white"
          >
            <RotateCcw size={17} />
            Ler outro QR
          </button>
        </section>
      ) : null}
    </div>
  );
}
