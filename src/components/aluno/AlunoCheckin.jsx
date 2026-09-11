import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  QrCode,
  RotateCcw,
  X,
  XCircle,
} from "lucide-react";
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

export default function AlunoCheckin({ tokenInicial = "", onTokenConsumido }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const processandoRef = useRef(false);

  const [estado, setEstado] = useState(tokenInicial ? "processando" : "inicio");
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
      const sucesso = ["registrado", "ja_registrado"].includes(resultado?.status);

      setEstado(sucesso ? "sucesso" : "erro");
      setMensagem(resultado?.mensagem || "Não foi possível realizar o check-in.");
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

    if (!navigator.mediaDevices?.getUserMedia) {
      setErroCamera(
        "A câmera não está disponível neste navegador. Verifique se o app está aberto em uma conexão segura."
      );
      return;
    }

    setEstado("camera");

    await new Promise((resolve) => setTimeout(resolve, 0));

    if (!videoRef.current) {
      setEstado("inicio");
      return;
    }

    try {
      encerrarScanner();

      const scanner = new QrScanner(
        videoRef.current,
        (resultado) => {
          const valor =
            typeof resultado === "string" ? resultado : resultado?.data;

          if (!valor) return;

          const token = extrairToken(valor);
          concluir(token);
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
      setEstado("inicio");

      const nome = error?.name || "";
      const mensagem =
        nome === "NotAllowedError"
          ? "Permita o acesso à câmera nas configurações do navegador."
          : nome === "NotFoundError"
            ? "Nenhuma câmera foi encontrada neste aparelho."
            : "Não foi possível abrir a câmera. Tente novamente.";

      setErroCamera(mensagem);
    }
  }

  function cancelarCamera() {
    encerrarScanner();
    setEstado("inicio");
    setErroCamera("");
  }

  useEffect(() => {
    if (!tokenInicial) return undefined;

    Promise.resolve().then(() => concluir(tokenInicial));
    return undefined;
  }, [tokenInicial]);

  useEffect(() => () => encerrarScanner(), []);

  const sucesso = estado === "sucesso";

  return (
    <div className="space-y-5">
      {estado !== "camera" ? (
        <header className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-700 text-white shadow-lg shadow-red-950/30">
            <QrCode size={30} />
          </div>

          <h2 className="mt-4 text-2xl font-bold">Check-in</h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
            Escaneie o QR Code do local. O check-in abre 15 minutos antes da
            aula e fecha 1 hora após o início.
          </p>
        </header>
      ) : null}

      {estado === "camera" ? (
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
                onClick={cancelarCamera}
                aria-label="Fechar câmera"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md"
              >
                <X size={22} />
              </button>

              <div className="rounded-full bg-black/45 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                Ler QR Code
              </div>

              <div className="h-11 w-11" aria-hidden="true" />
            </div>

            <div className="absolute inset-x-0 bottom-0 px-6 pb-[max(28px,env(safe-area-inset-bottom))] text-center">
              <p className="text-lg font-semibold text-white">
                Posicione o QR dentro do quadrado
              </p>
              <p className="mt-2 text-sm text-white/65">
                A leitura acontece automaticamente.
              </p>
            </div>
          </div>
        </section>
      ) : estado === "processando" ? (
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
              setEstado("inicio");
              setMensagem("");
              setDetalhe("");
            }}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white/10 text-sm font-semibold text-white"
          >
            <RotateCcw size={17} />
            Ler outro QR
          </button>
        </section>
      ) : (
        <section className="rounded-3xl border border-white/10 bg-[#121212] p-5">
          <button
            type="button"
            onClick={iniciarCamera}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-red-700 font-semibold text-white transition hover:bg-red-600"
          >
            <Camera size={21} />
            Abrir câmera
          </button>

          {erroCamera ? (
            <p className="mt-4 rounded-2xl border border-amber-900/30 bg-amber-950/20 p-4 text-sm leading-6 text-amber-300">
              {erroCamera}
            </p>
          ) : null}

          <p className="mt-4 text-center text-xs leading-5 text-zinc-600">
            Funciona no PWA do iPhone e Android. Você também pode escanear o QR
            pela câmera normal do celular.
          </p>
        </section>
      )}
    </div>
  );
}
