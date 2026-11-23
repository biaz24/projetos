import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Em desenvolvimento (seu computador) usamos valores padrão para facilitar.
// Em produção (site publicado) NÃO existe padrão: se faltar, o servidor não inicia.
// Isso evita publicar o site por engano com senha de teste.
function lerVariavel(nome, padraoDeDesenvolvimento) {
  const valor = process.env[nome];

  if (valor !== undefined && valor.trim() !== "") {
    return valor;
  }

  if (isProduction) {
    throw new Error(
      `A variável de ambiente ${nome} é obrigatória em produção. Configure-a no servidor de hospedagem.`,
    );
  }

  return padraoDeDesenvolvimento;
}

const dbPassword = lerVariavel("DB_PASSWORD", "1234");
const jwtAccessSecret = lerVariavel("JWT_ACCESS_SECRET", "access_secret_dev");
const jwtRefreshSecret = lerVariavel("JWT_REFRESH_SECRET", "refresh_secret_dev");
const frontendUrl = lerVariavel("FRONTEND_URL", "http://localhost:5173").replace(
  /\/+$/,
  "",
);

if (isProduction) {
  const senhasFracas = ["1234", "123456", "12345678", "root", "admin", "password", "senha"];
  if (senhasFracas.includes(dbPassword.toLowerCase())) {
    throw new Error("DB_PASSWORD é uma senha fraca demais para produção.");
  }

  // Segredos copiados do .env.example ou de teste são públicos e não servem.
  const pareceSegredoDeExemplo = /(_dev|troque|gere_|exemplo|example|changeme)/i;
  if (
    pareceSegredoDeExemplo.test(jwtAccessSecret) ||
    pareceSegredoDeExemplo.test(jwtRefreshSecret)
  ) {
    throw new Error(
      "Os segredos JWT parecem ser de exemplo. Gere valores aleatórios novos (veja o .env.example).",
    );
  }

  // Cookies com a opção "secure" só funcionam em HTTPS.
  if (!frontendUrl.startsWith("https://")) {
    throw new Error(
      "FRONTEND_URL precisa começar com https:// em produção (o login por cookie exige HTTPS).",
    );
  }
}

// Quantos "intermediários" (proxy/balanceador da hospedagem) existem entre o usuário e o servidor.
// Necessário para o limite de requisições enxergar o IP verdadeiro do usuário.
// Padrão: 1 em produção (a maioria das hospedagens), 0 no computador local.
const trustProxyBruto = Number.parseInt(process.env.TRUST_PROXY ?? "", 10);
const trustProxy = Number.isInteger(trustProxyBruto) && trustProxyBruto >= 0
  ? trustProxyBruto
  : isProduction
    ? 1
    : 0;

const env = {
  port: process.env.PORT || 3000,

  db: {
    host: lerVariavel("DB_HOST", "localhost"),
    user: lerVariavel("DB_USER", "root"),
    password: dbPassword,
    database: lerVariavel("DB_NAME", "projetos"),
    // Bancos hospedados na nuvem normalmente exigem conexão criptografada.
    // Para ligar: DB_SSL=true
    ...(process.env.DB_SSL === "true" ? { ssl: { rejectUnauthorized: true } } : {}),
  },

  jwt: {
    accessSecret: jwtAccessSecret,
    refreshSecret: jwtRefreshSecret,
  },

  email: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
  },

  frontendUrl,
  trustProxy,
  isProduction,
};

export default env;
