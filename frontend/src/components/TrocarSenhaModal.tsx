import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fetchApi } from "../services/api";
import "./SegurancaConta.css";

interface Props {
  aoFechar: () => void;
  aoConcluir: () => void;
}

// Mesma regra do backend (utils/validacao.js)
const REGRAS: { texto: string; ok: (s: string) => boolean }[] = [
  { texto: "8 a 72 caracteres", ok: (s) => s.length >= 8 && s.length <= 72 },
  { texto: "Uma letra maiúscula", ok: (s) => /[A-Z]/.test(s) },
  { texto: "Um número", ok: (s) => /[0-9]/.test(s) },
  { texto: "Um caractere especial", ok: (s) => /[^A-Za-z0-9]/.test(s) },
];

export const TrocarSenhaModal: React.FC<Props> = ({ aoFechar, aoConcluir }) => {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const primeiro = useRef<HTMLInputElement>(null);

  useEffect(() => {
    primeiro.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !enviando) aoFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar, enviando]);

  const forte = REGRAS.every((r) => r.ok(nova));
  const iguais = nova !== "" && nova === confirmar;
  const podeEnviar = atual !== "" && forte && iguais && nova !== atual && !enviando;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEnviar) return;
    setEnviando(true);
    setErro("");
    try {
      await fetchApi("/usuarios/me/senha", {
        method: "PUT",
        body: JSON.stringify({ senhaAtual: atual, novaSenha: nova }),
      });
      aoConcluir();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível trocar a senha.");
    } finally {
      setEnviando(false);
    }
  };

  const tipo = mostrar ? "text" : "password";

  return createPortal(
    <div className="sg-fundo" onMouseDown={(e) => e.target === e.currentTarget && !enviando && aoFechar()}>
      <form className="sg-janela" role="dialog" aria-modal="true" aria-labelledby="sg-t1" onSubmit={enviar}>
        <h2 id="sg-t1">Alterar senha</h2>
        <p className="sg-sub">
          Ao trocar, você continua conectado neste aparelho e as outras sessões são encerradas.
        </p>

        {erro && (
          <p className="sg-erro" role="alert">
            {erro}
          </p>
        )}

        <div className="sg-campo">
          <label htmlFor="sg-atual">Senha atual</label>
          <div className="sg-entrada">
            <input
              id="sg-atual"
              ref={primeiro}
              type={tipo}
              autoComplete="current-password"
              value={atual}
              onChange={(e) => setAtual(e.target.value)}
            />
            <button type="button" className="sg-olho" onClick={() => setMostrar(!mostrar)} aria-label={mostrar ? "Esconder senhas" : "Mostrar senhas"}>
              <i className={`fa-regular ${mostrar ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <div className="sg-campo">
          <label htmlFor="sg-nova">Nova senha</label>
          <div className="sg-entrada">
            <input id="sg-nova" type={tipo} autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} />
          </div>
        </div>

        <ul className="sg-regras" aria-label="Regras da nova senha">
          {REGRAS.map((r) => (
            <li key={r.texto} data-ok={r.ok(nova)}>
              <i className={`fa-solid ${r.ok(nova) ? "fa-circle-check" : "fa-circle"}`} style={{ fontSize: "10px" }} aria-hidden="true"></i>
              {r.texto}
            </li>
          ))}
        </ul>

        <div className="sg-campo">
          <label htmlFor="sg-conf">Repita a nova senha</label>
          <div className="sg-entrada">
            <input id="sg-conf" type={tipo} autoComplete="new-password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
          </div>
          {confirmar !== "" && !iguais && <p className="sg-erro" style={{ marginTop: 8 }}>As senhas não são iguais.</p>}
          {nova !== "" && nova === atual && <p className="sg-erro" style={{ marginTop: 8 }}>A nova senha precisa ser diferente da atual.</p>}
        </div>

        <div className="sg-rodape">
          <button type="button" className="sg-btn" onClick={aoFechar} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="sg-btn sg-principal" disabled={!podeEnviar}>
            {enviando ? "Salvando..." : "Alterar senha"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
};
