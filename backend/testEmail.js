import emailService from "./src/services/emailService.js";
import env from "./src/config/env.js";

console.log("EMAIL_USER configurado:", Boolean(env.email.user));
console.log("EMAIL_PASSWORD configurada:", Boolean(env.email.password));

try {
  await emailService.enviarEmailRecuperacaoSenha(
    "teste@exemplo.com",
    "Usuário Teste",
    "http://localhost:5173/redefinir-senha?token=exemplo123456",
  );

  console.log("Teste de e-mail concluído com sucesso!");
} catch (erro) {
  console.error("Erro no teste de e-mail:", erro.message);
}
