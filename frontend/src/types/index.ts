export interface Usuario {
  id: number;
  nome: string;
  email: string;
  // recebe o tipo para ver se é admin
  tipo?: string;
  created_at?: string;
  CREATED_AT?: string;
}

export interface Ideia {
  ID: number;
  USUARIOS_ID: number;
  TITULO: string;
  DESCRICAO: string;
  CATEGORIA?: string;
  STATUS?: string;
  ANONIMO: boolean | number;
  NOME_AUTOR?: string;
  EMAIL_AUTOR?: string;
  CREATED_AT?: string;
  comentarios_count?: number;
  visualizacoes_count?: number;
  isSaved?: boolean;
  // Só chegam para o próprio autor (e admin): estado da moderação
  VISIBILIDADE?: string; // 'Publica' | 'Oculta' | 'EmRevisao'
  MOTIVO_MODERACAO?: string | null;
}

// Conversa (pedido de contato + chat privado) vista por quem está logado.
// O servidor nunca envia ids nem e-mail da outra pessoa.
export interface Contato {
  ID: number;
  IDEIAS_ID: number;
  IDEIA_TITULO: string;
  STATUS: "Pendente" | "Aceito" | "Recusado" | "Encerrado";
  PAPEL: "autor" | "interessado";
  OUTRO_NOME: string;
  CREATED_AT?: string;
  UPDATED_AT?: string;
  ULTIMA_MENSAGEM?: string;
  NAO_LIDAS?: number;
}

export interface MensagemContato {
  ID: number;
  MINHA: boolean;
  TEXTO: string;
  CREATED_AT?: string;
}

export interface Notificacao {
  ID: number;
  TIPO: string;
  TITULO: string;
  MENSAGEM: string;
  LIDA: number | boolean;
  CREATED_AT?: string;
  IDEIAS_ID?: number | null;
  CONTATO_ID?: number | null;
}

export interface Comentario {
  ID: number;
  IDEIAS_ID: number;
  USUARIOS_ID: number;
  PARENT_ID?: number | null;
  COMENTARIOS: string;
  NOME_AUTOR?: string;
  CREATED_AT?: string;
}

export interface PaginatedIdeias {
  ideias: Ideia[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string, aceitoTermos: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
