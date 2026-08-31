import mysql from "mysql2/promise";
import env from "../config/env.js";

const connection = mysql.createPool(env.db);

console.log("CONECTADO AO BANCO DE DADOS");

async function adicionarColunaSeNaoExistir(tabela, coluna, definicao) {
  try {
    const [cols] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [tabela, coluna],
    );
    if (cols.length === 0) {
      await connection.query(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
    }
  } catch (err) {
    console.warn(`Aviso de auto-migration coluna ${tabela}.${coluna}:`, err.message);
  }
}

// Migration automática de esquema para colunas e tabelas novas
(async () => {
  try {
    // 1. Colunas em IDEIAS
    await adicionarColunaSeNaoExistir("IDEIAS", "CATEGORIA", "VARCHAR(50) NOT NULL DEFAULT 'Geral'");
    await adicionarColunaSeNaoExistir("IDEIAS", "STATUS", "VARCHAR(30) NOT NULL DEFAULT 'Disponível'");

    // 2. Coluna em COMENTARIOS
    await adicionarColunaSeNaoExistir("COMENTARIOS", "PARENT_ID", "INT NULL DEFAULT NULL");

    // 3. Tabela FAVORITOS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS FAVORITOS (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        USUARIOS_ID INT NOT NULL,
        IDEIAS_ID INT NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_favoritos_usuario FOREIGN KEY (USUARIOS_ID) REFERENCES USUARIOS(ID) ON DELETE CASCADE,
        CONSTRAINT fk_favoritos_ideia FOREIGN KEY (IDEIAS_ID) REFERENCES IDEIAS(ID) ON DELETE CASCADE,
        CONSTRAINT unique_usuario_ideia_favorito UNIQUE (USUARIOS_ID, IDEIAS_ID)
      )
    `);

    // 4. Tabela VISUALIZACOES
    await connection.query(`
      CREATE TABLE IF NOT EXISTS VISUALIZACOES (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        IDEIAS_ID INT NOT NULL,
        USUARIOS_ID INT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_visualizacoes_ideia FOREIGN KEY (IDEIAS_ID) REFERENCES IDEIAS(ID) ON DELETE CASCADE
      )
    `);
  } catch (err) {
    console.warn("Aviso de auto-migration:", err.message);
  }
})();

export default connection;
