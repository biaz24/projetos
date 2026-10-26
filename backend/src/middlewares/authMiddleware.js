import { verifyAccessToken } from "../config/token.js";

function autenticarToken(req, res, next) {
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

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (erro) {
    return res.status(401).json({
      erro: "Token inválido ou expirado",
    });
  }
}

export default autenticarToken;
