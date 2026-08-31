-- ============================================================
-- BANCO DE DADOS: PROJETOS
-- ============================================================

CREATE DATABASE IF NOT EXISTS Projetos
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE Projetos;


-- ============================================================
-- TABELA: USUARIOS
-- ============================================================

CREATE TABLE IF NOT EXISTS USUARIOS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    NOME VARCHAR(100) NOT NULL,
    EMAIL VARCHAR(255) NOT NULL UNIQUE,
    SENHA VARCHAR(255) NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- TABELA: IDEIAS
-- ============================================================

CREATE TABLE IF NOT EXISTS IDEIAS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    USUARIOS_ID INT NOT NULL,
    TITULO VARCHAR(100) NOT NULL,
    DESCRICAO TEXT NOT NULL,
    CATEGORIA VARCHAR(50) NOT NULL DEFAULT 'Geral',
    STATUS VARCHAR(30) NOT NULL DEFAULT 'Disponível',
    ANONIMO BOOLEAN NOT NULL DEFAULT FALSE,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ideias_usuario
        FOREIGN KEY (USUARIOS_ID)
        REFERENCES USUARIOS(ID)
        ON DELETE CASCADE
);


-- ============================================================
-- TABELA: COMENTARIOS
-- ============================================================

CREATE TABLE IF NOT EXISTS COMENTARIOS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    IDEIAS_ID INT NOT NULL,
    USUARIOS_ID INT NOT NULL,
    PARENT_ID INT NULL DEFAULT NULL,
    COMENTARIOS TEXT NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_comentarios_ideia
        FOREIGN KEY (IDEIAS_ID)
        REFERENCES IDEIAS(ID)
        ON DELETE CASCADE,

    CONSTRAINT fk_comentarios_usuario
        FOREIGN KEY (USUARIOS_ID)
        REFERENCES USUARIOS(ID)
        ON DELETE CASCADE,

    CONSTRAINT fk_comentarios_parent
        FOREIGN KEY (PARENT_ID)
        REFERENCES COMENTARIOS(ID)
        ON DELETE CASCADE
);


-- ============================================================
-- TABELA: FAVORITOS
-- ============================================================

CREATE TABLE IF NOT EXISTS FAVORITOS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    USUARIOS_ID INT NOT NULL,
    IDEIAS_ID INT NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_favoritos_usuario
        FOREIGN KEY (USUARIOS_ID)
        REFERENCES USUARIOS(ID)
        ON DELETE CASCADE,

    CONSTRAINT fk_favoritos_ideia
        FOREIGN KEY (IDEIAS_ID)
        REFERENCES IDEIAS(ID)
        ON DELETE CASCADE,

    CONSTRAINT unique_usuario_ideia_favorito
        UNIQUE (USUARIOS_ID, IDEIAS_ID)
);


-- ============================================================
-- TABELA: VISUALIZACOES
-- ============================================================

CREATE TABLE IF NOT EXISTS VISUALIZACOES (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    IDEIAS_ID INT NOT NULL,
    USUARIOS_ID INT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_visualizacoes_ideia
        FOREIGN KEY (IDEIAS_ID)
        REFERENCES IDEIAS(ID)
        ON DELETE CASCADE
);


-- ============================================================
-- TABELA: RASCUNHO
-- ============================================================

CREATE TABLE IF NOT EXISTS RASCUNHO (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    USUARIOS_ID INT NOT NULL,
    TITULO VARCHAR(100) NOT NULL,
    DESCRICAO TEXT NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_rascunho_usuario
        FOREIGN KEY (USUARIOS_ID)
        REFERENCES USUARIOS(ID)
        ON DELETE CASCADE
);


-- ============================================================
-- TABELA: REFRESH_TOKENS
-- ============================================================

CREATE TABLE IF NOT EXISTS REFRESH_TOKENS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    USUARIOS_ID INT NOT NULL,
    TOKEN VARCHAR(255) NOT NULL UNIQUE,
    EXPIRES_AT DATETIME NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    REVOKED_AT DATETIME NULL,

    CONSTRAINT fk_refresh_usuario
        FOREIGN KEY (USUARIOS_ID)
        REFERENCES USUARIOS(ID)
        ON DELETE CASCADE
);


-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_ideias_usuario ON IDEIAS(USUARIOS_ID);
CREATE INDEX idx_ideias_categoria ON IDEIAS(CATEGORIA);
CREATE INDEX idx_ideias_status ON IDEIAS(STATUS);
CREATE INDEX idx_comentarios_ideia ON COMENTARIOS(IDEIAS_ID);
CREATE INDEX idx_comentarios_usuario ON COMENTARIOS(USUARIOS_ID);
CREATE INDEX idx_rascunho_usuario ON RASCUNHO(USUARIOS_ID);
CREATE INDEX idx_refresh_usuario ON REFRESH_TOKENS(USUARIOS_ID);
CREATE INDEX idx_refresh_expiracao ON REFRESH_TOKENS(EXPIRES_AT);
