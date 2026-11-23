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

    // 5. Colunas de histórico e integridade em DENUNCIAS (preserva dados mesmo se a ideia for excluída)
    await adicionarColunaSeNaoExistir("DENUNCIAS", "IDEIA_ID_ORIGINAL", "INT NULL");
    await adicionarColunaSeNaoExistir("DENUNCIAS", "DESCRICAO_IDEIA", "TEXT NULL");
    await adicionarColunaSeNaoExistir("DENUNCIAS", "CATEGORIA_IDEIA", "VARCHAR(50) NULL");
    await adicionarColunaSeNaoExistir("DENUNCIAS", "AUTOR_IDEIA_ID", "INT NULL");
    await adicionarColunaSeNaoExistir("DENUNCIAS", "AUTOR_IDEIA_NOME", "VARCHAR(100) NULL");

    // 6. Coluna VISIBILIDADE em IDEIAS
    await adicionarColunaSeNaoExistir("IDEIAS", "VISIBILIDADE", "VARCHAR(20) NOT NULL DEFAULT 'Publica'");

    // 7. Tabela RECUPERACAO_SENHA
    await connection.query(`
      CREATE TABLE IF NOT EXISTS RECUPERACAO_SENHA (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        USUARIOS_ID INT NOT NULL,
        TOKEN_HASH VARCHAR(64) NOT NULL UNIQUE,
        EXPIRA_AT DATETIME NOT NULL,
        USADO BOOLEAN NOT NULL DEFAULT FALSE,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_RECUPERACAO_USUARIO FOREIGN KEY (USUARIOS_ID) REFERENCES USUARIOS(ID) ON DELETE CASCADE
      )
    `);

    // 8. Tabela REFRESH_TOKENS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS REFRESH_TOKENS (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        USUARIOS_ID INT NOT NULL,
        TOKEN_HASH CHAR(64) NOT NULL UNIQUE,
        EXPIRES_AT DATETIME NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        REVOKED_AT DATETIME NULL,
        CONSTRAINT fk_refresh_usuario FOREIGN KEY (USUARIOS_ID) REFERENCES USUARIOS(ID) ON DELETE CASCADE
      )
    `);

    // 9. Garantir que a coluna SENHA em USUARIOS suporta hash bcrypt (VARCHAR 255)
    try {
      await connection.query("ALTER TABLE USUARIOS MODIFY COLUMN SENHA VARCHAR(255) NOT NULL");
    } catch (_) {
      // Ignora se tabela não existir ainda ou não puder ser modificada
    }

    // 10. Notificações (sininho do site) e motivo da moderação nas ideias ocultadas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS NOTIFICACOES (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        USUARIOS_ID INT NOT NULL,
        TIPO VARCHAR(50) NOT NULL,
        TITULO VARCHAR(150) NOT NULL,
        MENSAGEM TEXT NOT NULL,
        LIDA BOOLEAN NOT NULL DEFAULT FALSE,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_notificacoes_usuario FOREIGN KEY (USUARIOS_ID) REFERENCES USUARIOS(ID) ON DELETE CASCADE
      )
    `);
    // Ideia a que a notificação se refere (sem chave estrangeira: a ideia pode ser removida)
    await adicionarColunaSeNaoExistir("NOTIFICACOES", "IDEIAS_ID", "INT NULL");
    // Conversa a que a notificação se refere (o sininho abre direto essa conversa)
    await adicionarColunaSeNaoExistir("NOTIFICACOES", "CONTATO_ID", "INT NULL");
    await adicionarColunaSeNaoExistir("IDEIAS", "MOTIVO_MODERACAO", "TEXT NULL");
    // Banimento: conta suspensa pela moderação (BANIDO_EM preenchido = não consegue entrar)
    await adicionarColunaSeNaoExistir("USUARIOS", "BANIDO_EM", "DATETIME NULL");
    await adicionarColunaSeNaoExistir("USUARIOS", "MOTIVO_BANIMENTO", "VARCHAR(500) NULL");

    // Confirmação de e-mail. Quem já tinha conta antes desta atualização continua
    // entrando normalmente: ao criar a coluna, o valor padrão (agora) preenche as contas
    // existentes. Contas novas gravam NULL de propósito (veja usuarioModel).
    await adicionarColunaSeNaoExistir(
      "USUARIOS",
      "EMAIL_CONFIRMADO_EM",
      "DATETIME NULL DEFAULT CURRENT_TIMESTAMP",
    );
    try {
      await connection.query("ALTER TABLE USUARIOS ALTER COLUMN EMAIL_CONFIRMADO_EM DROP DEFAULT");
    } catch (err) {
      console.warn("Aviso de auto-migration EMAIL_CONFIRMADO_EM:", err.message);
    }
    // Aceite dos Termos de Uso / Política de Privacidade (LGPD): quando e qual versão
    await adicionarColunaSeNaoExistir("USUARIOS", "TERMOS_ACEITOS_EM", "DATETIME NULL");
    await adicionarColunaSeNaoExistir("USUARIOS", "TERMOS_VERSAO", "VARCHAR(20) NULL");
    // Momento (em segundos, horário Unix) da última troca de senha: tokens mais antigos deixam de valer
    await adicionarColunaSeNaoExistir("USUARIOS", "SENHA_ALTERADA_TS", "BIGINT NULL");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS CONFIRMACAO_EMAIL (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        USUARIOS_ID INT NOT NULL,
        TOKEN_HASH CHAR(64) NOT NULL UNIQUE,
        EMAIL VARCHAR(255) NOT NULL,
        EXPIRA_AT DATETIME NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_confirmacao_usuario FOREIGN KEY (USUARIOS_ID) REFERENCES USUARIOS(ID) ON DELETE CASCADE
      )
    `);

    // Registro de auditoria: qual administrador tomou cada decisão de moderação
    await connection.query(`
      CREATE TABLE IF NOT EXISTS LOG_MODERACAO (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        ADMIN_ID INT NOT NULL,
        ACAO VARCHAR(50) NOT NULL,
        IDEIAS_ID INT NULL,
        DENUNCIA_ID INT NULL,
        DETALHE TEXT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 11. Contato entre interessado e autor da ideia: pedido, chat privado e denúncia de conversa
    // Sem chave estrangeira em IDEIAS de propósito: a conversa (e uma denúncia sobre ela)
    // não some se a ideia for excluída; por isso o título da ideia é copiado para cá.
    await connection.query(`
      CREATE TABLE IF NOT EXISTS CONTATOS (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        IDEIAS_ID INT NOT NULL,
        IDEIA_TITULO VARCHAR(150) NOT NULL,
        AUTOR_ID INT NOT NULL,
        INTERESSADO_ID INT NOT NULL,
        ANONIMO BOOLEAN NOT NULL DEFAULT FALSE,
        STATUS VARCHAR(20) NOT NULL DEFAULT 'Pendente',
        AUTOR_LIDO_ATE INT NOT NULL DEFAULT 0,
        INTERESSADO_LIDO_ATE INT NOT NULL DEFAULT 0,
        ENCERRADO_POR INT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_contatos_autor FOREIGN KEY (AUTOR_ID) REFERENCES USUARIOS(ID) ON DELETE CASCADE,
        CONSTRAINT fk_contatos_interessado FOREIGN KEY (INTERESSADO_ID) REFERENCES USUARIOS(ID) ON DELETE CASCADE,
        CONSTRAINT unique_contato_ideia_interessado UNIQUE (IDEIAS_ID, INTERESSADO_ID)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS MENSAGENS_CONTATO (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        CONTATO_ID INT NOT NULL,
        REMETENTE_ID INT NOT NULL,
        TEXTO TEXT NOT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_mensagens_contato FOREIGN KEY (CONTATO_ID) REFERENCES CONTATOS(ID) ON DELETE CASCADE,
        CONSTRAINT fk_mensagens_remetente FOREIGN KEY (REMETENTE_ID) REFERENCES USUARIOS(ID) ON DELETE CASCADE,
        INDEX idx_mensagens_contato (CONTATO_ID, ID)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS DENUNCIAS_CONTATO (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        CONTATO_ID INT NOT NULL,
        DENUNCIANTE_ID INT NOT NULL,
        MOTIVO VARCHAR(100) NOT NULL,
        DESCRICAO TEXT NULL,
        STATUS VARCHAR(20) NOT NULL DEFAULT 'Pendente',
        MEDIDA VARCHAR(30) NULL,
        JUSTIFICATIVA TEXT NULL,
        ADMIN_ID INT NULL,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        RESOLVIDA_AT DATETIME NULL,
        CONSTRAINT fk_denuncias_contato FOREIGN KEY (CONTATO_ID) REFERENCES CONTATOS(ID) ON DELETE CASCADE,
        CONSTRAINT fk_denuncias_contato_denunciante FOREIGN KEY (DENUNCIANTE_ID) REFERENCES USUARIOS(ID) ON DELETE CASCADE
      )
    `);

    // 12. Limpeza: remove tokens de sessão e de recuperação de senha que já expiraram
    await connection.query("DELETE FROM REFRESH_TOKENS WHERE EXPIRES_AT < NOW()");
    await connection.query("DELETE FROM RECUPERACAO_SENHA WHERE EXPIRA_AT < NOW()");
  } catch (err) {
    console.warn("Aviso de auto-migration:", err.message);
  }
})();

export default connection;
