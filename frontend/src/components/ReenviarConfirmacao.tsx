import React, { useState } from "react";
import { fetchApi } from "../services/api";

// Botão "Reenviar e-mail de confirmação" (usado no cadastro e no login).
// Mostra um tempo de espera para ninguém clicar várias vezes seguidas.
export const ReenviarConfirmacao: React.FC<{ email: string }> = ({ email }) => {
  const [estado, setEstado] = useState<"parado" | "enviando" | "enviado" | "erro">("parado");
  const [espera, setEspera] = useState(0);

  const reenviar = async () => {
    setEstado("enviando");
    try {
      await fetchApi("/auth/reenviar-confirmacao", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setEstado("enviado");
    } catch {
      setEstado("erro");
    }

    setEspera(60);
    const relogio = window.setInterval(() => {
      setEspera((s) => {
        if (s <= 1) {
          window.clearInterval(relogio);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  return (
    <div style={{ marginTop: "12px", fontSize: "14px" }}>
      <button
        type="button"
        onClick={reenviar}
        disabled={estado === "enviando" || espera > 0 || !email}
        style={{
          width: "auto",
          height: "auto",
          padding: "9px 16px",
          fontSize: "14px",
          background: "transparent",
          color: "#1e3a8a",
          border: "1px solid #1e3a8a",
          borderRadius: "10px",
          cursor: espera > 0 ? "not-allowed" : "pointer",
          opacity: espera > 0 ? 0.6 : 1,
        }}
      >
        {espera > 0 ? `Reenviar em ${espera}s` : "Reenviar e-mail de confirmação"}
      </button>

      {estado === "enviado" && (
        <p role="status" style={{ color: "#166534", margin: "8px 0 0" }}>
          Pronto! Se houver um cadastro aguardando confirmação, o link novo está a caminho. Olhe também o spam.
        </p>
      )}
      {estado === "erro" && (
        <p role="alert" style={{ color: "#b91c1c", margin: "8px 0 0" }}>
          Não foi possível reenviar agora. Tente de novo em alguns minutos.
        </p>
      )}
    </div>
  );
};
