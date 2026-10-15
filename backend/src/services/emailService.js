import nodemailer from "nodemailer";
import env from "../config/env.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.email.user,
    pass: env.email.password,
  },
});

async function enviarEmail(destinatario, assunto, mensagem) {
  return await transporter.sendMail({
    from: env.email.user,
    to: destinatario,
    subject: assunto,
    text: mensagem,
  });
}

export default { enviarEmail };
