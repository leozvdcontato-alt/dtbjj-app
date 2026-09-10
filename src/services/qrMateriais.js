import { supabase } from "@/lib/supabase";

export async function gerarMaterialQr(localId, formato) {
  const { data, error } = await supabase.functions.invoke("gerar-material-qr", {
    body: {
      local_id: localId,
      formato,
    },
  });

  if (error) {
    let mensagem = "Não foi possível gerar o material agora.";

    try {
      const detalhe = await error.context?.json?.();
      if (detalhe?.error) mensagem = detalhe.error;
    } catch {
      // mantém mensagem padrão
    }

    throw new Error(mensagem);
  }

  if (data?.error) throw new Error(data.error);
  return data;
}

export async function baixarSvgComoPng(svg, filename, largura, altura) {
  const blobSvg = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blobSvg);

  try {
    const imagem = new Image();
    imagem.decoding = "async";

    await new Promise((resolve, reject) => {
      imagem.onload = resolve;
      imagem.onerror = reject;
      imagem.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;

    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("Não foi possível preparar a imagem.");

    contexto.drawImage(imagem, 0, 0, largura, altura);

    const png = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png", 1)
    );

    if (!png) throw new Error("Não foi possível gerar o PNG.");

    const pngUrl = URL.createObjectURL(png);
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(pngUrl);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function criarUrlSvg(svg) {
  return URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
  );
}
