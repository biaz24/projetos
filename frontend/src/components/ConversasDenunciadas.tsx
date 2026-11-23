import React, { useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { fetchApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import "../pages/AdminDenuncias.css";

export interface DenunciaConversa {
  ID: number;
  CONTATO_ID: number;
  MOTIVO: string;
  DESCRICAO: string | null;
  STATUS: string;
  MEDIDA: string | null;
  ADMIN_NOME: string | null;
  CREATED_AT: string;
  IDEIA_TITULO: string;
  DENUNCIANTE_NOME: string;
  AUTOR_NOME: string;
  INTERESSADO_NOME: string;
  PROPRIA_CONVERSA: boolean;
}

interface DetalheDenuncia {
  denuncia: DenunciaConversa & { JUSTIFICATIVA: string | null };
  mensagens: { ID: number; REMETENTE_NOME: string; TEXTO: string; CREATED_AT?: string }[];
}

interface Props {
  denuncias: DenunciaConversa[];
  onAtualizar: () => void;
}

const MSG_PROPRIA =
  "Você participa desta conversa. Por segurança, outro administrador precisa analisá-la.";

// Lista de conversas denunciadas. O admin só lê as mensagens ao clicar em "Ler conversa",
// e cada leitura fica registrada.
export const ConversasDenunciadas: React.FC<Props> = ({ denuncias, onAtualizar }) => {
  const { showToast } = useToast();
  const [detalhe, setDetalhe] = useState<DetalheDenuncia | null>(null);
  const [abrindoId, setAbrindoId] = useState<number | null>(null);
  const [medida, setMedida] = useState("Nenhuma");
  const [justificativa, setJustificativa] = useState("");
  const [resolvendo, setResolvendo] = useState(false);

  const abrir = async (id: number) => {
    try {
      setAbrindoId(id);
      const resposta = await fetchApi<DetalheDenuncia>(`/admin/conversas-denunciadas/${id}`);
      setDetalhe(resposta);
      setMedida("Nenhuma");
      setJustificativa("");
    } catch (erro: any) {
      showToast(erro.message || "Erro ao abrir a conversa", "error");
    } finally {
      setAbrindoId(null);
    }
  };

  const resolver = async () => {
    if (!detalhe || resolvendo) return;

    if (justificativa.trim().length < 3) {
      showToast("Escreva a justificativa da decisão.", "error");
      return;
    }

    try {
      setResolvendo(true);
      await fetchApi(`/admin/conversas-denunciadas/${detalhe.denuncia.ID}/resolver`, {
        method: "PATCH",
        body: JSON.stringify({ medida, justificativa: justificativa.trim() }),
      });
      showToast("Denúncia resolvida.", "success");
      setDetalhe(null);
      onAtualizar();
    } catch (erro: any) {
      showToast(erro.message || "Erro ao resolver a denúncia", "error");
      onAtualizar();
    } finally {
      setResolvendo(false);
    }
  };

  if (denuncias.length === 0) {
    return (
      <div className="ad-vazio">
        <div className="ad-vazio-icone">
          <i className="fa-solid fa-comments" aria-hidden="true"></i>
        </div>
        <h3>Nenhuma conversa denunciada</h3>
        <p>
          Se alguém denunciar uma conversa privada, ela aparece aqui. Você só
          lê as mensagens quando abrir a denúncia.
        </p>
      </div>
    );
  }

  const resolvida = detalhe?.denuncia.STATUS !== "Pendente";
  const primeiroRemetente = detalhe?.mensagens[0]?.REMETENTE_NOME;

  return (
    <>
      <div className="ad-lista">
        {denuncias.map((d, indice) => (
          <article
            key={d.ID}
            className="ad-card"
            data-status={d.STATUS}
            style={{ "--ad-atraso": `${Math.min(indice, 8) * 45}ms` } as CSSProperties}
          >
            <div className="ad-card-topo">
              <div className="ad-card-titulo">
                <h3>{d.IDEIA_TITULO}</h3>
                <span className="ad-tag">
                  <i className="fa-solid fa-comments" aria-hidden="true"></i>
                  Conversa privada
                </span>
              </div>
              <span className="ad-status" data-status={d.STATUS}>
                {d.STATUS}
              </span>
            </div>

            <p className="ad-meta">
              <span>
                Denunciada por <b>{d.DENUNCIANTE_NOME}</b>
              </span>
              <span>
                Autor <b>{d.AUTOR_NOME}</b>
              </span>
              <span>
                Interessado <b>{d.INTERESSADO_NOME}</b>
              </span>
            </p>

            <div className="ad-motivo">
              <i className="fa-solid fa-flag" aria-hidden="true"></i>
              <div>
                <strong>{d.MOTIVO}</strong>
                {d.DESCRICAO && <p>{d.DESCRICAO}</p>}
              </div>
            </div>

            {d.PROPRIA_CONVERSA && (
              <div className="ad-aviso">
                <i className="fa-solid fa-user-shield" aria-hidden="true"></i>
                <span>{MSG_PROPRIA}</span>
              </div>
            )}

            <div className="ad-card-rodape">
              <span className="ad-id">
                Denúncia de conversa #{d.ID}
                {d.STATUS === "Resolvida" && d.ADMIN_NOME
                  ? ` · decidida por ${d.ADMIN_NOME} (${d.MEDIDA})`
                  : ""}
              </span>

              <div className="ad-acoes">
                <button
                  type="button"
                  className="ad-btn ad-btn--azul"
                  disabled={d.PROPRIA_CONVERSA || abrindoId === d.ID}
                  onClick={() => abrir(d.ID)}
                >
                  <i className="fa-solid fa-book-open" aria-hidden="true"></i>
                  Ler conversa
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {detalhe &&
        createPortal(
          <div className="ad-fundo ad-fundo--centro" onClick={() => setDetalhe(null)}>
            <div
              className="ad-janela"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ad-conversa-titulo"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ad-painel-topo">
                <div>
                  <span className="ad-painel-sub">
                    Denúncia de conversa #{detalhe.denuncia.ID}
                  </span>
                  <h2 id="ad-conversa-titulo">{detalhe.denuncia.IDEIA_TITULO}</h2>
                </div>
                <button
                  type="button"
                  className="ad-fechar"
                  onClick={() => setDetalhe(null)}
                  aria-label="Fechar"
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
              </div>

              <div className="ad-painel-corpo">
                <div className="ad-aviso ad-aviso--info">
                  <i className="fa-solid fa-clipboard-check" aria-hidden="true"></i>
                  <span>
                    Esta leitura foi registrada no histórico de moderação. Use as
                    informações só para decidir esta denúncia.
                  </span>
                </div>

                <section className="ad-secao">
                  <h3>
                    <i className="fa-solid fa-flag" aria-hidden="true"></i>
                    Motivo da denúncia
                  </h3>
                  <div className="ad-motivo" style={{ marginTop: 0 }}>
                    <i className="fa-solid fa-flag" aria-hidden="true"></i>
                    <div>
                      <strong>{detalhe.denuncia.MOTIVO}</strong>
                      {detalhe.denuncia.DESCRICAO && (
                        <p style={{ WebkitLineClamp: "unset" }}>
                          {detalhe.denuncia.DESCRICAO}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="ad-secao">
                  <h3>
                    <i className="fa-solid fa-comments" aria-hidden="true"></i>
                    A conversa
                  </h3>
                  <div className="ad-conversa">
                    {detalhe.mensagens.length === 0 ? (
                      <p style={{ fontSize: 13, color: "#6b7a99" }}>
                        Ninguém enviou mensagens nesta conversa.
                      </p>
                    ) : (
                      detalhe.mensagens.map((m) => (
                        <div
                          key={m.ID}
                          className="ad-balao"
                          data-lado={m.REMETENTE_NOME === primeiroRemetente ? "a" : "b"}
                        >
                          <b>{m.REMETENTE_NOME}</b>
                          {m.TEXTO}
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="ad-secao">
                  <h3>
                    <i className="fa-solid fa-gavel" aria-hidden="true"></i>
                    {resolvida ? "Decisão" : "Sua decisão"}
                  </h3>

                  {resolvida ? (
                    <div className="ad-aviso ad-aviso--info">
                      <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
                      <span>
                        {detalhe.denuncia.MEDIDA} por {detalhe.denuncia.ADMIN_NOME}.
                        {detalhe.denuncia.JUSTIFICATIVA
                          ? ` ${detalhe.denuncia.JUSTIFICATIVA}`
                          : ""}
                      </span>
                    </div>
                  ) : (
                    <>
                      <p className="ad-passo" id="ad-passo-medida-conversa">
                        Qual medida aplicar?
                      </p>
                      <div
                        className="ad-opcoes"
                        role="radiogroup"
                        aria-labelledby="ad-passo-medida-conversa"
                      >
                        <label className="ad-opcao ad-opcao--ok">
                          <input
                            type="radio"
                            name="medida-conversa"
                            value="Nenhuma"
                            checked={medida === "Nenhuma"}
                            onChange={() => setMedida("Nenhuma")}
                          />
                          <span className="ad-opcao-corpo">
                            <span className="ad-opcao-icone">
                              <i className="fa-solid fa-shield-heart" aria-hidden="true"></i>
                            </span>
                            <span>
                              <b>Nenhuma</b>
                              <small>A denúncia não tem fundamento.</small>
                            </span>
                          </span>
                        </label>

                        <label className="ad-opcao ad-opcao--bad">
                          <input
                            type="radio"
                            name="medida-conversa"
                            value="Encerrar conversa"
                            checked={medida === "Encerrar conversa"}
                            onChange={() => setMedida("Encerrar conversa")}
                          />
                          <span className="ad-opcao-corpo">
                            <span className="ad-opcao-icone">
                              <i className="fa-solid fa-lock" aria-hidden="true"></i>
                            </span>
                            <span>
                              <b>Encerrar conversa</b>
                              <small>Ninguém mais envia mensagens aqui.</small>
                            </span>
                          </span>
                        </label>
                      </div>

                      <label
                        className="ad-rotulo"
                        htmlFor="justificativa-conversa"
                        style={{ marginTop: 20 }}
                      >
                        Justificativa <small>(fica registrada no histórico)</small>
                      </label>
                      <textarea
                        id="justificativa-conversa"
                        className="ad-campo"
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                        rows={4}
                        maxLength={1000}
                        placeholder="Explique os motivos da decisão..."
                      />
                      <p className="ad-contador">{justificativa.length}/1000</p>
                    </>
                  )}
                </section>
              </div>

              <div className="ad-painel-rodape" style={{ justifyContent: "flex-end" }}>
                <div className="ad-acoes">
                  <button
                    type="button"
                    className="ad-btn ad-btn--suave"
                    onClick={() => setDetalhe(null)}
                  >
                    Fechar
                  </button>
                  {!resolvida && (
                    <button
                      type="button"
                      className="ad-btn ad-btn--ok"
                      disabled={resolvendo}
                      onClick={resolver}
                    >
                      <i className="fa-solid fa-check" aria-hidden="true"></i>
                      Concluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
