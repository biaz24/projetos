import env from "./config/env.js";
import app from "./app.js";

app.listen(env.port, () => {
  console.log(`Servidor rodando na porta ${env.port}`);
});

// Erros que escapam não devem derrubar o servidor em silêncio nem vazar detalhes.
process.on("unhandledRejection", (motivo) => {
  console.error("Promessa rejeitada sem tratamento:", motivo);
});

process.on("uncaughtException", (erro) => {
  console.error("Erro fatal:", erro);
  process.exit(1);
});
