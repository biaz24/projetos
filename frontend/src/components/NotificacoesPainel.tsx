import React, { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { Notificacao } from "../types";
import "./Notificacoes.css";

interface Props {
  notificacoes: Notificacao[];
  carregando: boolean;
  naoLidas: number;
  aparencia: (tipo: string) => { icone: string; cor: string };
  tempo: (data?: string) => string;
  aoAbrir: (notificacao: Notificacao) => void;
  aoMarcarTodas: () => void;
  aoFechar: () => void;
}

export const NotificacoesPainel: React.FC<Props> = ({
  notificacoes,
  carregando,
  naoLidas,
  aparencia,
  tempo,
  aoAbrir,
  aoMarcarTodas,
  aoFechar,
}) => {
  const [somenteNovas, setSomenteNovas] = useState(false);

  // Se não sobrou nenhuma não lida, volta para "Todas" para não mostrar tela vazia.
  useEffect(() => {
    if (somenteNovas && naoLidas === 0) setSomenteNovas(false);
  }, [somenteNovas, naoLidas]);

  const lista = somenteNovas ? notificacoes.filter((n) => !n.LIDA) : notificacoes;

  return createPortal(
    <>
      <div className="nt-fundo" onClick={aoFechar} />

      <div className="nt-painel" role="dialog" aria-label="Notificações">
        <div className="nt-topo">
          <div className="nt-titulo">
            <h2>Notificações</h2>
            {naoLidas > 0 && (
              <span className="nt-contagem">
                {naoLidas} {naoLidas === 1 ? "nova" : "novas"}
              </span>
            )}
          </div>

          <button type="button" className="nt-fechar" onClick={aoFechar} aria-label="Fechar notificações">
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <div className="nt-barra">
          <button type="button" className="nt-aba" aria-pressed={!somenteNovas} onClick={() => setSomenteNovas(false)}>
            Todas
          </button>
          <button
            type="button"
            className="nt-aba"
            aria-pressed={somenteNovas}
            onClick={() => setSomenteNovas(true)}
            disabled={naoLidas === 0}
          >
            Não lidas
          </button>

          {naoLidas > 0 && (
            <button type="button" className="nt-todas" onClick={aoMarcarTodas}>
              <i className="fa-solid fa-check-double" aria-hidden="true"></i> Marcar todas<span className="nt-extra"> como lidas</span>
            </button>
          )}
        </div>

        <div className="nt-lista">
          {carregando && notificacoes.length === 0 ? (
            [0, 1, 2].map((n) => (
              <div className="nt-esqueleto" key={n} aria-hidden="true">
                <span></span>
                <span></span>
              </div>
            ))
          ) : lista.length === 0 ? (
            <div className="nt-vazio">
              <span className="nt-vazio-icone" aria-hidden="true">
                <i className="fa-regular fa-bell"></i>
              </span>
              <b>Tudo em dia</b>
              <p>
                Quando alguém responder sua ideia ou pedir contato, o aviso
                aparece aqui.
              </p>
            </div>
          ) : (
            lista.map((notificacao, indice) => {
              const lida = Boolean(notificacao.LIDA);
              const { icone, cor } = aparencia(notificacao.TIPO);

              return (
                <button
                  key={notificacao.ID}
                  type="button"
                  className="nt-item"
                  data-lida={lida}
                  style={
                    {
                      "--nt-cor": cor,
                      "--nt-atraso": `${Math.min(indice, 8) * 35}ms`,
                    } as CSSProperties
                  }
                  onClick={() => aoAbrir(notificacao)}
                >
                  <span className="nt-icone" aria-hidden="true">
                    <i className={`fa-solid ${icone}`}></i>
                  </span>

                  <span className="nt-texto">
                    <b>{notificacao.TITULO}</b>
                    <p>{notificacao.MENSAGEM}</p>
                    <small>{tempo(notificacao.CREATED_AT)}</small>
                  </span>

                  {!lida && <span className="nt-ponto" aria-label="Não lida"></span>}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>,
    document.body,
  );
};
