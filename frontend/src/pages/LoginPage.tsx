// useRef --> Para acessar diretamente o campo e-mail.
import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReenviarConfirmacao } from "../components/ReenviarConfirmacao";
import "../../css/style.css";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [precisaConfirmar, setPrecisaConfirmar] = useState(false);

  // Criando variável para usar o useRef:
  const emailRef = useRef<HTMLInputElement>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  // React, quando a tela estiver pronta, execute isso:
  useEffect(() => {
    // Será executado pelo useEffect
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setPrecisaConfirmar(false);
    setSubmitting(true);

    try {
      await login(email, senha);
      setMessage({ text: "Login efetuado com sucesso!", isError: false });
      setTimeout(() => {
        navigate("/home");
      }, 400);
    } catch (err: any) {
      setPrecisaConfirmar(err?.codigo === "EMAIL_NAO_CONFIRMADO");
      setMessage({
        text: err.message || "E-mail ou senha incorretos!",
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
            Transforme ideias <br />
            em realidade.
          </h1>

          <p>
            Compartilhe conceitos, inspire pessoas <br />e dê uma nova chance às
            boas ideias.
          </p>

          <img
            src="/img/imagem1.png"
            alt="" aria-hidden="true"
            className="imagem-login"
          />
        </div>

        {/* Lado direito */}
        <div className="right">
          <div className="card">
            <h2>Bem-vindo de volta!</h2>
            <p>
              Faça login para continuar no <b>Ideia Futura.</b>
            </p>

            <form onSubmit={handleSubmit}>
              <label>
                <b>E-mail</b>
              </label>
              <div className="input-box">
                <i className="fa-regular fa-envelope"></i>
                <input
                  ref={emailRef} // Liga a referência ao campo email
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

              <Link to="/esqueceu-senha" className="forgot">
                Esqueceu sua senha?
              </Link>

              <button type="submit" disabled={submitting}>
                {submitting ? "Entrando..." : "Entrar"}
              </button>

              {message && (
                <p
                  id="message"
                  style={{ color: message.isError ? "red" : "green" }}
                >
                  {message.text}
                </p>
              )}

              {precisaConfirmar && <ReenviarConfirmacao email={email.trim().toLowerCase()} />}

              <div className="divisa"></div>
            </form>

            <div className="register">
              Não tem login?{" "} <Link to="/cadastro">Cadastre-se</Link>
            </div>

            <p style={{ textAlign: "center", fontSize: "12px", margin: "14px 0 0" }}>
              <Link to="/termos">Termos de Uso</Link> · <Link to="/privacidade">Política de Privacidade</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
