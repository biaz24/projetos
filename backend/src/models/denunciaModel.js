import connection from "../database/connection.js";
async function criarDenuncia(ideiaId, usuarioId, motivo, descricao) {
  const [resultado] = await connection.query(
    `INSERT INTO DENUNCIAS
      (IDEIAS_ID, TITULO_IDEIA, USUARIOS_ID, MOTIVO, DESCRICAO)
     SELECT ID, TITULO, ?, ?, ?
     FROM IDEIAS
     WHERE ID = ?`,
    [usuarioId, motivo, descricao, ideiaId],
  );

  return resultado;
}
async function listarDenuncias() {
  const [denuncias] = await connection.query(
    `SELECT
      d.ID,
      d.IDEIAS_ID,
      d.USUARIOS_ID,
      d.MOTIVO,
      d.DESCRICAO,
      d.STATUS,
      d.CREATED_AT,
      d.RESOLVIDA_AT,
      COALESCE(d.TITULO_IDEIA, i.TITULO) AS IDEIA_TITULO,
      u.NOME AS USUARIO_NOME,
      autor.NOME AS AUTOR_NOME
     FROM DENUNCIAS d
     LEFT JOIN IDEIAS i ON d.IDEIAS_ID = i.ID
     INNER JOIN USUARIOS u ON d.USUARIOS_ID = u.ID
     LEFT JOIN USUARIOS autor ON i.USUARIOS_ID = autor.ID
     ORDER BY d.CREATED_AT DESC`,
  );

  return denuncias;
}

async function buscarDenunciaPorId(id) {
  const [denuncias] = await connection.query(
    `SELECT
      d.ID,
      d.IDEIAS_ID,
      d.USUARIOS_ID,
      d.MOTIVO,
      d.DESCRICAO,
      d.STATUS,
      d.CREATED_AT,
      d.RESOLVIDA_AT,
      COALESCE(d.TITULO_IDEIA, i.TITULO) AS IDEIA_TITULO,
      u.NOME AS USUARIO_NOME,
      autor.NOME AS AUTOR_NOME
     FROM DENUNCIAS d
     LEFT JOIN IDEIAS i ON d.IDEIAS_ID = i.ID
     INNER JOIN USUARIOS u ON d.USUARIOS_ID = u.ID
     LEFT JOIN USUARIOS autor ON i.USUARIOS_ID = autor.ID
     WHERE d.ID = ?`,
    [id],
  );

  return denuncias[0] || null;
}

async function atualizarStatus(id, status) {
  const [resultado] = await connection.query(
    `UPDATE DENUNCIAS
     SET STATUS = ?,
         RESOLVIDA_AT = CASE
           WHEN ? = 'Resolvida' THEN CURRENT_TIMESTAMP
           ELSE NULL
         END
     WHERE ID = ?`,
    [status, status, id],
  );

  return resultado;
}
async function buscarAutorDaIdeia(ideiaId) {
  const [ideias] = await connection.query(
    `SELECT USUARIOS_ID
     FROM IDEIAS
     WHERE ID = ?`,
    [ideiaId],
  );

  return ideias[0];
}

async function salvarRascunho(
  denunciaId,
  adminId,
  resultado,
  medidaAplicada,
  justificativa,
) {
  const [resposta] = await connection.query(
    `INSERT INTO RASCUNHOS_DENUNCIAS
      (DENUNCIA_ID, ADMIN_ID, RESULTADO, MEDIDA_APLICADA, JUSTIFICATIVA)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       RESULTADO = VALUES(RESULTADO),
       MEDIDA_APLICADA = VALUES(MEDIDA_APLICADA),
       JUSTIFICATIVA = VALUES(JUSTIFICATIVA)`,
    [denunciaId, adminId, resultado, medidaAplicada, justificativa],
  );

  return resposta;
}

async function buscarRascunho(denunciaId, adminId) {
  const [rascunhos] = await connection.query(
    `SELECT
       ID,
       DENUNCIA_ID,
       ADMIN_ID,
       RESULTADO,
       MEDIDA_APLICADA,
       JUSTIFICATIVA,
       UPDATED_AT
     FROM RASCUNHOS_DENUNCIAS
     WHERE DENUNCIA_ID = ? AND ADMIN_ID = ?`,
    [denunciaId, adminId],
  );

  return rascunhos[0] || null;
}

async function concluirAnalise(
  denunciaId,
  adminId,
  resultado,
  medidaAplicada,
  justificativa,
) {
  const db = await connection.getConnection();
  let transacaoIniciada = false;

  try {
    await db.beginTransaction();
    transacaoIniciada = true;

    // Busca a denúncia, a ideia e o autor da ideia

    const [denuncias] = await db.query(
      `SELECT
     d.ID,
     d.IDEIAS_ID,
     d.USUARIOS_ID,
     d.STATUS,
     i.USUARIOS_ID AS AUTOR_ID
   FROM DENUNCIAS d
   LEFT JOIN IDEIAS i ON d.IDEIAS_ID = i.ID
   WHERE d.ID = ?
   FOR UPDATE`,
      [denunciaId],
    );

    if (denuncias.length === 0) {
      throw new Error("Denúncia não encontrada.");
    }

    const denuncia = denuncias[0];

    if (denuncia.STATUS === "Resolvida") {
      throw new Error("Esta denúncia já foi resolvida.");
    }
    if (
      !denuncia.IDEIAS_ID &&
      (medidaAplicada === "Ocultar ideia" ||
        medidaAplicada === "Excluir ideia" ||
        medidaAplicada === "Aviso")
    ) {
      throw new Error(
        "Não é possível aplicar essa medida porque a ideia não existe mais.",
      );
    }

    // Guarda os arquivos antes de excluir a ideia
    let anexos = [];

    if (medidaAplicada === "Excluir ideia") {
      const [arquivos] = await db.query(
        `SELECT
           ID,
           CAMINHO
         FROM ANEXOS
         WHERE IDEIAS_ID = ?`,
        [denuncia.IDEIAS_ID],
      );

      anexos = arquivos;
    }

    // Registra o resultado da análise
    const [resposta] = await db.query(
      `UPDATE DENUNCIAS
       SET RESULTADO = ?,
           MEDIDA_APLICADA = ?,
           JUSTIFICATIVA = ?,
           ADMIN_ID = ?,
           STATUS = 'Resolvida',
           RESOLVIDA_AT = CURRENT_TIMESTAMP
       WHERE ID = ?`,
      [resultado, medidaAplicada, justificativa, adminId, denunciaId],
    );

    // Apenas oculta a ideia
    if (medidaAplicada === "Ocultar ideia") {
      await db.query(
        `UPDATE IDEIAS
         SET VISIBILIDADE = 'Oculta'
         WHERE ID = ?`,
        [denuncia.IDEIAS_ID],
      );
    }

    // Envia uma advertência para o AUTOR da ideia
    if (medidaAplicada === "Aviso") {
      await db.query(
        `INSERT INTO ADVERTENCIAS
          (USUARIOS_ID, DENUNCIA_ID, ADMIN_ID, MOTIVO)
         VALUES (?, ?, ?, ?)`,
        [denuncia.AUTOR_ID, denunciaId, adminId, justificativa],
      );
    }

    // Exclui a ideia
    // As tabelas relacionadas serão excluídas pelo ON DELETE CASCADE
    if (medidaAplicada === "Excluir ideia") {
      const [resultadoExclusao] = await db.query(
        `DELETE FROM IDEIAS
     WHERE ID = ?`,
        [denuncia.IDEIAS_ID],
      );

      if (resultadoExclusao.affectedRows === 0) {
        throw new Error("Não foi possível excluir a ideia.");
      }
    }

    await db.commit();

    return {
      resposta,
      anexos,
    };
  } catch (erro) {
    if (transacaoIniciada) {
      await db.rollback();
    }

    throw erro;
  } finally {
    db.release();
  }
}

export default {
  criarDenuncia,
  listarDenuncias,
  buscarDenunciaPorId,
  atualizarStatus,
  buscarAutorDaIdeia,
  buscarRascunho,
  salvarRascunho,
  concluirAnalise,
};
