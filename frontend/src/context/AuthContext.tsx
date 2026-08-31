import React, { createContext, useContext, useState, useEffect } from "react";
import { Usuario, AuthContextType } from "../types";
import { fetchApi } from "../services/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Ao iniciar a aplicação, verifica se existe usuário autenticado via cookie HttpOnly
  const checkAuth = async () => {
    try {
      setLoading(true);
      const data = await fetchApi<{ usuario: any }>("/auth/me");
      if (data && data.usuario) {
        const u = data.usuario;
        setUser({
          id: u.id || u.ID,
          nome: u.nome || u.NOME,
          email: u.email || u.EMAIL,
          created_at: u.created_at || u.CREATED_AT,
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, senha: string) => {
    const data = await fetchApi<{ usuario: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });
    if (data && data.usuario) {
      const u = data.usuario;
      setUser({
        id: u.id || u.ID,
        nome: u.nome || u.NOME,
        email: u.email || u.EMAIL,
        created_at: u.created_at || u.CREATED_AT,
      });
    }
  };

  const cadastrar = async (nome: string, email: string, senha: string) => {
    await fetchApi("/usuarios", {
      method: "POST",
      body: JSON.stringify({ nome, email, senha }),
    });
  };

  const logout = async () => {
    try {
      await fetchApi("/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Erro ao realizar logout no servidor:", err);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        cadastrar,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
};
