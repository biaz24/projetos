import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../../css/recuperar.css";
import { fetchApi } from "../services/api";

type Estado = "confirmando" | "ok" | "troca" | "erro";

export const ConfirmarEmailPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [estado, setEstado] = useState<Estado>("confirmando");
  const [mensagemErro, setMensagemErro] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function confirmar() {
      if (!token) {
        setMensagemErro("Link incompleto. Abra o link direto do e-mail.");
        setEstado("erro");
        return;
      }
      try {
        const r = await fetchApi<{ troca: boolean }>("/auth/confirmar-email", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        if (!cancelado) setEstado(r.troca ? "troca" : "ok");
      } catch (e) {
        if (!cancelado) {
          setMensagemErro(e instanceof Error ? e.message : "Não foi possível confirmar.");
          setEstado("erro");
        }
      }
    }

    void confirmar();
    return () => {
      cancelado = true;
    };
  }, [token]);

  return (
    <div className="auth-page-wrapper">
      <div className="container">
        <div className="left">
          <div className="logo">
            <span>Ideia Futura</span>
          </div>
          <h1>
            Quase lá, <br />
            só confirmar.
          </h1>
          <p>
            Confirmar o e-mail protege a plataforma <br />
            contra contas falsas.
          </p>
          <img src="/img/imagem1.png" alt="" className="imagem-recuperacao" />
        </div>

        <div className="right">
          <div className="card">
            {estado === "confirmando" && (
              <div className="card-feedback">
                <i className="fa-solid fa-spinner fa-spin feedback-icon"></i>
                <h3>Confirmando seu e-mail...</h3>
              </div>
            )}

            {(estado === "ok" || estado === "troca") && (
              <div className="card-feedback sucesso">
                <i className="fa-solid fa-circle-check feedback-icon"></i>
                <h3>{estado === "ok" ? "E-mail confirmado!" : "Novo e-mail confirmado!"}</h3>
                <p>
                  {estado === "ok"
                    ? "Sua conta está ativa. Agora é só entrar."
                    : "A troca foi concluída. Daqui para frente, entre com o e-mail novo."}
                </p>
                <Link to="/" className="btn-secondary" style={{ display: "inline-block", textDecoration: "none" }}>
                  Ir para o login
                </Link>
              </div>
            )}

            {estado === "erro" && (
              <div className="card-feedback erro">
                <i className="fa-solid fa-circle-xmark feedback-icon"></i>
                <h3>Não deu certo</h3>
                <p>{mensagemErro}</p>
                <Link to="/" className="btn-secondary" style={{ display: "inline-block", textDecoration: "none" }}>
                  Voltar para o login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
