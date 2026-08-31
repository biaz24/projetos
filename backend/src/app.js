import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import usuarioRoutes from "./routes/usuarioRoutes.js";
import ideiaRoutes from "./routes/ideiaRoutes.js";
import comentarioRoutes from "./routes/comentarioRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import rascunhoRoutes from "./routes/rascunhoRoutes.js";
import favoritoRoutes from "./routes/favoritoRoutes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Não permitido pelo CORS"));
      }
    },
    credentials: true,
  }),
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

app.use(express.json());
app.use(cookieParser());

app.use(usuarioRoutes);
app.use(ideiaRoutes);
app.use(comentarioRoutes);
app.use(authRoutes);
app.use(rascunhoRoutes);
app.use(favoritoRoutes);

app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

app.use((err, req, res, next) => {
  console.error("Erro interno:", err);
  res.status(500).json({ erro: "Erro interno do servidor" });
});

export default app;
