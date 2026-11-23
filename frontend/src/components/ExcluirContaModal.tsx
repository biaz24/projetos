import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fetchApi } from "../services/api";
import "./SegurancaConta.css";

interface Props {
  usuarioId: number;
  aoFechar: () => void;
  aoExcluida: () => void;
}

export const ExcluirContaModal: React.FC<Props> = ({ usuarioId, aoFechar, aoExcluida }) => {
  const [senha, setSenha] = useState("");
  const [entendi, setEntendi] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    campo.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !enviando) aoFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar, enviando]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senha || !entendi || enviando) return;
    setEnviando(true);
    setErro("");
    try {
      await fetchApi(`/usuarios/${usuarioId}`, {
        method: "DELETE",
        body: JSON.stringify({ senha }),
      });
      aoExcluida();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível excluir a conta.");
      setEnviando(false);
    }
  };

  return createPortal(
    <div className="sg-fundo" onMouseDown={(e) => e.target === e.currentTarget && !enviando && aoFechar()}>
      <form className="sg-janela" role="alertdialog" aria-modal="true" aria-labelledby="sg-t2" onSubmit={enviar}>
        <h2 id="sg-t2">Excluir minha conta</h2>
        <p className="sg-aviso">
          Isto não tem volta. Sua conta, suas ideias, comentários e conversas serão apagados. O histórico de denúncias
          e decisões de moderação pode ser mantido por segurança (veja a Política de Privacidade).
        </p>

        {erro && (
          <p className="sg-erro" role="alert">
            {erro}
          </p>
        )}

        <div className="sg-campo">
          <label htmlFor="sg-senha-ex">Digite sua senha para confirmar</label>
          <div className="sg-entrada">
            <input id="sg-senha-ex" ref={campo} type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, lineHeight: 1.4, margin: "0 0 12px", cursor: "pointer" }}>
          <input type="checkbox" checked={entendi} onChange={(e) => setEntendi(e.target.checked)} style={{ width: "auto", height: "auto", marginTop: 2 }} />
          Entendo que a exclusão é definitiva.
        </label>

        <div className="sg-rodape">
          <button type="button" className="sg-btn" onClick={aoFechar} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="sg-btn sg-perigo-cheio" disabled={!senha || !entendi || enviando}>
            {enviando ? "Excluindo..." : "Excluir para sempre"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
};
