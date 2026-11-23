// Textos das notificações (o que aparece no sininho).
// Cada função devolve { tipo, titulo, mensagem } pronto para gravar na tabela NOTIFICACOES.
// Para criar um novo tipo de notificação no futuro: adicione o tipo aqui e uma função abaixo.

export const TIPOS_NOTIFICACAO = {
  ADVERTENCIA: "advertencia",
  IDEIA_OCULTADA: "ideia_ocultada",
  IDEIA_REMOVIDA: "ideia_removida",
  IDEIA_APROVADA: "ideia_aprovada",
  IDEIA_REJEITADA: "ideia_rejeitada",
  CONTATO_PEDIDO: "contato_pedido",
  CONTATO_ACEITO: "contato_aceito",
  CONTATO_RECUSADO: "contato_recusado",
  CONTATO_ENCERRADO: "contato_encerrado",
};

const MAX_TITULO_DA_IDEIA = 80;
const MAX_MOTIVO = 500;

// Deixa o texto em uma linha só e corta se for grande demais.
function resumir(texto, max) {
  const limpo = String(texto ?? "")
    .replace(/\s+/g, " ")
    .trim();

  return limpo.length > max ? `${limpo.slice(0, max - 1).trimEnd()}…` : limpo;
}

function nomeDaIdeia(titulo) {
  const resumido = resumir(titulo, MAX_TITULO_DA_IDEIA);
  return resumido ? `"${resumido}"` : '"(sem título)"';
}

function montarMensagem(partes) {
  return partes.filter(Boolean).join(" ");
}

function textoDoMotivo(motivo) {
  const resumido = resumir(motivo, MAX_MOTIVO);
  return resumido ? `Motivo: ${resumido}` : null;
}

export function notificacaoAdvertencia(tituloIdeia, justificativa) {
  return {
    tipo: TIPOS_NOTIFICACAO.ADVERTENCIA,
    titulo: "Você recebeu uma advertência",
    mensagem: montarMensagem([
      `Uma denúncia sobre a sua ideia ${nomeDaIdeia(tituloIdeia)} foi analisada e a moderação aplicou uma advertência.`,
      textoDoMotivo(justificativa),
    ]),
  };
}

export function notificacaoIdeiaOcultada(tituloIdeia, justificativa) {
  return {
    tipo: TIPOS_NOTIFICACAO.IDEIA_OCULTADA,
    titulo: "Sua ideia precisa de ajustes",
    mensagem: montarMensagem([
      `A ideia ${nomeDaIdeia(tituloIdeia)} foi ocultada pela moderação.`,
      textoDoMotivo(justificativa),
      "Revise o conteúdo para adequá-lo às regras da plataforma e reenvie para revisão.",
    ]),
  };
}

export function notificacaoIdeiaRemovida(tituloIdeia, justificativa) {
  return {
    tipo: TIPOS_NOTIFICACAO.IDEIA_REMOVIDA,
    titulo: "Sua ideia foi removida",
    mensagem: montarMensagem([
      `A ideia ${nomeDaIdeia(tituloIdeia)} foi removida da plataforma pela moderação.`,
      textoDoMotivo(justificativa),
    ]),
  };
}

export function notificacaoIdeiaAprovada(tituloIdeia) {
  return {
    tipo: TIPOS_NOTIFICACAO.IDEIA_APROVADA,
    titulo: "Sua ideia voltou ao ar",
    mensagem: `A ideia ${nomeDaIdeia(tituloIdeia)} foi aprovada pela moderação e está pública novamente.`,
  };
}

export function notificacaoIdeiaRejeitada(tituloIdeia, motivo) {
  return {
    tipo: TIPOS_NOTIFICACAO.IDEIA_REJEITADA,
    titulo: "Sua ideia continua oculta",
    mensagem: montarMensagem([
      `A moderação analisou a ideia ${nomeDaIdeia(tituloIdeia)} e ela continua oculta.`,
      textoDoMotivo(motivo),
      "Você pode ajustar o conteúdo e reenviar para revisão novamente.",
    ]),
  };
}

// ---- Contato entre o interessado e o autor da ideia ----

// Vai para o AUTOR: alguém quer adotar/colaborar.
export function notificacaoContatoPedido(nomeInteressado, tituloIdeia) {
  return {
    tipo: TIPOS_NOTIFICACAO.CONTATO_PEDIDO,
    titulo: "Alguém quer adotar sua ideia",
    mensagem: `${resumir(nomeInteressado, 60) || "Um usuário"} demonstrou interesse na sua ideia ${nomeDaIdeia(tituloIdeia)}. Abra Conversas para aceitar ou recusar.`,
  };
}

// Vai para o INTERESSADO. Não cita o nome do autor (a ideia pode ser anônima).
export function notificacaoContatoAceito(tituloIdeia) {
  return {
    tipo: TIPOS_NOTIFICACAO.CONTATO_ACEITO,
    titulo: "Seu pedido foi aceito",
    mensagem: `O autor da ideia ${nomeDaIdeia(tituloIdeia)} aceitou conversar com você. Abra Conversas para continuar.`,
  };
}

export function notificacaoContatoRecusado(tituloIdeia) {
  return {
    tipo: TIPOS_NOTIFICACAO.CONTATO_RECUSADO,
    titulo: "Seu pedido não foi aceito",
    mensagem: `O autor da ideia ${nomeDaIdeia(tituloIdeia)} não pode conversar agora. Que tal conhecer outras ideias?`,
  };
}

// quem: "participante" (a outra pessoa encerrou) ou "moderacao"
export function notificacaoContatoEncerrado(tituloIdeia, quem = "participante") {
  return {
    tipo: TIPOS_NOTIFICACAO.CONTATO_ENCERRADO,
    titulo: "Conversa encerrada",
    mensagem:
      quem === "moderacao"
        ? `A conversa sobre a ideia ${nomeDaIdeia(tituloIdeia)} foi encerrada pela moderação.`
        : `A conversa sobre a ideia ${nomeDaIdeia(tituloIdeia)} foi encerrada pela outra pessoa.`,
  };
}
