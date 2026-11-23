import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { TrocarSenhaModal } from "./TrocarSenhaModal";
import { ExcluirContaModal } from "./ExcluirContaModal";
import "./SegurancaConta.css";

// Cartão "Segurança e privacidade" do Meu perfil.
export const SegurancaConta: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [janela, setJanela] = useState<"nenhuma" | "senha" | "excluir">("nenhuma");

  if (!user) return null;

  return (
    <>
      <section className="sg-card" aria-labelledby="sg-titulo">
        <div className="sg-texto">
          <h3 id="sg-titulo">Segurança e privacidade</h3>
          <p>
            Troque sua senha quando quiser ou exclua sua conta. Leia os{" "}
            <Link to="/termos">Termos de Uso</Link> e a <Link to="/privacidade">Política de Privacidade</Link>.
          </p>
        </div>

        <div className="sg-acoes">
          <button type="button" className="sg-btn" onClick={() => setJanela("senha")}>
            <i className="fa-solid fa-key" aria-hidden="true"></i> Alterar senha
          </button>
          <button type="button" className="sg-btn sg-perigo" onClick={() => setJanela("excluir")}>
            <i className="fa-regular fa-trash-can" aria-hidden="true"></i> Excluir conta
          </button>
        </div>
      </section>

      {janela === "senha" && (
        <TrocarSenhaModal
          aoFechar={() => setJanela("nenhuma")}
          aoConcluir={() => {
            setJanela("nenhuma");
            showToast("Senha alterada. As outras sessões foram encerradas.", "success");
          }}
        />
      )}

      {janela === "excluir" && (
        <ExcluirContaModal
          usuarioId={user.id}
          aoFechar={() => setJanela("nenhuma")}
          aoExcluida={async () => {
            await logout();
            showToast("Conta excluída. Sentiremos sua falta.", "info");
            navigate("/");
          }}
        />
      )}
    </>
  );
};
