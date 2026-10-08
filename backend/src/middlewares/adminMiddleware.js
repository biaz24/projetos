function verificarAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      erro: "Usuário não autenticado",
    });
  }

  if (req.user.tipo !== "admin") {
    return res.status(403).json({
      erro: "Acesso permitido apenas para administradores",
    });
  }

  next();
}

export default verificarAdmin;
