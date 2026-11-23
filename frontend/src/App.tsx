import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { TemaProvider } from "./context/TemaContext";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { CadastroPage } from "./pages/CadastroPage";
import { EsqueceuSenhaPage } from "./pages/EsqueceuSenhaPage";
import { HomePage } from "./pages/HomePage";
import { SalvosPage } from "./pages/SalvosPage";
import { PerfilPage } from "./pages/PerfilPage";
import { RascunhosPage } from "./pages/RascunhosPage";
import { IdeiaDetalhesPage } from "./pages/IdeiaDetalhesPage";
import AdminDenunciasPage from "./pages/AdminDenunciasPage";
import { ConversasPage } from "./pages/ConversasPage";
import { RedefinirSenhaPage } from "./pages/RedefinirSenhaPage";
import { ConfirmarEmailPage } from "./pages/ConfirmarEmailPage";
import { AcessibilidadeGlobal } from "./components/AcessibilidadeGlobal";
import { TermosPage, PrivacidadePage } from "./pages/DocumentoLegal";

export const App: React.FC = () => {
  return (
    <TemaProvider>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AcessibilidadeGlobal />
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
            <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
            <Route path="/confirmar-email" element={<ConfirmarEmailPage />} />
            <Route path="/termos" element={<TermosPage />} />
            <Route path="/privacidade" element={<PrivacidadePage />} />

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
              path="/meus-rascunhos"
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
            <Route
              path="/conversas"
              element={
                <ProtectedRoute>
                  <ConversasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/denuncias"
              element={
                <ProtectedRoute>
                  <AdminDenunciasPage />
                </ProtectedRoute>
              }
            />

            {/* Redirecionamento padrão */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
    </TemaProvider>
  );
};
