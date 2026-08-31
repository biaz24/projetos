import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../../css/style.css";

export const CadastroPage: React.FC = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { cadastrar, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (senha !== confirmarSenha) {
      setMessage({ text: "As senhas não são iguais!", isError: true });
      return;
    }

    if (senha.length < 6) {
      setMessage({ text: "A senha deve ter no mínimo 6 caracteres!", isError: true });
      return;
    }

    setSubmitting(true);

    try {
      await cadastrar(nome, email, senha);
      await login(email, senha);
      setMessage({ text: "Cadastro realizado com sucesso! Redirecionando...", isError: false });
      setTimeout(() => {
        navigate("/home");
      }, 400);
    } catch (err: any) {
      setMessage({
        text: err.message || "Erro ao realizar cadastro!",
        isError: true,
      });
    } finally {
      setSubmitting(false);
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
            Sua ideia pode <br />
            mudar o futuro
          </h1>

          <p>
            Crie sua conta e comece a compartilhar <br />
            explorar e transformar ideias em <br />
            projetos reais.
          </p>

          <img
            src="/img/imagem2.png"
            alt="Imagem do sistema"
            className="imagem-login"
          />
        </div>

        {/* Lado direito */}
        <div className="right">
          <div className="card">
            <h2>Crie sua conta</h2>
            <p>Preencha os dados para se cadastrar</p>

            <form onSubmit={handleSubmit}>
              <label>
                <b>Nome de usuário</b>
              </label>
              <div className="input-box">
                <i className="fa-regular fa-user"></i>
                <input
                  type="text"
                  placeholder="Digite seu nome de usuário"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

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

              <label>
                <b>Senha</b>
              </label>
              <div className="input-box">
                <i className="fa-solid fa-lock"></i>
                <input
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <i
                  className={`fa-regular ${mostrarSenha ? "fa-eye-slash" : "fa-eye"}`}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  style={{ cursor: "pointer" }}
                ></i>
              </div>

              <label>
                <b>Confirme sua Senha</b>
              </label>
              <div className="input-box">
                <i className="fa-solid fa-lock"></i>
                <input
                  type={mostrarConfirmarSenha ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                />
                <i
                  className={`fa-regular ${mostrarConfirmarSenha ? "fa-eye-slash" : "fa-eye"}`}
                  onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                  style={{ cursor: "pointer" }}
                ></i>
              </div>

              <button type="submit" disabled={submitting}>
                {submitting ? "Cadastrando..." : "Cadastrar"}
              </button>

              {message && (
                <p
                  id="message"
                  style={{ color: message.isError ? "red" : "green", marginTop: "15px" }}
                >
                  {message.text}
                </p>
              )}

              <div className="divisa"></div>
            </form>

            <div className="register">
              Já tem uma conta? <Link to="/">Faça login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
