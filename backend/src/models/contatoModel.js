import connection from "../database/connection.js";

// Contato entre o interessado (quem quer adotar a ideia) e o autor.
// STATUS: Pendente (aguardando o autor) -> Aceito (chat aberto) | Recusado | Encerrado

const COLUNAS_CONTATO = `
  c.ID, c.IDEIAS_ID, c.IDEIA_TITULO, c.AUTOR_ID, c.INTERESSADO_ID, c.ANONIMO,
  c.STATUS, c.AUTOR_LIDO_ATE, c.INTERESSADO_LIDO_ATE, c.ENCERRADO_POR,
  c.CREATED_AT, c.UPDATED_AT,
  ua.NOME AS AUTOR_NOME, ui.NOME AS INTERESSADO_NOME`;

const JUNCOES = `
  FROM CONTATOS c
  JOIN USUARIOS ua ON ua.ID = c.AUTOR_ID
  JOIN USUARIOS ui ON ui.ID = c.INTERESSADO_ID`;

async function buscarPorId(id) {
  const [linhas] = await connection.query(
    `SELECT ${COLUNAS_CONTATO} ${JUNCOES} WHERE c.ID = ?`,
    [id],
  );
  return linhas[0] || null;
}

async function buscarPorIdeiaEInteressado(ideiaId, interessadoId) {
  const [linhas] = await connection.query(
    `SELECT ${COLUNAS_CONTATO} ${JUNCOES}
     WHERE c.IDEIAS_ID = ? AND c.INTERESSADO_ID = ?`,
    [ideiaId, interessadoId],
  );
  return linhas[0] || null;
}

async function contarPedidosPendentesDoInteressado(interessadoId) {
  const [linhas] = await connection.query(
    `SELECT COUNT(*) AS total FROM CONTATOS
     WHERE INTERESSADO_ID = ? AND STATUS = 'Pendente'`,
    [interessadoId],
  );
  return Number(linhas[0]?.total) || 0;
}

// Cria o pedido e grava a mensagem inicial na mesma transação.
// Se o interessado já tiver um pedido para essa ideia, o banco recusa (UNIQUE) e o erro vira 409.
async function criarComMensagem({ ideiaId, ideiaTitulo, autorId, interessadoId, anonimo, texto }) {
  const db = await connection.getConnection();

  try {
    await db.beginTransaction();

    const [contato] = await db.query(
      `INSERT INTO CONTATOS (IDEIAS_ID, IDEIA_TITULO, AUTOR_ID, INTERESSADO_ID, ANONIMO)
       VALUES (?, ?, ?, ?, ?)`,
      [ideiaId, String(ideiaTitulo ?? "").slice(0, 150), autorId, interessadoId, anonimo ? 1 : 0],
    );

    await db.query(
      `INSERT INTO MENSAGENS_CONTATO (CONTATO_ID, REMETENTE_ID, TEXTO) VALUES (?, ?, ?)`,
      [contato.insertId, interessadoId, texto],
    );

    await db.commit();

    return contato.insertId;
  } catch (erro) {
    await db.rollback();

    if (erro?.code === "ER_DUP_ENTRY") {
      const duplicado = new Error("Você já enviou um pedido de contato para esta ideia.");
      duplicado.status = 409;
      throw duplicado;
    }

    throw erro;
  } finally {
    db.release();
  }
}

// Conversas do usuário (como autor ou como interessado), com a última mensagem e as não lidas.
async function listarDoUsuario(usuarioId) {
  const [linhas] = await connection.query(
    `SELECT ${COLUNAS_CONTATO},
       (SELECT m.TEXTO FROM MENSAGENS_CONTATO m
         WHERE m.CONTATO_ID = c.ID ORDER BY m.ID DESC LIMIT 1) AS ULTIMA_MENSAGEM,
       (SELECT COUNT(*) FROM MENSAGENS_CONTATO m
         WHERE m.CONTATO_ID = c.ID AND m.REMETENTE_ID <> ?
           AND m.ID > IF(c.AUTOR_ID = ?, c.AUTOR_LIDO_ATE, c.INTERESSADO_LIDO_ATE)) AS NAO_LIDAS
     ${JUNCOES}
     WHERE c.AUTOR_ID = ? OR c.INTERESSADO_ID = ?
     ORDER BY c.UPDATED_AT DESC, c.ID DESC
     LIMIT 100`,
    [usuarioId, usuarioId, usuarioId, usuarioId],
  );
  return linhas;
}

async function contarNaoLidas(usuarioId) {
  const [linhas] = await connection.query(
    `SELECT COUNT(*) AS total
     FROM MENSAGENS_CONTATO m
     JOIN CONTATOS c ON c.ID = m.CONTATO_ID
     WHERE (c.AUTOR_ID = ? OR c.INTERESSADO_ID = ?)
       AND c.STATUS IN ('Pendente', 'Aceito')
       AND m.REMETENTE_ID <> ?
       AND m.ID > IF(c.AUTOR_ID = ?, c.AUTOR_LIDO_ATE, c.INTERESSADO_LIDO_ATE)`,
    [usuarioId, usuarioId, usuarioId, usuarioId],
  );
  return Number(linhas[0]?.total) || 0;
}

// Últimas mensagens, da mais antiga para a mais nova.
async function listarMensagens(contatoId, limite = 200) {
  const [linhas] = await connection.query(
    `SELECT * FROM (
       SELECT ID, REMETENTE_ID, TEXTO, CREATED_AT
       FROM MENSAGENS_CONTATO WHERE CONTATO_ID = ?
       ORDER BY ID DESC LIMIT ?
     ) ultimas ORDER BY ID ASC`,
    [contatoId, limite],
  );
  return linhas;
}

// Marca como lidas as mensagens da outra pessoa.
// "UPDATED_AT = UPDATED_AT" impede que ler uma conversa a mova para o topo da lista.
async function marcarComoLido(contato, usuarioId) {
  const coluna = Number(contato.AUTOR_ID) === Number(usuarioId) ? "AUTOR_LIDO_ATE" : "INTERESSADO_LIDO_ATE";

  await connection.query(
    `UPDATE CONTATOS
     SET ${coluna} = (SELECT COALESCE(MAX(ID), 0) FROM MENSAGENS_CONTATO WHERE CONTATO_ID = ?),
         UPDATED_AT = UPDATED_AT
     WHERE ID = ?`,
    [contato.ID, contato.ID],
  );
}

// Só muda se o contato estiver em um dos status esperados (evita decidir duas vezes).
async function mudarStatus(id, statusPermitidos, novoStatus, encerradoPor = null) {
  const [resultado] = await connection.query(
    `UPDATE CONTATOS
     SET STATUS = ?, ENCERRADO_POR = ?
     WHERE ID = ? AND STATUS IN (${statusPermitidos.map(() => "?").join(",")})`,
    [novoStatus, encerradoPor, id, ...statusPermitidos],
  );
  return resultado;
}

// Só grava se a conversa estiver "Aceito" (verificado no mesmo comando SQL).
async function inserirMensagem(contatoId, remetenteId, texto) {
  const [resultado] = await connection.query(
    `INSERT INTO MENSAGENS_CONTATO (CONTATO_ID, REMETENTE_ID, TEXTO)
     SELECT ?, ?, ? FROM CONTATOS WHERE ID = ? AND STATUS = 'Aceito'`,
    [contatoId, remetenteId, texto, contatoId],
  );

  if (resultado.affectedRows > 0) {
    await connection.query(`UPDATE CONTATOS SET UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = ?`, [contatoId]);
  }

  return resultado;
}

// ---- denúncia de conversa ----

async function buscarDenunciaAbertaDoUsuario(contatoId, denuncianteId) {
  const [linhas] = await connection.query(
    `SELECT ID FROM DENUNCIAS_CONTATO
     WHERE CONTATO_ID = ? AND DENUNCIANTE_ID = ? AND STATUS = 'Pendente'`,
    [contatoId, denuncianteId],
  );
  return linhas[0] || null;
}

async function criarDenuncia(contatoId, denuncianteId, motivo, descricao) {
  const [resultado] = await connection.query(
    `INSERT INTO DENUNCIAS_CONTATO (CONTATO_ID, DENUNCIANTE_ID, MOTIVO, DESCRICAO)
     VALUES (?, ?, ?, ?)`,
    [contatoId, denuncianteId, motivo, descricao],
  );
  return resultado;
}

async function listarDenuncias() {
  const [linhas] = await connection.query(
    `SELECT d.ID, d.CONTATO_ID, d.DENUNCIANTE_ID, d.MOTIVO, d.DESCRICAO, d.STATUS, d.MEDIDA,
            d.JUSTIFICATIVA, d.ADMIN_ID, d.CREATED_AT, d.RESOLVIDA_AT,
            c.IDEIA_TITULO, c.AUTOR_ID, c.INTERESSADO_ID,
            ua.NOME AS AUTOR_NOME, ui.NOME AS INTERESSADO_NOME,
            ud.NOME AS DENUNCIANTE_NOME, adm.NOME AS ADMIN_NOME
     FROM DENUNCIAS_CONTATO d
     JOIN CONTATOS c ON c.ID = d.CONTATO_ID
     JOIN USUARIOS ua ON ua.ID = c.AUTOR_ID
     JOIN USUARIOS ui ON ui.ID = c.INTERESSADO_ID
     JOIN USUARIOS ud ON ud.ID = d.DENUNCIANTE_ID
     LEFT JOIN USUARIOS adm ON adm.ID = d.ADMIN_ID
     ORDER BY d.CREATED_AT DESC, d.ID DESC
     LIMIT 200`,
  );
  return linhas;
}

async function buscarDenuncia(id) {
  const [linhas] = await connection.query(
    `SELECT d.ID, d.CONTATO_ID, d.DENUNCIANTE_ID, d.MOTIVO, d.DESCRICAO, d.STATUS, d.MEDIDA,
            d.JUSTIFICATIVA, d.ADMIN_ID, d.CREATED_AT, d.RESOLVIDA_AT,
            c.IDEIA_TITULO, c.AUTOR_ID, c.INTERESSADO_ID,
            ua.NOME AS AUTOR_NOME, ui.NOME AS INTERESSADO_NOME,
            ud.NOME AS DENUNCIANTE_NOME, adm.NOME AS ADMIN_NOME
     FROM DENUNCIAS_CONTATO d
     JOIN CONTATOS c ON c.ID = d.CONTATO_ID
     JOIN USUARIOS ua ON ua.ID = c.AUTOR_ID
     JOIN USUARIOS ui ON ui.ID = c.INTERESSADO_ID
     JOIN USUARIOS ud ON ud.ID = d.DENUNCIANTE_ID
     LEFT JOIN USUARIOS adm ON adm.ID = d.ADMIN_ID
     WHERE d.ID = ?`,
    [id],
  );
  return linhas[0] || null;
}

// Só resolve uma vez (WHERE STATUS = 'Pendente').
async function resolverDenuncia(id, adminId, medida, justificativa) {
  const [resultado] = await connection.query(
    `UPDATE DENUNCIAS_CONTATO
     SET STATUS = 'Resolvida', MEDIDA = ?, JUSTIFICATIVA = ?, ADMIN_ID = ?, RESOLVIDA_AT = CURRENT_TIMESTAMP
     WHERE ID = ? AND STATUS = 'Pendente'`,
    [medida, justificativa, adminId, id],
  );
  return resultado;
}

export default {
  buscarPorId,
  buscarPorIdeiaEInteressado,
  contarPedidosPendentesDoInteressado,
  criarComMensagem,
  listarDoUsuario,
  contarNaoLidas,
  listarMensagens,
  marcarComoLido,
  mudarStatus,
  inserirMensagem,
  buscarDenunciaAbertaDoUsuario,
  criarDenuncia,
  listarDenuncias,
  buscarDenuncia,
  resolverDenuncia,
};
