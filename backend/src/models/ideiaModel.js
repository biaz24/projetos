import connection from "../database/connection.js";
import arquivoService from "../services/arquivoService.js";

async function criarIdeia(
  usuarioId,
  titulo,
  descricao,
  categoria = "Geral",
  status = "Disponível",
  anonimo = false,
) {
  const [resultado] = await connection.query(
    `INSERT INTO IDEIAS
        (USUARIOS_ID, TITULO, DESCRICAO, CATEGORIA, STATUS, ANONIMO) 
        VALUES (?,?,?,?,?,?)`,
    [usuarioId, titulo, descricao, categoria, status, anonimo],
  );
  return resultado;
}

async function listarIdeias({
  page = 1,
  limit = 10,
  search = "",
  categoria = "",
  status = "",
} = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  const whereClauses = ["COALESCE(i.VISIBILIDADE, 'Publica') = 'Publica'"];

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

  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

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
      CAST((SELECT COUNT(*) FROM VISUALIZACOES v WHERE v.IDEIAS_ID = i.ID) AS SIGNED) as visualizacoes_count
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
      CAST((SELECT COUNT(*) FROM VISUALIZACOES v WHERE v.IDEIAS_ID = i.ID) AS SIGNED) visualizacoes_count
    FROM IDEIAS i
    JOIN USUARIOS u ON i.USUARIOS_ID = u.ID
    WHERE i.ID = ?`,
    [id],
  );
  return ideias[0];
}

async function registrarVisualizacao(ideiaId, usuarioId) {
  try {
    const [existente] = await connection.query(
      `SELECT ID
       FROM VISUALIZACOES
       WHERE IDEIAS_ID = ? AND USUARIOS_ID = ?
       LIMIT 1`,
      [ideiaId, usuarioId],
    );

    if (existente.length > 0) {
      return;
    }

    await connection.query(
      `INSERT INTO VISUALIZACOES (IDEIAS_ID, USUARIOS_ID)
       VALUES (?, ?)`,
      [ideiaId, usuarioId],
    );
  } catch (err) {
    console.error("Erro ao registrar visualização:", err.message);
  }
}

async function atualizarIdeia(
  id,
  titulo,
  descricao,
  categoria,
  status,
  anonimo,
) {
  const [resultado] = await connection.query(
    `UPDATE IDEIAS
    SET TITULO = ?, DESCRICAO = ?, CATEGORIA = ?, STATUS = ?, ANONIMO = ?
    WHERE ID = ?`,
    [titulo, descricao, categoria, status, anonimo, id],
  );
  return resultado;
}

async function deletarideia(id) {
  // 1. Preservar o histórico completo nas denúncias antes de excluir a ideia
  try {
    const [ideias] = await connection.query(
      `SELECT i.ID, i.TITULO, i.DESCRICAO, i.CATEGORIA, i.USUARIOS_ID, u.NOME AS AUTOR_NOME
       FROM IDEIAS i
       LEFT JOIN USUARIOS u ON i.USUARIOS_ID = u.ID
       WHERE i.ID = ?`,
      [id],
    );
    if (ideias.length > 0) {
      const ideia = ideias[0];
      await connection.query(
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
          id,
        ],
      );
    }
  } catch (err) {
    try {
      await connection.query(
        `UPDATE DENUNCIAS SET IDEIAS_ID = NULL WHERE IDEIAS_ID = ?`,
        [id],
      );
    } catch (ignore) {}
  }

  // 2. Limpar curtidas, favoritos, visualizações e comentários
  try {
    await connection.query("DELETE FROM CURTIDAS WHERE IDEIAS_ID = ?", [id]);
  } catch (ignore) {}
  try {
    await connection.query("DELETE FROM FAVORITOS WHERE IDEIAS_ID = ?", [id]);
  } catch (ignore) {}
  try {
    await connection.query("DELETE FROM VISUALIZACOES WHERE IDEIAS_ID = ?", [
      id,
    ]);
  } catch (ignore) {}
  try {
    await connection.query("DELETE FROM COMENTARIOS WHERE IDEIAS_ID = ?", [id]);
  } catch (ignore) {}

  // 3. Excluir arquivos físicos e registros de anexos
  try {
    const [arquivos] = await connection.query(
      "SELECT CAMINHO FROM ANEXOS WHERE IDEIAS_ID = ?",
      [id],
    );
    if (arquivos && arquivos.length > 0) {
      await arquivoService.excluirArquivos(arquivos);
    }
    await connection.query("DELETE FROM ANEXOS WHERE IDEIAS_ID = ?", [id]);
  } catch (err) {
    console.warn("Aviso ao limpar anexos da ideia:", err.message);
  }

  // 4. Excluir a ideia da tabela principal
  const [resultado] = await connection.query(
    "DELETE FROM IDEIAS WHERE ID = ?",
    [id],
  );
  return resultado;
}

// mudei
async function listarIdeiasPorUsuario(usuarioId) {
  const [ideias] = await connection.query(
    `SELECT 
      i.ID,
i.TITULO,
i.DESCRICAO,
COALESCE(i.CATEGORIA, 'Geral') as CATEGORIA,
COALESCE(i.STATUS, 'Disponível') as STATUS,
i.ANONIMO,
i.CREATED_AT,
CASE
  WHEN i.ANONIMO = 1 THEN NULL
  ELSE u.NOME
END AS NOME_AUTOR,
      CAST((SELECT COUNT(*) FROM COMENTARIOS com WHERE com.IDEIAS_ID = i.ID) AS SIGNED) as comentarios_count,
      CAST((SELECT COUNT(*) FROM VISUALIZACOES v WHERE v.IDEIAS_ID = i.ID) AS SIGNED) visualizacoes_count
    FROM IDEIAS i
    JOIN USUARIOS u ON i.USUARIOS_ID = u.ID
    WHERE i.USUARIOS_ID = ?
      AND COALESCE(i.VISIBILIDADE, 'Publica') = 'Publica'
    ORDER BY i.CREATED_AT DESC`,
    [usuarioId],
  );
  return ideias;
}

async function ocultarIdeia(id) {
  const [resultado] = await connection.query(
    `UPDATE IDEIAS
     SET VISIBILIDADE = 'Oculta'
     WHERE ID = ?`,
    [id],
  );

  return resultado;
}

export default {
  criarIdeia,
  listarIdeias,
  buscarIdeiaPorId,
  registrarVisualizacao,
  atualizarIdeia,
  deletarideia,
  listarIdeiasPorUsuario,
  ocultarIdeia,
};
