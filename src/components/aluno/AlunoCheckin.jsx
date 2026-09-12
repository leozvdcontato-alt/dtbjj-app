import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Flashlight,
  QrCode,
  RotateCcw,
  X,
  XCircle,
} from "lucide-react";
import QrScanner from "@/vendor/qr-scanner/qr-scanner.min.js";
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
  const [temFlash, setTemFlash] = useState(false);
  const [flashLigado, setFlashLigado] = useState(false);

  const pararCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (!scanner) return;

    try {
      await scanner.stop();
    } catch {
      // scanner já pode estar parado
    }

    scanner.destroy();
    setTemFlash(false);
    setFlashLigado(false);
  }, []);

  const concluir = useCallback(
    async (valor) => {
      const token = extrairToken(valor);

      if (!token || processandoRef.current) return;

      processandoRef.current = true;
      await pararCamera();

      setEstado("processando");
      setMensagem("");
      setDetalhe("");
      setErroCamera("");

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
    },
    [onTokenConsumido, pararCamera]
  );

  const iniciarCamera = useCallback(async () => {
    setErroCamera("");
    setMensagem("");
    setDetalhe("");

    if (!videoRef.current) {
      setErroCamera("Não foi possível iniciar o leitor. Tente novamente.");
      return;
    }

    try {
      await pararCamera();

      const scanner = new QrScanner(
        videoRef.current,
        (resultado) => {
          const valor =
            typeof resultado === "string" ? resultado : resultado?.data;

          if (valor) concluir(valor);
        },
        {
          preferredCamera: "environment",
          returnDetailedScanResult: true,
          maxScansPerSecond: 12,
          highlightScanRegion: false,
          highlightCodeOutline: false,
          calculateScanRegion(video) {
            const tamanho = Math.round(
              Math.min(video.videoWidth, video.videoHeight) * 0.68
            );

            return {
              x: Math.round((video.videoWidth - tamanho) / 2),
              y: Math.round((video.videoHeight - tamanho) / 2),
              width: tamanho,
              height: tamanho,
              downScaledWidth: 420,
              downScaledHeight: 420,
            };
          },
        }
      );

      scannerRef.current = scanner;
      setEstado("camera");
      await scanner.start();

      try {
        const disponivel = await scanner.hasFlash();
        setTemFlash(disponivel);
      } catch {
        setTemFlash(false);
      }
    } catch (error) {
      console.error("Erro ao abrir câmera:", error);
      await pararCamera();
      setEstado("inicio");

      const mensagem = String(error?.message || error || "").toLowerCase();

      if (mensagem.includes("permission") || mensagem.includes("notallowed")) {
        setErroCamera(
          "A câmera está bloqueada. Libere a permissão da câmera para o DTBJJ nas configurações do navegador."
        );
      } else {
        setErroCamera(
          "Não foi possível acessar a câmera. Verifique a permissão e tente novamente."
        );
      }
    }
  }, [concluir, pararCamera]);

  const alternarFlash = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner || !temFlash) return;

    try {
      await scanner.toggleFlash();
      setFlashLigado(scanner.isFlashOn());
    } catch {
      setTemFlash(false);
    }
  }, [temFlash]);

  useEffect(() => {
    if (!tokenInicial) return undefined;

    Promise.resolve().then(() => concluir(tokenInicial));
    return undefined;
  }, [tokenInicial, concluir]);

  useEffect(() => () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    scanner?.destroy();
  }, []);

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
        <section className="-mx-4 -mt-5 overflow-hidden bg-black">
          <div className="relative min-h-[calc(100dvh-7rem)] bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/20" />

            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-5 pt-[max(20px,env(safe-area-inset-top))]">
              <button
                type="button"
                onClick={async () => {
                  await pararCamera();
                  setEstado("inicio");
                }}
                aria-label="Fechar leitor"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md"
              >
                <X size={22} />
              </button>

              {temFlash ? (
                <button
                  type="button"
                  onClick={alternarFlash}
                  aria-label={flashLigado ? "Desligar flash" : "Ligar flash"}
                  className={
                    "flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md " +
                    (flashLigado
                      ? "bg-white text-black"
                      : "bg-black/55 text-white")
                  }
                >
                  <Flashlight size={21} />
                </button>
              ) : (
                <div className="h-11 w-11" />
              )}
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
              <div className="relative aspect-square w-full max-w-[310px]">
                <div className="absolute inset-0 rounded-[2rem] border border-white/35" />

                <span className="absolute left-0 top-0 h-14 w-14 rounded-tl-[2rem] border-l-4 border-t-4 border-red-600" />
                <span className="absolute right-0 top-0 h-14 w-14 rounded-tr-[2rem] border-r-4 border-t-4 border-red-600" />
                <span className="absolute bottom-0 left-0 h-14 w-14 rounded-bl-[2rem] border-b-4 border-l-4 border-red-600" />
                <span className="absolute bottom-0 right-0 h-14 w-14 rounded-br-[2rem] border-b-4 border-r-4 border-red-600" />

                <div className="absolute left-5 right-5 top-1/2 h-px animate-pulse bg-red-500/80 shadow-[0_0_14px_rgba(239,68,68,0.8)]" />
              </div>

              <div className="mt-8 rounded-2xl bg-black/55 px-5 py-3 text-center backdrop-blur-md">
                <p className="text-sm font-semibold text-white">
                  Aponte para o QR Code
                </p>
                <p className="mt-1 text-xs text-white/65">
                  Mantenha o código dentro do quadrado
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : estado === "processando" ? (
        <section className="rounded-3xl border border-white/10 bg-[#121212] p-8 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-red-600" />
          <p className="mt-4 text-sm text-zinc-400">
            Validando sua aula...
          </p>
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
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-red-700 font-semibold text-white transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <QrCode size={21} />
            Ler QR Code
          </button>

          {erroCamera ? (
            <p className="mt-4 rounded-2xl border border-amber-900/30 bg-amber-950/20 p-4 text-sm leading-6 text-amber-300">
              {erroCamera}
            </p>
          ) : null}

          <p className="mt-4 text-center text-xs leading-5 text-zinc-600">
            A câmera abre dentro do app. No iPhone e Android, permita o acesso
            quando o sistema solicitar.
          </p>
        </section>
      )}
    </div>
  );
}
