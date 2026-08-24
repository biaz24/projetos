import { verifyAccessToken } from "../config/token.js";

function autenticarToken(req, res, next) {
  // primeiro tenta pegar o token do cookie (é o caminho principal agora)
  let token = req.cookies?.accessToken;

  // se não veio por cookie, aceita também via header Authorization (útil pra testar no Postman/Insomnia)
  if (!token && req.headers.authorization) {
    const partes = req.headers.authorization.split(" ");
    token = partes[1];
  }

  if (!token) {
    return res.status(401).json({
      erro: "Token não informado",
    });
  }

  try {
    const usuario = verifyAccessToken(token);
    req.user = usuario;
    next();
  } catch (erro) {
    return res.status(401).json({
      erro: "Token inválido ou expirado",
    });
  }
}

export default autenticarToken;
