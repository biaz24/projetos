import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReenviarConfirmacao } from "../components/ReenviarConfirmacao";
import "../../css/style.css";

export const CadastroPage: React.FC = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aceito, setAceito] = useState(false);
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);

  const { cadastrar } = useAuth();

  const nomeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nomeRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (senha !== confirmarSenha) {
      setMessage({ text: "As senhas não são iguais!", isError: true });
      return;
    }

    // Mesma regra do backend (usuarioController e redefinição de senha)
    const senhaForte =
      senha.length >= 8 &&
      senha.length <= 72 &&
      /[A-Z]/.test(senha) &&
      /[0-9]/.test(senha) &&
      /[^A-Za-z0-9]/.test(senha);

    if (!senhaForte) {
      setMessage({
        text: "A senha deve ter de 8 a 72 caracteres, com uma letra maiúscula, um número e um caractere especial.",
        isError: true,
      });
      return;
    }

    if (!aceito) {
      setMessage({
        text: "Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.",
        isError: true,
      });
      return;
    }

    setSubmitting(true);

    try {
      await cadastrar(nome, email, senha, aceito);
      // Sem login automático: a conta só entra depois de confirmar o e-mail.
      setEnviadoPara(email.trim().toLowerCase());
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

          {/* Imagem para o tema claro */}
          <img
            src="/img/imagem2.png"
            alt=""
            aria-hidden="true"
            className="imagem-login imagem-login-clara"
          />

          {/* Imagem para o tema escuro */}
          <img
            src="/img/imagem2escura.png"
            alt=""
            aria-hidden="true"
            className="imagem-login imagem-login-escura"
          />
        </div>

        {/* Lado direito */}
        <div className="right">
          <div className="card">
            {enviadoPara ? (
              <div style={{ textAlign: "center" }}>
                <i
                  className="fa-regular fa-envelope-open"
                  style={{
                    fontSize: "44px",
                    color: "#1e3a8a",
                    marginBottom: "12px",
                  }}
                ></i>
                <h2>Confira seu e-mail</h2>
                <p>
                  Enviamos um link de confirmação para <b>{enviadoPara}</b>.
                  Clique nele para ativar sua conta (vale por 24 horas). Se não
                  achar, olhe a caixa de spam.
                </p>
                <ReenviarConfirmacao email={enviadoPara} />
                <div className="register" style={{ marginTop: "22px" }}>
                  Já confirmou? <Link to="/">Faça login</Link>
                </div>
              </div>
            ) : (
              <>
                <h2>Crie sua conta</h2>
                <p>Preencha os dados para se cadastrar</p>

                <form onSubmit={handleSubmit}>
                  <label>
                    <b>Nome de usuário</b>
                  </label>
                  <div className="input-box">
                    <i className="fa-regular fa-user"></i>
                    <input
                      ref={nomeRef}
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
                      onClick={() =>
                        setMostrarConfirmarSenha(!mostrarConfirmarSenha)
                      }
                      style={{ cursor: "pointer" }}
                    ></i>
                  </div>

                  <label
                    htmlFor="aceite-termos"
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      fontSize: "13px",
                      lineHeight: 1.45,
                      margin: "0 0 18px",
                      cursor: "pointer",
                      fontWeight: "normal",
                    }}
                  >
                    <input
                      id="aceite-termos"
                      type="checkbox"
                      checked={aceito}
                      onChange={(e) => setAceito(e.target.checked)}
                      style={{
                        width: "18px",
                        height: "18px",
                        flexShrink: 0,
                        marginTop: "1px",
                        cursor: "pointer",
                      }}
                    />
                    <span>
                      Li e aceito os{" "}
                      <Link
                        to="/termos"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Termos de Uso
                      </Link>{" "}
                      e a{" "}
                      <Link
                        to="/privacidade"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Política de Privacidade
                      </Link>
                      .
                    </span>
                  </label>

                  <button type="submit" disabled={submitting}>
                    {submitting ? "Cadastrando..." : "Cadastrar"}
                  </button>

                  {message && (
                    <p
                      id="message"
                      style={{
                        color: message.isError ? "red" : "green",
                        marginTop: "15px",
                      }}
                    >
                      {message.text}
                    </p>
                  )}

                  <div className="divisa"></div>
                </form>

                <div className="register">
                  Já tem uma conta? <Link to="/">Faça login</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
