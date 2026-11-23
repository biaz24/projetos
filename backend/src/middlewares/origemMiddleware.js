// Defesa extra contra CSRF (outro site fazendo o navegador do usuário agir sem ele saber).
// Pedidos que alteram dados e que vêm de uma página de outro endereço são recusados.
// Pedidos sem o cabeçalho "Origin" (Postman, servidor) não vêm de um navegador, então passam.
const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

export function exigirOrigemPermitida(origensPermitidas) {
  return (req, res, next) => {
    if (METODOS_SEGUROS.has(req.method)) return next();

    const origem = req.headers.origin;

    if (origem && !origensPermitidas.has(origem)) {
      return res.status(403).json({ erro: "Origem não permitida" });
    }

    return next();
  };
}

// Respostas da API nunca devem ficar guardadas em cache (têm dados pessoais).
export function semCache(req, res, next) {
  if (!res.getHeader("Cache-Control")) {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
}
