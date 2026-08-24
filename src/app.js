import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

//ta importando todas as rotas do usuario
import usuarioRoutes from "./routes/usuarioRoutes.js";
import ideiaRoutes from "./routes/ideiaRoutes.js";
import comentarioRoutes from "./routes/comentarioRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// libera o front-end (rodando em outra porta) a mandar cookies nas requisições
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);

//esta recebendo o json
app.use(express.json());
app.use(cookieParser());

//fala para o express q todas as rotas que esta ai dentro passa a existir
app.use(usuarioRoutes);
app.use(ideiaRoutes);
app.use(comentarioRoutes);
app.use(authRoutes);

export default app;
