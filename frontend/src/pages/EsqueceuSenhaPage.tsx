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
      await fetchApi<{ mensagem: string }>("/esqueci-senha", {
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

  const handleTentarNovamente = () => {
    setSubmitted(false);
    setErro("");
  };

  return (
    <div className="auth-page-wrapper">
      <div className="container">
        {/* Painel Esquerdo */}
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
            alt="Ilustração de recuperação"
            className="imagem-recuperacao"
          />
        </div>

        {/* Painel Direito */}
        <div className="right">
          <div className="card">
            {!submitted ? (
              <>
                <h2>Recuperar senha</h2>
                <p>Digite seu e-mail cadastrado para receber as instruções de recuperação.</p>

                {erro && (
                  <div className="alert-box" role="alert">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{erro}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <label htmlFor="emailInput">
                    <b>E-mail</b>
                  </label>

                  <div className="input-box">
                    <i className="fa-regular fa-envelope"></i>
                    <input
                      id="emailInput"
                      type="email"
                      placeholder="exemplo@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" disabled={loading}>
                    {loading ? "Enviando instruções..." : "Enviar instruções"}
                  </button>
                </form>
              </>
            ) : (
              <div className="card-feedback sucesso">
                <i className="fa-solid fa-circle-check feedback-icon"></i>
                <h3>E-mail enviado!</h3>
                <p>
                  Se o endereço <strong>{email}</strong> estiver cadastrado em nossa plataforma,
                  você receberá um link em alguns instantes para definir uma nova senha.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleTentarNovamente}
                >
                  Tentar outro e-mail
                </button>
              </div>
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
