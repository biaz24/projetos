import connection from "../database/connection.js";
async function criarDenuncia(ideiaId, usuarioId, motivo, descricao) {
  // Busca dados completos da ideia e do autor para snapshot definitivo
  const [ideias] = await connection.query(
    `SELECT i.ID, i.TITULO, i.DESCRICAO, i.CATEGORIA, i.USUARIOS_ID, u.NOME AS AUTOR_NOME
     FROM IDEIAS i
     LEFT JOIN USUARIOS u ON i.USUARIOS_ID = u.ID
     WHERE i.ID = ?`,
    [ideiaId],
  );

  if (ideias.length === 0) {
    throw new Error("Ideia não encontrada para denúncia.");
  }

  const ideia = ideias[0];

  try {
    const [resultado] = await connection.query(
      `INSERT INTO DENUNCIAS
        (IDEIAS_ID, IDEIA_ID_ORIGINAL, TITULO_IDEIA, DESCRICAO_IDEIA, CATEGORIA_IDEIA, AUTOR_IDEIA_ID, AUTOR_IDEIA_NOME, USUARIOS_ID, MOTIVO, DESCRICAO)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ideia.ID,
        ideia.ID,
        ideia.TITULO,
        ideia.DESCRICAO,
        ideia.CATEGORIA || "Geral",
        ideia.USUARIOS_ID,
        ideia.AUTOR_NOME || "Anônimo",
        usuarioId,
        motivo,
        descricao || null,
      ],
    );
    return resultado;
  } catch (err) {
    // Fallback caso as novas colunas de histórico ainda não tenham sido migradas
    const [resultado] = await connection.query(
      `INSERT INTO DENUNCIAS
        (IDEIAS_ID, TITULO_IDEIA, USUARIOS_ID, MOTIVO, DESCRICAO)
       SELECT ID, TITULO, ?, ?, ?
       FROM IDEIAS
       WHERE ID = ?`,
      [usuarioId, motivo, descricao || null, ideiaId],
    );
    return resultado;
  }
}

async function listarDenuncias() {
  const [denuncias] = await connection.query(
    `SELECT
      d.ID,
      d.IDEIAS_ID,
      COALESCE(d.IDEIA_ID_ORIGINAL, d.IDEIAS_ID) AS IDEIA_ID_ORIGINAL,
      d.USUARIOS_ID,
      d.MOTIVO,
      d.DESCRICAO,
      d.STATUS,
      d.RESULTADO,
      d.MEDIDA_APLICADA,
      d.JUSTIFICATIVA,
      d.ADMIN_ID,
      d.CREATED_AT,
      d.RESOLVIDA_AT,
      COALESCE(i.TITULO, d.TITULO_IDEIA, 'Ideia sem título') AS IDEIA_TITULO,
      COALESCE(i.DESCRICAO, d.DESCRICAO_IDEIA, '') AS IDEIA_DESCRICAO,
      COALESCE(i.CATEGORIA, d.CATEGORIA_IDEIA, 'Geral') AS CATEGORIA_IDEIA,
      COALESCE(autor.NOME, d.AUTOR_IDEIA_NOME, 'Não informado') AS AUTOR_NOME,
      COALESCE(i.USUARIOS_ID, d.AUTOR_IDEIA_ID) AS AUTOR_ID,
      u.NOME AS USUARIO_NOME,
      admin.NOME AS ADMIN_NOME,
      CASE WHEN i.ID IS NULL THEN TRUE ELSE FALSE END AS IDEIA_EXCLUIDA
     FROM DENUNCIAS d
     LEFT JOIN IDEIAS i ON d.IDEIAS_ID = i.ID
     INNER JOIN USUARIOS u ON d.USUARIOS_ID = u.ID
     LEFT JOIN USUARIOS autor ON i.USUARIOS_ID = autor.ID
     LEFT JOIN USUARIOS admin ON d.ADMIN_ID = admin.ID
     ORDER BY d.CREATED_AT DESC`,
  );

  return denuncias;
}

async function buscarDenunciaPorId(id) {
  const [denuncias] = await connection.query(
    `SELECT
      d.ID,
      d.IDEIAS_ID,
      COALESCE(d.IDEIA_ID_ORIGINAL, d.IDEIAS_ID) AS IDEIA_ID_ORIGINAL,
      d.USUARIOS_ID,
      d.MOTIVO,
      d.DESCRICAO,
      d.STATUS,
      d.RESULTADO,
      d.MEDIDA_APLICADA,
      d.JUSTIFICATIVA,
      d.ADMIN_ID,
      d.CREATED_AT,
      d.RESOLVIDA_AT,
      COALESCE(i.TITULO, d.TITULO_IDEIA, 'Ideia sem título') AS IDEIA_TITULO,
      COALESCE(i.DESCRICAO, d.DESCRICAO_IDEIA, '') AS IDEIA_DESCRICAO,
      COALESCE(i.CATEGORIA, d.CATEGORIA_IDEIA, 'Geral') AS CATEGORIA_IDEIA,
      COALESCE(autor.NOME, d.AUTOR_IDEIA_NOME, 'Não informado') AS AUTOR_NOME,
      COALESCE(i.USUARIOS_ID, d.AUTOR_IDEIA_ID) AS AUTOR_ID,
      u.NOME AS USUARIO_NOME,
      admin.NOME AS ADMIN_NOME,
      CASE WHEN i.ID IS NULL THEN TRUE ELSE FALSE END AS IDEIA_EXCLUIDA
     FROM DENUNCIAS d
     LEFT JOIN IDEIAS i ON d.IDEIAS_ID = i.ID
     INNER JOIN USUARIOS u ON d.USUARIOS_ID = u.ID
     LEFT JOIN USUARIOS autor ON i.USUARIOS_ID = autor.ID
     LEFT JOIN USUARIOS admin ON d.ADMIN_ID = admin.ID
     WHERE d.ID = ?`,
    [id],
  );

  return denuncias[0] || null;
}

async function listarDenunciasPorIdeia(ideiaId) {
  const [denuncias] = await connection.query(
    `SELECT
      d.ID,
      d.IDEIAS_ID,
      COALESCE(d.IDEIA_ID_ORIGINAL, d.IDEIAS_ID) AS IDEIA_ID_ORIGINAL,
      d.USUARIOS_ID,
      d.MOTIVO,
      d.DESCRICAO,
      d.STATUS,
      d.RESULTADO,
      d.MEDIDA_APLICADA,
      d.JUSTIFICATIVA,
      d.ADMIN_ID,
      d.CREATED_AT,
      d.RESOLVIDA_AT,
      COALESCE(i.TITULO, d.TITULO_IDEIA, 'Ideia sem título') AS IDEIA_TITULO,
      COALESCE(i.DESCRICAO, d.DESCRICAO_IDEIA, '') AS IDEIA_DESCRICAO,
      COALESCE(i.CATEGORIA, d.CATEGORIA_IDEIA, 'Geral') AS CATEGORIA_IDEIA,
      COALESCE(autor.NOME, d.AUTOR_IDEIA_NOME, 'Não informado') AS AUTOR_NOME,
      COALESCE(i.USUARIOS_ID, d.AUTOR_IDEIA_ID) AS AUTOR_ID,
      u.NOME AS USUARIO_NOME,
      admin.NOME AS ADMIN_NOME,
      CASE WHEN i.ID IS NULL THEN TRUE ELSE FALSE END AS IDEIA_EXCLUIDA
     FROM DENUNCIAS d
     LEFT JOIN IDEIAS i ON d.IDEIAS_ID = i.ID
     INNER JOIN USUARIOS u ON d.USUARIOS_ID = u.ID
     LEFT JOIN USUARIOS autor ON i.USUARIOS_ID = autor.ID
     LEFT JOIN USUARIOS admin ON d.ADMIN_ID = admin.ID
     WHERE d.IDEIAS_ID = ? OR d.IDEIA_ID_ORIGINAL = ?
     ORDER BY d.CREATED_AT DESC`,
    [ideiaId, ideiaId],
  );

  return denuncias;
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
      (medidaAplicada === "Ocultar ideia" || medidaAplicada === "Excluir ideia")
    ) {
      throw new Error(
        "Não é possível aplicar essa medida porque a ideia já foi excluída do sistema.",
      );
    }

    // Guarda os arquivos antes de excluir a ideia
    let anexos = [];

    if (medidaAplicada === "Excluir ideia" && denuncia.IDEIAS_ID) {
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
    if (medidaAplicada === "Ocultar ideia" && denuncia.IDEIAS_ID) {
      await db.query(
        `UPDATE IDEIAS
         SET VISIBILIDADE = 'Oculta'
         WHERE ID = ?`,
        [denuncia.IDEIAS_ID],
      );
    }

    // Envia uma advertência para o AUTOR da ideia
    if (medidaAplicada === "Aviso" && denuncia.AUTOR_ID) {
      await db.query(
        `INSERT INTO ADVERTENCIAS
          (USUARIOS_ID, DENUNCIA_ID, ADMIN_ID, MOTIVO)
         VALUES (?, ?, ?, ?)`,
        [denuncia.AUTOR_ID, denunciaId, adminId, justificativa],
      );
    }

    // Exclui a ideia preservando as denúncias
    if (medidaAplicada === "Excluir ideia" && denuncia.IDEIAS_ID) {
      // 1. Preservar snapshot da ideia em todas as denúncias associadas
      const [ideias] = await db.query(
        `SELECT i.ID, i.TITULO, i.DESCRICAO, i.CATEGORIA, i.USUARIOS_ID, u.NOME AS AUTOR_NOME
         FROM IDEIAS i
         LEFT JOIN USUARIOS u ON i.USUARIOS_ID = u.ID
         WHERE i.ID = ?`,
        [denuncia.IDEIAS_ID],
      );

      if (ideias.length > 0) {
        const ideia = ideias[0];
        try {
          await db.query(
            `UPDATE DENUNCIAS
             SET IDEIA_ID_ORIGINAL = COALESCE(IDEIA_ID_ORIGINAL, ?),
                 TITULO_IDEIA = COALESCE(TITULO_IDEIA, ?),
                 DESCRICAO_IDEIA = COALESCE(DESCRICAO_IDEIA, ?),
                 CATEGORIA_IDEIA = COALESCE(CATEGORIA_IDEIA, ?),
                 AUTOR_IDEIA_ID = COALESCE(AUTOR_IDEIA_ID, ?),
                 AUTOR_IDEIA_NOME = COALESCE(AUTOR_IDEIA_NOME, ?),
                 IDEIAS_ID = NULL
             WHERE IDEIAS_ID = ?`,
            [
              ideia.ID,
              ideia.TITULO,
              ideia.DESCRICAO,
              ideia.CATEGORIA || "Geral",
              ideia.USUARIOS_ID,
              ideia.AUTOR_NOME || "Não informado",
              denuncia.IDEIAS_ID,
            ],
          );
        } catch (err) {
          try {
            await db.query(
              `UPDATE DENUNCIAS SET IDEIAS_ID = NULL WHERE IDEIAS_ID = ?`,
              [denuncia.IDEIAS_ID],
            );
          } catch (ignore) {}
        }
      }

      // 2. Limpar dados dependentes
      try {
        await db.query("DELETE FROM CURTIDAS WHERE IDEIAS_ID = ?", [denuncia.IDEIAS_ID]);
      } catch (ignore) {}
      try {
        await db.query("DELETE FROM FAVORITOS WHERE IDEIAS_ID = ?", [denuncia.IDEIAS_ID]);
      } catch (ignore) {}
      try {
        await db.query("DELETE FROM VISUALIZACOES WHERE IDEIAS_ID = ?", [denuncia.IDEIAS_ID]);
      } catch (ignore) {}
      try {
        await db.query("DELETE FROM COMENTARIOS WHERE IDEIAS_ID = ?", [denuncia.IDEIAS_ID]);
      } catch (ignore) {}
      try {
        await db.query("DELETE FROM ANEXOS WHERE IDEIAS_ID = ?", [denuncia.IDEIAS_ID]);
      } catch (ignore) {}

      // 3. Excluir a ideia da tabela principal
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
  listarDenunciasPorIdeia,
  atualizarStatus,
  buscarAutorDaIdeia,
  buscarRascunho,
  salvarRascunho,
  concluirAnalise,
};
