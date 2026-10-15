import emailService from "./src/services/emailService.js";

import env from "./src/config/env.js";

console.log("EMAIL_USER configurado:", Boolean(env.email.user));
console.log("EMAIL_PASSWORD configurada:", Boolean(env.email.password));

try {
  await emailService.enviarEmail(
    "bea.bonfimmachado@gmail.com",
    "Teste de envio de e-mail",
    "Se você recebeu esta mensagem, o envio de e-mails está funcionando!",
  );

  console.log("E-mail enviado com sucesso!");
} catch (erro) {
  console.error("Erro ao enviar e-mail:", erro.message);
}
