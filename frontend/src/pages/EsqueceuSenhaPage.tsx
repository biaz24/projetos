import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../css/recuperar.css";
import { fetchApi } from "../services/api";

export const EsqueceuSenhaPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setErro("");

    try {
      await fetchApi("/esqueci-senha", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setSubmitted(true);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a solicitação.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="container">
        {/* Lado esquerdo */}
        <div className="left">
          <div className="logo">
            <span>Ideia Futura</span>
          </div>

          <h1>
            Recupere sua <br />
            conta.
          </h1>

          <p>
            Não se preocupe! <br />
            Vamos ajudar você a recuperar o acesso à sua conta.
          </p>

          <img
            src="/img/imagem1.png"
            alt="Imagem do sistema"
            className="imagem-recuperacao"
          />
        </div>

        {/* Lado direito */}
        <div className="right">
          <div className="card">
            <h2>Recuperar senha</h2>

            <p>Digite seu e-mail para receber as instruções de recuperação.</p>

            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <label>
                  <b>E-mail</b>
                </label>

                <div className="input-box">
                  <i className="fa-regular fa-envelope"></i>
                  <input
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar instruções"}
                </button>
              </form>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  color: "#16a34a",
                  padding: "15px 0",
                }}
              >
                <i
                  className="fa-solid fa-circle-check"
                  style={{ fontSize: "2.5rem", marginBottom: "10px" }}
                ></i>
                <p style={{ margin: 0, fontWeight: "bold" }}>
                  Se o e-mail estiver cadastrado, você receberá as instruções
                  para redefinir sua senha.
                </p>
              </div>
            )}
            {erro && (
              <p role="alert" style={{ color: "#dc2626" }}>
                {erro}
              </p>
            )}

            <div className="register">
              <Link to="/">
                <i
                  className="fa-solid fa-arrow-left"
                  style={{ marginRight: "5px" }}
                ></i>
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
