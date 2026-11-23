// Descobre o tipo VERDADEIRO de um arquivo olhando os primeiros bytes dele.
// O tipo que o navegador informa ao enviar pode ser mentira; estes bytes não.
//
// Retorna "image/jpeg", "image/png", "application/pdf" ou null (tipo não permitido).
export function detectarTipoPeloConteudo(inicio) {
  if (inicio.length >= 3 && inicio[0] === 0xff && inicio[1] === 0xd8 && inicio[2] === 0xff) {
    return "image/jpeg";
  }

  const assinaturaPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (inicio.length >= 8 && inicio.subarray(0, 8).equals(assinaturaPng)) {
    return "image/png";
  }

  if (inicio.length >= 5 && inicio.subarray(0, 5).toString("latin1") === "%PDF-") {
    return "application/pdf";
  }

  return null;
}
