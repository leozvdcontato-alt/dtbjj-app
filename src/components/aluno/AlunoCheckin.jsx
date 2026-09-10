import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, QrCode, XCircle } from "lucide-react";
import { registrarCheckin } from "@/services/checkin";

export default function AlunoCheckin({ tokenInicial = "", onTokenConsumido }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const processandoRef = useRef(false);

  const [estado, setEstado] = useState(tokenInicial ? "processando" : "inicio");
  const [mensagem, setMensagem] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [erroCamera, setErroCamera] = useState("");

  function pararCamera() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function concluir(token) {
    if (!token || processandoRef.current) return;

    processandoRef.current = true;
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
          ? resultado.turma_nome + (resultado.horario ? " • " + resultado.horario : "")
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
      setErroCamera("A câmera não está disponível neste navegador.");
      return;
    }

    if (!window.BarcodeDetector) {
      setErroCamera(
        "O leitor interno de QR não é compatível com este navegador. Use a câmera normal do celular para escanear o QR do local."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setEstado("camera");

      await new Promise((resolve) => setTimeout(resolve, 0));

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

      const ler = async () => {
        if (!videoRef.current || !streamRef.current) return;

        try {
          const codigos = await detector.detect(videoRef.current);
          const valor = codigos?.[0]?.rawValue;

          if (valor) {
            let token = valor;

            try {
              const url = new URL(valor);
              token = url.searchParams.get("checkin") || valor;
            } catch {
              token = valor;
            }

            pararCamera();
            await concluir(token);
            return;
          }
        } catch {
          // continua lendo enquanto a câmera estiver ativa
        }

        frameRef.current = requestAnimationFrame(ler);
      };

      frameRef.current = requestAnimationFrame(ler);
    } catch {
      pararCamera();
      setEstado("inicio");
      setErroCamera("Não foi possível acessar a câmera. Verifique a permissão do navegador.");
    }
  }

  useEffect(() => {
    if (!tokenInicial) return undefined;

    Promise.resolve().then(() => concluir(tokenInicial));
    return undefined;
  }, [tokenInicial]);

  useEffect(() => () => pararCamera(), []);

  const sucesso = estado === "sucesso";

  return (
    <div className="space-y-5">
      <header className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-700 text-white shadow-lg shadow-red-950/30">
          <QrCode size={30} />
        </div>
        <h2 className="mt-4 text-2xl font-bold">Check-in</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
          Escaneie o QR Code do local. O check-in abre 15 minutos antes da aula e fecha 1 hora após o início.
        </p>
      </header>

      {estado === "camera" ? (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-black">
          <video ref={videoRef} playsInline muted className="aspect-square w-full object-cover" />
          <div className="p-4">
            <button
              type="button"
              onClick={() => {
                pararCamera();
                setEstado("inicio");
              }}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-zinc-300"
            >
              Cancelar leitura
            </button>
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
          {detalhe ? <p className="mt-2 text-sm font-semibold text-white">{detalhe}</p> : null}

          <button
            type="button"
            onClick={() => {
              setEstado("inicio");
              setMensagem("");
              setDetalhe("");
            }}
            className="mt-5 h-12 w-full rounded-2xl bg-white/10 text-sm font-semibold text-white"
          >
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
            Você também pode usar a câmera normal do celular. Ao abrir o QR, o app conclui o check-in após o login.
          </p>
        </section>
      )}
    </div>
  );
}
