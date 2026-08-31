import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f4f6f8",
          fontFamily: "sans-serif",
          color: "#4a5568",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <i
            className="fa-solid fa-spinner fa-spin"
            style={{ fontSize: "2rem", marginBottom: "1rem", color: "#4f46e5" }}
          ></i>
          <p style={{ margin: 0, fontSize: "1rem" }}>Carregando sessão...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f4f6f8",
          fontFamily: "sans-serif",
          color: "#4a5568",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <i
            className="fa-solid fa-spinner fa-spin"
            style={{ fontSize: "2rem", marginBottom: "1rem", color: "#4f46e5" }}
          ></i>
          <p style={{ margin: 0, fontSize: "1rem" }}>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};
