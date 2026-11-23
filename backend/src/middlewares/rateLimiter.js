import rateLimit from "express-rate-limit";

const base = {
  standardHeaders: true,
  legacyHeaders: false,
};

// Login: máximo 10 tentativas ERRADAS a cada 15 minutos por IP.
// Logins que deram certo não contam (evita bloquear várias pessoas na mesma rede).
export const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: {
    erro: "Muitas tentativas de login. Por favor, tente novamente em 15 minutos.",
  },
});

// A conta (e-mail) também tem limite, não só o IP: um robô que troca de IP a cada tentativa
// continua esbarrando aqui ao tentar adivinhar a senha de UMA conta.
function chaveDoEmail(req) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  return email ? `email:${email.slice(0, 254)}` : "sem-email";
}

export const loginPorEmailLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 15,
  skipSuccessfulRequests: true,
  keyGenerator: chaveDoEmail,
  message: {
    erro: "Muitas tentativas de login. Por favor, tente novamente em 15 minutos.",
  },
});

// Evita encher a caixa de e-mail de alguém com pedidos de recuperação.
export const recuperacaoPorEmailLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 3,
  keyGenerator: chaveDoEmail,
  message: {
    erro: "Muitas solicitações de recuperação de senha. Por favor, tente novamente mais tarde.",
  },
});

export const refreshLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { erro: "Muitas requisições. Aguarde alguns minutos e tente novamente." },
});

// Banir/excluir/desbanir: pede a senha do administrador, então limita tentativas.
export const penalidadeLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  },
});

// Cadastro: máximo 5 cadastros por hora por IP
export const cadastroLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: {
    erro: "Muitas tentativas de cadastro. Por favor, tente novamente em 1 hora.",
  },
});

// Recuperação de senha: máximo 5 solicitações a cada 15 minutos por IP
export const recuperacaoSenhaLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    erro: "Muitas solicitações de recuperação de senha. Por favor, tente novamente em 15 minutos.",
  },
});

// Limite geral para o site inteiro (protege contra robôs e inundação de requisições).
// O valor é alto de propósito: uma página do site faz várias chamadas à API.
export const geralLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 1500,
  message: {
    erro: "Muitas requisições. Aguarde alguns minutos e tente novamente.",
  },
});

// Limite só para quem ESCREVE (criar ideia, comentar, curtir, denunciar, enviar arquivo...).
// Protege contra spam. Se a turma toda usar a mesma rede na apresentação e
// estourar o limite, aumente o número abaixo.
const limiteDeEscritaPorIp = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: {
    erro: "Você está fazendo muitas ações em pouco tempo. Aguarde alguns minutos.",
  },
});

const METODOS_DE_LEITURA = new Set(["GET", "HEAD", "OPTIONS"]);

export function limitarEscritas(req, res, next) {
  if (METODOS_DE_LEITURA.has(req.method)) {
    return next();
  }

  return limiteDeEscritaPorIp(req, res, next);
}

// Trocar a senha pede a senha atual: limita tentativas por usuário logado (não por IP).
export const trocaSenhaLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `usuario:${req.user?.id ?? "x"}`,
  message: { erro: "Muitas tentativas de troca de senha. Tente novamente em 15 minutos." },
});

// Clicar no link do e-mail: limite por IP para ninguém ficar adivinhando links.
export const confirmarEmailLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
});

// Reenviar o e-mail de confirmação: não pode virar máquina de spam na caixa de alguém.
export const reenvioConfirmacaoLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { erro: "Muitos pedidos de reenvio. Tente novamente mais tarde." },
});

export const reenvioPorEmailLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 3,
  keyGenerator: chaveDoEmail,
  message: { erro: "Muitos pedidos de reenvio para este e-mail. Tente novamente mais tarde." },
});

