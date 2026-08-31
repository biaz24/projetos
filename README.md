# Banco de Ideias Abandonadas (IdeiaFutura)

Plataforma social e colaborativa desenvolvida para permitir que usuários publiquem, explorem e colaborem em ideias de projetos que foram abandonadas, esquecidas ou que não conseguiram desenvolver sozinhos.

---

## 🚀 Visão Geral e Objetivo

Muitas ótimas ideias de software, produtos ou iniciativas acabam esquecidas por falta de tempo ou parceiros. O **IdeiaFutura** conecta criadores e colaboradores através de um feed público com busca e filtros, estatísticas reais, sistema de status, página de ideias salvas, comentários aninhados e gestão de perfis e rascunhos.

---

## ⚡ Funcionalidades do Roadmap Implementadas

1. **Sistema de Categoria Real**:
   - Persistência das categorias no MySQL (`Tecnologia`, `Games`, `Sustentabilidade`, `Educação`, `Utilitários`, `Geral`).
   - Badges e ícones coloridos dinâmicos em todos os cards e páginas.

2. **Barra de Pesquisa e Filtros Combinados**:
   - Busca em tempo real por título e descrição com debounce (`search`).
   - Filtros por categoria e status no feed com opção "Limpar Filtros".

3. **Status da Ideia**:
   - Controle do ciclo de vida: `Disponível`, `Em desenvolvimento` e `Concluída`.
   - Edição de status exclusiva para o autor da ideia.

4. **Excluir Ideia pelo Autor**:
   - Exclusão segura com modal de confirmação, remoção em cascata no MySQL e redirecionamento com notificação Toast.

5. **Ação "Adotar Ideia / Entrar em Contato"**:
   - Modal contextual que permite aos usuários interessados entrarem em contato via e-mail diretamente com o autor da publicação.

6. **Sistema de Notificações Toast UI**:
   - Substituição de popups nativos `alert()` por toasters animados no canto da tela (sucesso, erro, info).

7. **Paginação Eficiente da API (Backend + Frontend)**:
   - Consulta MySQL paginada via `LIMIT` e `OFFSET` (10 ideias por página) com barra de navegação numerada ("Anterior", "Próxima", "Página X de Y").

8. **Favoritar / Salvar Ideias (`/salvos`)**:
   - Tabela relacional `FAVORITOS` no MySQL.
   - Ícone de bookmark nos cards e rota protegida `/salvos` para consultar ideias guardadas.

9. **Registro e Contador Real de Visualizações**:
   - Tabela `VISUALIZACOES` no MySQL para registrar acessos à página dedicada `/ideia/:id`.

10. **Respostas Aninhadas em Comentários**:
    - Suporte a `PARENT_ID` nos comentários com recuo visual e botão "Responder".

---

## 🛡️ Matriz de Permissões e Segurança (Autorização)

A aplicação conta com controle estrito de permissões verificado diretamente na camada de **Backend (Express/MySQL)**, garantindo que requisições não autorizadas enviadas via API sejam bloqueadas com status `HTTP 403 Forbidden`:

### 1. Comentários
- **Autor do Comentário** (`comment.USUARIOS_ID === currentUser.id`):
  - ✅ **Pode Editar**: Edição inline do próprio comentário.
  - ✅ **Pode Excluir**: Exclusão do próprio comentário com diálogo de confirmação.
- **Autor da Ideia** (`idea.USUARIOS_ID === currentUser.id`):
  - ✅ **Pode Excluir**: Exclusão de qualquer comentário feito na sua publicação por terceiros.
  - ❌ **NÃO pode Editar**: Não recebe botão nem permissão para alterar o texto de comentários de terceiros.
- **Outros Usuários**:
  - ❌ **Sem acesso**: Botões de edição e exclusão não são exibidos no frontend e qualquer chamada direta via API é rejeitada pelo backend.

### 2. Ideias
- **Autor da Ideia** (`idea.USUARIOS_ID === currentUser.id`):
  - ✅ **Pode Editar**: Botão "Editar ideia" no cabeçalho da página dedicada (título, descrição, categoria, status, visibilidade).
  - ✅ **Pode Excluir**: Botão "Excluir ideia" com modal de confirmação.
- **Outros Usuários**:
  - ❌ **Sem acesso**: Chamadas `PUT` ou `DELETE /ideias/:id` por não autores são bloqueadas no backend com `HTTP 403`.

---

## 🛠️ Stack Tecnológica

### Frontend
- **React 18**: Biblioteca principal para construção da interface de usuário.
- **TypeScript**: Tipagem estática e segurança na definição de modelos e propriedades.
- **Vite**: Bundler rápido com dev server e suporte a proxy local.
- **React Router DOM v6**: Gerenciamento de rotas SPA.
- **FontAwesome 6**: Biblioteca de ícones vetoriais.

### Backend
- **Node.js (ES Modules - JavaScript Puro)**: Servidor HTTP em Express sem TypeScript no backend.
- **Express**: Framework web para criação das rotas REST APIs.
- **JWT (JsonWebToken)**: Emissão de Access Tokens e Refresh Tokens de alta segurança.
- **Cookie-Parser**: Manipulação de cookies seguros `HttpOnly`, `SameSite: Lax` e `Secure`.
- **Bcrypt**: Hashing de senhas com salting (12 rounds).
- **Express-Rate-Limit**: Proteção contra ataques de força bruta e abusos.

### Banco de Dados
- **MySQL 8.x**: Banco de dados relacional com integridade referencial (`ON DELETE CASCADE`), restrições únicas e índices.
- **Driver `mysql2/promise`**: Pool de conexões assíncronas de alta performance.

---

## 🏛️ Arquitetura e Estrutura do Projeto

```text
IdeiaFutura/
├── backend/                  # Servidor API Node.js (JavaScript Puro)
│   ├── src/
│   │   ├── config/           # Configurações de Tokens e Ambiente
│   │   ├── controllers/      # Controladores REST (auth, usuario, ideia, comentario, rascunho, favorito)
│   │   ├── database/         # Pool MySQL e Migration (migration_auth.sql com auto-migration)
│   │   ├── middlewares/      # Middleware JWT e Rate Limiters
│   │   ├── models/           # Modelos de Dados MySQL (JOINs e subqueries otimizadas)
│   │   ├── routes/           # Rotas Express (/auth, /usuarios, /ideias, /comentarios, /rascunhos, /favoritos)
│   │   ├── services/         # Regras de Negócio e Validações
│   │   ├── app.js            # Configuração do Express, CORS e Middlewares Globais
│   │   └── server.js         # Inicialização do Servidor HTTP (Porta 3000)
│   └── package.json
│
└── frontend/                 # Aplicação React + TypeScript (Vite)
    ├── src/
    │   ├── components/       # Componentes Reutilizáveis (AppLayout, IdeaCard, Sidebar, Topbar, StatCard, EmptyState, ProtectedRoute)
    │   ├── context/          # Contextos Globais (AuthContext.tsx, ToastContext.tsx)
    │   ├── pages/            # Páginas da Aplicação (LoginPage, CadastroPage, EsqueceuSenhaPage, HomePage, SalvosPage, PerfilPage, RascunhosPage, IdeiaDetalhesPage)
    │   ├── services/         # Cliente HTTP API com Interceptador de Refresh Token (api.ts)
    │   ├── types/            # Definições de Interfaces TypeScript (index.ts)
    │   ├── App.tsx           # Roteador Principal de Navegação
    │   ├── main.tsx          # Ponto de Entrada React
    │   └── index.css         # Estilos Globais e Normalização
    ├── index.html            # Template Base HTML5
    ├── vite.config.ts        # Configuração do Vite e Proxy /api
    └── package.json
```

---

## 📦 Instalação e Execução Local

### Pré-requisitos
- **Node.js** v18.0.0 ou superior.
- **MySQL Server** 8.0 ou superior.

### 1. Configuração do Banco de Dados MySQL
Crie o banco de dados e as tabelas executando o script SQL fornecido:
```bash
mysql -u seu_usuario -p < backend/src/database/migration_auth.sql
```

### 2. Configuração das Variáveis de Ambiente
Crie um arquivo `.env` na pasta `backend/` seguindo o modelo:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=Projetos
JWT_SECRET=sua_chave_secreta_access_token_minimo_32_caracteres
JWT_REFRESH_SECRET=sua_chave_secreta_refresh_token_minimo_32_caracteres
NODE_ENV=development
```

### 3. Inicialização do Backend
Na pasta `backend/`:
```bash
cd backend
npm install
npm run dev
```

### 4. Inicialização do Frontend
Na pasta `frontend/`:
```bash
cd frontend
npm install
npm run dev
```
O frontend rodará em `http://localhost:5173`.
