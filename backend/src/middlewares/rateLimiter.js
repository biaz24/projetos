import rateLimit from "express-rate-limit";

// Rate limiter para login: máximo 10 tentativas a cada 15 minutos por IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    erro: "Muitas tentativas de login. Por favor, tente novamente em 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para cadastro: máximo 5 cadastros por hora por IP
export const cadastroLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    erro: "Muitas tentativas de cadastro. Por favor, tente novamente em 1 hora.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
