export interface Usuario {
  id: number;
  nome: string;
  email: string;
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
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
