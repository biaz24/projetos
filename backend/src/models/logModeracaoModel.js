import connection from "../database/connection.js";

// Registro de quem fez o quê na moderação (auditoria).
// Se o registro falhar, a ação do admin continua valendo: o erro só vai para o log do servidor.
// Não tem chave estrangeira em IDEIAS/DENUNCIAS de propósito: o histórico fica mesmo se a ideia for excluída.
async function registrar(adminId, acao, { ideiaId = null, denunciaId = null, detalhe = null } = {}) {
  if (!adminId || !acao) {
    return null;
  }

  try {
    const [resultado] = await connection.query(
      `INSERT INTO LOG_MODERACAO (ADMIN_ID, ACAO, IDEIAS_ID, DENUNCIA_ID, DETALHE)
       VALUES (?, ?, ?, ?, ?)`,
      [
        adminId,
        String(acao).slice(0, 50),
        ideiaId,
        denunciaId,
        detalhe === null ? null : String(detalhe).slice(0, 1000),
      ],
    );

    return resultado;
  } catch (erro) {
    console.error("Não foi possível registrar o log de moderação:", erro.message);
    return null;
  }
}

export default { registrar };
