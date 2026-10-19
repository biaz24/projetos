import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import "../../css/recuperar.css";
import { fetchApi } from "../services/api";

export const RedefinirSenhaPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  // Estados de controle do fluxo
  const [validandoToken, setValidandoToken] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [contadorRedirecionamento, setContadorRedirecionamento] = useState(3);

  // Validação em tempo real dos requisitos
  const temOitoCaracteres = novaSenha.length >= 8;
  const senhasCoincidem = novaSenha.length > 0 && novaSenha === confirmarSenha;
  const formularioValido = temOitoCaracteres && senhasCoincidem;

  // 1. Validação inicial do token ao carregar a página
  useEffect(() => {
    let cancelado = false;

    async function checarToken() {
      if (!token) {
        setTokenValido(false);
        setValidandoToken(false);
        return;
      }

      try {
        await fetchApi<{ valido: boolean }>(
          `/redefinir-senha/validar?token=${encodeURIComponent(token)}`,
          { method: "GET" },
        );

        if (!cancelado) {
          setTokenValido(true);
        }
      } catch (err) {
        if (!cancelado) {
          setTokenValido(false);
        }
      } finally {
        if (!cancelado) {
          setValidandoToken(false);
        }
      }
    }

    checarToken();

    return () => {
      cancelado = true;
    };
  }, [token]);

  // 2. Redirecionamento automático após sucesso
  useEffect(() => {
    if (!sucesso) return;

    const timer = setInterval(() => {
      setContadorRedirecionamento((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sucesso, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!token) {
      setErro("Link de recuperação inválido ou ausente.");
      return;
    }

    if (!temOitoCaracteres) {
      setErro("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }

    if (!senhasCoincidem) {
      setErro("As senhas digitadas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      await fetchApi<{ mensagem: string }>("/redefinir-senha", {
        method: "POST",
        body: JSON.stringify({
          token,
          novaSenha,
        }),
      });

      setSucesso(true);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível redefinir a senha.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="container">
        {/* Painel Esquerdo com Identidade Visual */}
        <div className="left">
          <div className="logo">
            <span>Ideia Futura</span>
          </div>

          <h1>
            Defina sua <br />
            nova senha.
          </h1>

          <p>
            Crie uma combinação forte e segura <br />
            para proteger seus projetos e ideias.
          </p>

          <img
            src="/img/imagem1.png"
            alt="Ilustração do sistema"
            className="imagem-recuperacao"
          />
        </div>

        {/* Painel Direito com Formulário ou Feedbacks */}
        <div className="right">
          <div className="card">
            {/* ESTADO 1: Carregando validação do token */}
            {validandoToken && (
              <div className="card-feedback">
                <i className="fa-solid fa-circle-notch fa-spin feedback-icon" style={{ color: "#1e3a8a" }}></i>
                <h3>Verificando link de recuperação...</h3>
                <p>Por favor, aguarde enquanto validamos sua solicitação.</p>
              </div>
            )}

            {/* ESTADO 2: Token inválido ou expirado */}
            {!validandoToken && !tokenValido && !sucesso && (
              <div className="card-feedback erro">
                <i className="fa-solid fa-triangle-exclamation feedback-icon"></i>
                <h3>Link inválido ou expirado</h3>
                <p>
                  O link de recuperação acessado não é válido, já foi utilizado ou expirou o prazo de 15 minutos.
                </p>
                <Link to="/esqueceu-senha">
                  <button type="button">Solicitar novo link</button>
                </Link>
                <div className="register">
                  <Link to="/">
                    <i className="fa-solid fa-arrow-left" style={{ marginRight: "5px" }}></i>
                    Voltar para o login
                  </Link>
                </div>
              </div>
            )}

            {/* ESTADO 3: Sucesso */}
            {!validandoToken && sucesso && (
              <div className="card-feedback sucesso">
                <i className="fa-solid fa-circle-check feedback-icon"></i>
                <h3>Senha redefinida com sucesso!</h3>
                <p>
                  Sua conta já está com a nova senha ativa. Redirecionando para a tela de login em{" "}
                  <b>{contadorRedirecionamento}</b> segundo{contadorRedirecionamento !== 1 ? "s" : ""}...
                </p>
                <Link to="/">
                  <button type="button">Ir para o login agora</button>
                </Link>
              </div>
            )}

            {/* ESTADO 4: Formulário de Redefinição */}
            {!validandoToken && tokenValido && !sucesso && (
              <>
                <h2>Redefinir senha</h2>
                <p>Escolha uma nova senha para acessar sua conta.</p>

                {erro && (
                  <div className="alert-box" role="alert">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{erro}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <label htmlFor="novaSenha">
                    <b>Nova senha</b>
                  </label>
                  <div className="input-box">
                    <i className="fa-solid fa-lock"></i>
                    <input
                      id="novaSenha"
                      type={mostrarSenha ? "text" : "password"}
                      placeholder="Mínimo de 8 caracteres"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      required
                      minLength={8}
                      maxLength={128}
                    />
                    <i
                      className={`fa-regular ${mostrarSenha ? "fa-eye-slash" : "fa-eye"} toggle-senha`}
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      title={mostrarSenha ? "Ocultar senha" : "Exibir senha"}
                    ></i>
                  </div>

                  <label htmlFor="confirmarSenha">
                    <b>Confirmar nova senha</b>
                  </label>
                  <div className="input-box">
                    <i className="fa-solid fa-lock"></i>
                    <input
                      id="confirmarSenha"
                      type={mostrarConfirmar ? "text" : "password"}
                      placeholder="Digite a senha novamente"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      required
                      minLength={8}
                      maxLength={128}
                    />
                    <i
                      className={`fa-regular ${mostrarConfirmar ? "fa-eye-slash" : "fa-eye"} toggle-senha`}
                      onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                      title={mostrarConfirmar ? "Ocultar senha" : "Exibir senha"}
                    ></i>
                  </div>

                  {/* Checklist visual de requisitos */}
                  <div className="requisitos-senha">
                    <p>Requisitos da senha:</p>
                    <div className={`requisito-item ${temOitoCaracteres ? "atendido" : "nao-atendido"}`}>
                      <i className={`fa-solid ${temOitoCaracteres ? "fa-check" : "fa-circle-dot"}`}></i>
                      <span>Pelo menos 8 caracteres</span>
                    </div>
                    <div className={`requisito-item ${senhasCoincidem ? "atendido" : "nao-atendido"}`}>
                      <i className={`fa-solid ${senhasCoincidem ? "fa-check" : "fa-circle-dot"}`}></i>
                      <span>As senhas coincidem</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !formularioValido}
                    style={{
                      opacity: loading || !formularioValido ? 0.7 : 1,
                      cursor: loading || !formularioValido ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Salvando nova senha..." : "Redefinir senha"}
                  </button>
                </form>

                <div className="register">
                  <Link to="/">
                    <i className="fa-solid fa-arrow-left" style={{ marginRight: "5px" }}></i>
                    Voltar para o login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
