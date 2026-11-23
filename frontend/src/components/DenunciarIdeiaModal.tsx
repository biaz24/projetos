import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./DenunciarIdeiaModal.css";

// Os textos de "valor" são os que o backend recebe e a moderação lê.
const MOTIVOS = [
  { valor: "Conteúdo inadequado", icone: "fa-ban", dica: "Não combina com o site" },
  { valor: "Conteúdo ofensivo", icone: "fa-hand", dica: "Ofende ou desrespeita pessoas" },
  { valor: "Spam", icone: "fa-bullhorn", dica: "Propaganda ou repetição" },
  { valor: "Informação enganosa", icone: "fa-circle-question", dica: "Falsa ou que engana" },
  { valor: "Violação das regras", icone: "fa-scale-balanced", dica: "Quebra as regras da comunidade" },
  { valor: "Outro", icone: "fa-ellipsis", dica: "Conte o que aconteceu" },
] as const;

const DESCRICAO_MAX = 2000;
const OUTRO_MIN = 10;

interface Props {
  tituloIdeia: string;
  enviando: boolean;
  aoFechar: () => void;
  aoEnviar: (motivo: string, descricao: string) => void;
}

export const DenunciarIdeiaModal: React.FC<Props> = ({
  tituloIdeia,
  enviando,
  aoFechar,
  aoEnviar,
}) => {
  const [motivo, setMotivo] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    const aoApertar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape" && !enviando) aoFechar();
    };

    window.addEventListener("keydown", aoApertar);
    return () => window.removeEventListener("keydown", aoApertar);
  }, [aoFechar, enviando]);

  const precisaDescrever = motivo === "Outro";
  const descricaoValida =
    !precisaDescrever || descricao.trim().length >= OUTRO_MIN;
  const podeEnviar = Boolean(motivo) && descricaoValida && !enviando;

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEnviar) return;
    aoEnviar(motivo, descricao.trim());
  };

  return createPortal(
    <div className="dn-fundo" onClick={() => !enviando && aoFechar()}>
      <div
        className="dn-janela"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dn-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dn-topo">
          <span className="dn-icone" aria-hidden="true">
            <i className="fa-solid fa-flag"></i>
          </span>

          <div className="dn-topo-texto">
            <h2 id="dn-titulo">Denunciar ideia</h2>
            <p>
              <b>{tituloIdeia}</b>
            </p>
          </div>

          <button
            type="button"
            className="dn-fechar"
            onClick={aoFechar}
            disabled={enviando}
            aria-label="Fechar"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <form onSubmit={enviar}>
          <div className="dn-corpo">
            <div className="dn-aviso dn-aviso--azul">
              <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
              <span>
                O autor não vê quem denunciou. Só a moderação analisa. Denuncie
                o que desrespeita as regras: discordar de uma ideia não é motivo.
              </span>
            </div>

            <p className="dn-passo" id="dn-passo-motivo">
              Qual é o problema?
            </p>
            <div
              className="dn-motivos"
              role="radiogroup"
              aria-labelledby="dn-passo-motivo"
            >
              {MOTIVOS.map((opcao) => (
                <label key={opcao.valor} className="dn-motivo">
                  <input
                    type="radio"
                    name="motivo-denuncia"
                    value={opcao.valor}
                    checked={motivo === opcao.valor}
                    onChange={() => setMotivo(opcao.valor)}
                  />
                  <span className="dn-motivo-corpo">
                    <span className="dn-motivo-icone">
                      <i className={`fa-solid ${opcao.icone}`} aria-hidden="true"></i>
                    </span>
                    <span>
                      <b>{opcao.valor}</b>
                      <small>{opcao.dica}</small>
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <label className="dn-passo" htmlFor="dn-descricao">
              Quer explicar melhor?{" "}
              <small>
                {precisaDescrever
                  ? `(obrigatório, mínimo ${OUTRO_MIN} letras)`
                  : "(opcional)"}
              </small>
            </label>
            <textarea
              id="dn-descricao"
              className="dn-campo"
              rows={4}
              maxLength={DESCRICAO_MAX}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Conte rapidamente o que você viu..."
            />
            <p className="dn-contador">
              {descricao.length}/{DESCRICAO_MAX}
            </p>
          </div>

          <div className="dn-rodape">
            <button
              type="button"
              className="dn-btn dn-btn--suave"
              onClick={aoFechar}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button type="submit" className="dn-btn dn-btn--perigo" disabled={!podeEnviar}>
              <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
              {enviando ? "Enviando..." : "Enviar denúncia"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
