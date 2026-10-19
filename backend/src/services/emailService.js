import nodemailer from "nodemailer";
import env from "../config/env.js";

let transporter = null;

function obterTransporter() {
  if (!transporter && env.email.user && env.email.password) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.email.user,
        pass: env.email.password,
      },
    });
  }
  return transporter;
}

async function enviarEmail({ destinatario, assunto, texto, html }) {
  const mailTransporter = obterTransporter();

  // Modo Simulação/Dev se não houver credenciais de e-mail configuradas
  if (!mailTransporter) {
    console.log("==================================================");
    console.log("[EMAIL DEV/SIMULADO] Credenciais de e-mail não informadas.");
    console.log(`Para: ${destinatario}`);
    console.log(`Assunto: ${assunto}`);
    console.log(`Mensagem:\n${texto || html}`);
    console.log("==================================================");
    return { simulado: true };
  }

  try {
    return await mailTransporter.sendMail({
      from: `"Ideia Futura" <${env.email.user}>`,
      to: destinatario,
      subject: assunto,
      text: texto,
      html: html,
    });
  } catch (erro) {
    console.error("Falha ao enviar e-mail via SMTP:", erro.message);

    // Se estiver em ambiente local de desenvolvimento, exibe no console em vez de falhar
    if (!env.isProduction) {
      console.log("==================================================");
      console.log("[EMAIL DEV/FALLBACK] O envio falhou no SMTP, exibindo conteúdo no console:");
      console.log(`Para: ${destinatario}`);
      console.log(`Assunto: ${assunto}`);
      console.log(`Texto:\n${texto}`);
      console.log("==================================================");
      return { fallbackDev: true, erro: erro.message };
    }

    throw erro;
  }
}

async function enviarEmailRecuperacaoSenha(destinatario, nomeUsuario, linkRecuperacao) {
  const primeiroNome = nomeUsuario ? nomeUsuario.split(" ")[0] : "Usuário";

  const texto = `Olá, ${primeiroNome}!\n\n` +
    `Recebemos uma solicitação para redefinir sua senha no Ideia Futura.\n\n` +
    `Acesse o link abaixo em até 15 minutos para criar uma nova senha:\n` +
    `${linkRecuperacao}\n\n` +
    `Se você não solicitou a recuperação, pode ignorar este e-mail com segurança.\n\n` +
    `Atenciosamente,\nEquipe Ideia Futura`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: #1e3a8a; padding: 28px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
        .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; background-color: #1e3a8a; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; }
        .link-alt { font-size: 13px; color: #64748b; word-break: break-all; margin-top: 20px; }
        .footer { padding: 20px 28px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Ideia Futura</h1>
        </div>
        <div class="content">
          <p class="greeting">Olá, ${primeiroNome}!</p>
          <p class="text">Recebemos um pedido para redefinir a senha da sua conta no <strong>Ideia Futura</strong>.</p>
          <p class="text">Clique no botão abaixo para escolher uma nova senha. <strong>Este link é válido por 15 minutos</strong>:</p>
          <div class="btn-container">
            <a href="${linkRecuperacao}" class="btn" target="_blank" rel="noopener noreferrer">Redefinir Minha Senha</a>
          </div>
          <p class="text" style="font-size: 13px; color: #64748b;">
            Se o botão acima não funcionar, copie e cole o link a seguir no seu navegador:
          </p>
          <p class="link-alt"><a href="${linkRecuperacao}" style="color: #1e3a8a;">${linkRecuperacao}</a></p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p class="text" style="font-size: 13px; color: #94a3b8; margin-bottom: 0;">
            Se você não solicitou a alteração da sua senha, fique tranquilo: nenhuma alteração foi feita e você pode desconsiderar esta mensagem.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Ideia Futura. Todos os direitos reservados.
        </div>
      </div>
    </body>
    </html>
  `;

  return await enviarEmail({
    destinatario,
    assunto: "Recuperação de Senha - Ideia Futura",
    texto,
    html,
  });
}

export default {
  enviarEmail,
  enviarEmailRecuperacaoSenha,
};
