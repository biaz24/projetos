import { verifyAccessToken } from "../config/token.js";
import connection from "../database/connection.js";

async function autenticarToken(req, res, next) {
  // Caminho principal: cookie httpOnly
  let token = req.cookies?.accessToken;

  // Header Authorization só fora de produção (útil para testar no Postman/Insomnia)
  if (
    !token &&
    process.env.NODE_ENV !== "production" &&
    typeof req.headers.authorization === "string"
  ) {
    const [esquema, valor] = req.headers.authorization.split(" ");
    if (esquema === "Bearer") {
      token = valor;
    }
  }

  if (!token) {
    return res.status(401).json({
      erro: "Token não informado",
    });
  }

  let dados;
  try {
    dados = verifyAccessToken(token);
  } catch (erro) {
    return res.status(401).json({
      erro: "Token inválido ou expirado",
    });
  }

  // O token vale por alguns minutos. Esta conferência faz um banimento (ou a exclusão
  // da conta) valer na hora, sem esperar o token vencer. Também usa o tipo ATUAL do banco.
  try {
    const [linhas] = await connection.query(
      "SELECT TIPO, BANIDO_EM, SENHA_ALTERADA_TS FROM USUARIOS WHERE ID = ?",
      [dados.id],
    );

    if (linhas.length === 0) {
      return res.status(401).json({ erro: "Token inválido ou expirado" });
    }

    if (linhas[0].BANIDO_EM) {
      return res.status(403).json({
        erro: "Esta conta foi suspensa pela moderação.",
      });
    }

    // Senha trocada depois da emissão deste token: o token não vale mais
    // (é assim que "trocar a senha" derruba quem estava com a conta aberta em outro lugar).
    const trocaTs = Number(linhas[0].SENHA_ALTERADA_TS);
    if (trocaTs && Number(dados.iat) < trocaTs) {
      return res.status(401).json({ erro: "Token inválido ou expirado" });
    }

    req.user = { ...dados, tipo: linhas[0].TIPO };
    return next();
  } catch (erro) {
    console.error("Erro ao conferir o usuário do token:", erro);
    return res.status(500).json({ erro: "Erro interno do servidor" });
  }
}

export default autenticarToken;
