import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import env from "./config/env.js";
import { pastaBackend } from "./config/paths.js";
import autenticarToken from "./middlewares/authMiddleware.js";
import { geralLimiter, limitarEscritas } from "./middlewares/rateLimiter.js";
import { exigirOrigemPermitida, semCache } from "./middlewares/origemMiddleware.js";
import { entregarArquivo } from "./middlewares/arquivosProtegidos.js";

import usuarioRoutes from "./routes/usuarioRoutes.js";
import ideiaRoutes from "./routes/ideiaRoutes.js";
import comentarioRoutes from "./routes/comentarioRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import rascunhoRoutes from "./routes/rascunhoRoutes.js";
import favoritoRoutes from "./routes/favoritoRoutes.js";
import curtidaRoutes from "./routes/curtidaRoutes.js";
import anexoRoutes from "./routes/anexoRoutes.js";
import denunciaRoutes from "./routes/denunciaRoutes.js";
import notificacaoRoutes from "./routes/notificacaoRoutes.js";
import contatoRoutes from "./routes/contatoRoutes.js";
import moderacaoUsuarioRoutes from "./routes/moderacaoUsuarioRoutes.js";
import recuperacaoSenhaRoutes from "./routes/recuperacaoSenhaRoutes.js";

const app = express();

// Não revela que o servidor usa Express.
app.disable("x-powered-by");

// Quando o site está publicado, existe um intermediário (proxy) da hospedagem na frente do servidor.
// Sem isso, o limite de requisições enxergaria o IP da hospedagem em vez do IP do usuário.
if (env.trustProxy > 0) {
  app.set("trust proxy", env.trustProxy);
}

// Cabeçalhos de segurança (HSTS, nosniff, proteção contra clickjacking etc.).
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
  }),
);

// CORS: só o site (frontend) autorizado pode chamar a API pelo navegador.
// Em produção vale apenas o endereço configurado em FRONTEND_URL.
const origensPermitidas = new Set([env.frontendUrl]);

if (!env.isProduction) {
  // Só em desenvolvimento: o Vite usa a porta 5173 e, se ela estiver ocupada (por exemplo,
  // com outra cópia do projeto aberta), pula para 5174, 5175... Liberamos 5173 a 5180.
  const portasDoSite = [3000, 5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180];
  portasDoSite.forEach((porta) => {
    origensPermitidas.add(`http://localhost:${porta}`);
    origensPermitidas.add(`http://127.0.0.1:${porta}`);
  });
}

app.use(
  cors({
    origin(origem, callback) {
      // Sem "origem" = chamada que não veio de uma página de outro site (Postman, mesma origem...).
      if (!origem || origensPermitidas.has(origem)) {
        return callback(null, true);
      }

      // Origem não autorizada: responde sem liberar o CORS (o navegador bloqueia).
      return callback(null, false);
    },
    credentials: true,
  }),
);

app.use(exigirOrigemPermitida(origensPermitidas));
app.use(geralLimiter);
app.use(limitarEscritas);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Arquivos enviados (anexos): só quem está logado E pode ver a ideia dona do arquivo abre.
app.get("/uploads/:arquivo", autenticarToken, entregarArquivo);

// Site publicado: o MESMO servidor entrega o frontend (pasta frontend/dist, gerada por "npm run build").
// Site e API no mesmo endereço = login por cookie seguro, sem problemas de CORS.
// Isso só liga se a pasta existir; no seu computador (npm run dev) nada muda.
const pastaSite = path.resolve(pastaBackend, "../frontend/dist");

if (fs.existsSync(path.join(pastaSite, "index.html"))) {
  app.use(
    express.static(pastaSite, {
      index: false,
      setHeaders(res, arquivo) {
        // Arquivos em /assets têm hash no nome: podem ficar guardados por muito tempo.
        res.setHeader(
          "Cache-Control",
          arquivo.includes(`${path.sep}assets${path.sep}`)
            ? "public, max-age=31536000, immutable"
            : "no-cache",
        );
      },
    }),
  );

  // Abrir/recarregar uma página do site (ex.: /admin/denuncias) entrega o React.
  // As chamadas da API (fetch) não pedem text/html, então seguem para as rotas abaixo.
  app.use((req, res, next) => {
    if (req.method === "GET" && req.headers.accept?.includes("text/html")) {
      res.setHeader("Cache-Control", "no-cache");
      return res.sendFile(path.join(pastaSite, "index.html"));
    }
    return next();
  });
}

// Tudo que vem daqui para baixo é resposta da API: não pode ficar em cache.
app.use(semCache);

app.use(usuarioRoutes);
app.use(ideiaRoutes);
app.use(comentarioRoutes);
app.use(authRoutes);
app.use(rascunhoRoutes);
app.use(favoritoRoutes);
app.use(curtidaRoutes);
app.use(anexoRoutes);
app.use(denunciaRoutes);
app.use(notificacaoRoutes);
app.use(contatoRoutes);
app.use(moderacaoUsuarioRoutes);
app.use(recuperacaoSenhaRoutes);

app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

app.use((err, req, res, next) => {
  // JSON quebrado ou grande demais enviado pelo cliente: não é erro do servidor.
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido" });
  }

  if (err?.type === "entity.too.large") {
    return res.status(413).json({ erro: "Conteúdo muito grande" });
  }

  // O detalhe do erro fica só no log do servidor, nunca na resposta.
  console.error("Erro interno:", err);
  res.status(500).json({ erro: "Erro interno do servidor" });
});

export default app;
