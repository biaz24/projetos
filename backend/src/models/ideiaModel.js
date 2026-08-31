import connection from "../database/connection.js";

async function criarIdeia(usuarioId, titulo, descricao, categoria = "Geral", status = "Disponível", anonimo = false) {
  const [resultado] = await connection.query(
    `INSERT INTO IDEIAS
        (USUARIOS_ID, TITULO, DESCRICAO, CATEGORIA, STATUS, ANONIMO) 
        VALUES (?,?,?,?,?,?)`,
    [usuarioId, titulo, descricao, categoria, status, anonimo],
  );
  return resultado;
}

async function listarIdeias({ page = 1, limit = 10, search = "", categoria = "", status = "" } = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  const whereClauses = [];

  if (search && search.trim()) {
    whereClauses.push("(i.TITULO LIKE ? OR i.DESCRICAO LIKE ?)");
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  if (categoria && categoria.trim() && categoria !== "Todas") {
    whereClauses.push("i.CATEGORIA = ?");
    params.push(categoria.trim());
  }

  if (status && status.trim() && status !== "Todos") {
    whereClauses.push("i.STATUS = ?");
    params.push(status.trim());
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // Query para contar total de itens filtrados
  const [[{ total }]] = await connection.query(
    `SELECT COUNT(*) as total FROM IDEIAS i ${whereSQL}`,
    params,
  );

  // Query para trazer os itens da página atual
  const [ideias] = await connection.query(
    `SELECT 
      i.ID,
      i.USUARIOS_ID,
      i.TITULO,
      i.DESCRICAO,
      COALESCE(i.CATEGORIA, 'Geral') as CATEGORIA,
      COALESCE(i.STATUS, 'Disponível') as STATUS,
      i.ANONIMO,
      i.CREATED_AT,
      u.NOME as NOME_AUTOR,
      u.EMAIL as EMAIL_AUTOR,
      CAST((SELECT COUNT(*) FROM COMENTARIOS com WHERE com.IDEIAS_ID = i.ID) AS SIGNED) as comentarios_count,
      CAST((SELECT COUNT(*) FROM VISUALIZACOES v WHERE v.IDEIAS_ID = i.ID) AS SIGNED) + 1 as visualizacoes_count
    FROM IDEIAS i
    JOIN USUARIOS u ON i.USUARIOS_ID = u.ID
    ${whereSQL}
    ORDER BY i.CREATED_AT DESC
    LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)],
  );

  const totalPages = Math.ceil(total / Number(limit)) || 1;

  return {
    ideias,
    total: Number(total),
    page: Number(page),
    limit: Number(limit),
    totalPages,
  };
}

async function buscarIdeiaPorId(id) {
  const [ideias] = await connection.query(
    `SELECT 
      i.ID,
      i.USUARIOS_ID,
      i.TITULO,
      i.DESCRICAO,
      COALESCE(i.CATEGORIA, 'Geral') as CATEGORIA,
      COALESCE(i.STATUS, 'Disponível') as STATUS,
      i.ANONIMO,
      i.CREATED_AT,
      u.NOME as NOME_AUTOR,
      u.EMAIL as EMAIL_AUTOR,
      CAST((SELECT COUNT(*) FROM COMENTARIOS com WHERE com.IDEIAS_ID = i.ID) AS SIGNED) as comentarios_count,
      CAST((SELECT COUNT(*) FROM VISUALIZACOES v WHERE v.IDEIAS_ID = i.ID) AS SIGNED) + 1 as visualizacoes_count
    FROM IDEIAS i
    JOIN USUARIOS u ON i.USUARIOS_ID = u.ID
    WHERE i.ID = ?`,
    [id],
  );
  return ideias[0];
}

async function registrarVisualizacao(ideiaId, usuarioId = null) {
  try {
    await connection.query(
      `INSERT INTO VISUALIZACOES (IDEIAS_ID, USUARIOS_ID) VALUES (?, ?)`,
      [ideiaId, usuarioId],
    );
  } catch (err) {
    console.error("Erro ao registrar visualização:", err.message);
  }
}

async function atualizarIdeia(id, titulo, descricao, categoria, status, anonimo) {
  const [resultado] = await connection.query(
    `UPDATE IDEIAS
    SET TITULO = ?, DESCRICAO = ?, CATEGORIA = ?, STATUS = ?, ANONIMO = ?
    WHERE ID = ?`,
    [titulo, descricao, categoria, status, anonimo, id],
  );
  return resultado;
}

async function deletarideia(id) {
  await connection.query("DELETE FROM FAVORITOS WHERE IDEIAS_ID = ?", [id]);
  await connection.query("DELETE FROM VISUALIZACOES WHERE IDEIAS_ID = ?", [id]);
  await connection.query("DELETE FROM COMENTARIOS WHERE IDEIAS_ID = ?", [id]);
  const [resultado] = await connection.query(
    "DELETE FROM IDEIAS WHERE ID = ?",
    [id],
  );
  return resultado;
}

async function listarIdeiasPorUsuario(usuarioId) {
  const [ideias] = await connection.query(
    `SELECT 
      i.ID,
      i.USUARIOS_ID,
      i.TITULO,
      i.DESCRICAO,
      COALESCE(i.CATEGORIA, 'Geral') as CATEGORIA,
      COALESCE(i.STATUS, 'Disponível') as STATUS,
      i.ANONIMO,
      i.CREATED_AT,
      u.NOME as NOME_AUTOR,
      u.EMAIL as EMAIL_AUTOR,
      CAST((SELECT COUNT(*) FROM COMENTARIOS com WHERE com.IDEIAS_ID = i.ID) AS SIGNED) as comentarios_count,
      CAST((SELECT COUNT(*) FROM VISUALIZACOES v WHERE v.IDEIAS_ID = i.ID) AS SIGNED) + 1 as visualizacoes_count
    FROM IDEIAS i
    JOIN USUARIOS u ON i.USUARIOS_ID = u.ID
    WHERE i.USUARIOS_ID = ?
    ORDER BY i.CREATED_AT DESC`,
    [usuarioId],
  );
  return ideias;
}

export default {
  criarIdeia,
  listarIdeias,
  buscarIdeiaPorId,
  registrarVisualizacao,
  atualizarIdeia,
  deletarideia,
  listarIdeiasPorUsuario,
};
