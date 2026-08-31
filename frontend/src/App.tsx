import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { CadastroPage } from "./pages/CadastroPage";
import { EsqueceuSenhaPage } from "./pages/EsqueceuSenhaPage";
import { HomePage } from "./pages/HomePage";
import { SalvosPage } from "./pages/SalvosPage";
import { PerfilPage } from "./pages/PerfilPage";
import { RascunhosPage } from "./pages/RascunhosPage";
import { IdeiaDetalhesPage } from "./pages/IdeiaDetalhesPage";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Rotas Públicas */}
            <Route
              path="/"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/cadastro"
              element={
                <PublicOnlyRoute>
                  <CadastroPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/esqueceu-senha"
              element={
                <PublicOnlyRoute>
                  <EsqueceuSenhaPage />
                </PublicOnlyRoute>
              }
            />

            {/* Rotas Protegidas */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/salvos"
              element={
                <ProtectedRoute>
                  <SalvosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <PerfilPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rascunhos"
              element={
                <ProtectedRoute>
                  <RascunhosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ideia/:id"
              element={
                <ProtectedRoute>
                  <IdeiaDetalhesPage />
                </ProtectedRoute>
              }
            />

            {/* Redirecionamento padrão */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};
