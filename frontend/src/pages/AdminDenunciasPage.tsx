import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AppLayout } from "../components/AppLayout";
import { fetchApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import {
  ConversasDenunciadas,
  type DenunciaConversa,
} from "../components/ConversasDenunciadas";
import { PenalidadeUsuarioModal } from "../components/PenalidadeUsuarioModal";
import "./AdminDenuncias.css";

interface Denuncia {
  ID: number;
  IDEIAS_ID: number | null;
  IDEIA_ID_ORIGINAL?: number | null;
  USUARIOS_ID: number;
  MOTIVO: string;
  DESCRICAO: string | null;
  STATUS: string;
  CREATED_AT: string;
  RESOLVIDA_AT: string | null;
  IDEIA_TITULO: string;
  IDEIA_DESCRICAO?: string;
  CATEGORIA_IDEIA?: string;
  USUARIO_NOME: string;
  AUTOR_NOME: string;
  AUTOR_ID?: number | null;
  IDEIA_EXCLUIDA?: boolean;
  PROPRIA_IDEIA?: boolean; // a ideia é do administrador que está logado
  ADMIN_NOME?: string | null; // quem concluiu a análise
}
interface IdeiaDetalhada {
  ID: number;
  USUARIOS_ID: number;
  TITULO: string;
  DESCRICAO: string;
  CATEGORIA?: string;
  STATUS?: string;
  ANONIMO?: boolean | number;
  NOME_AUTOR?: string;
}

interface RascunhoDenuncia {
  RESULTADO: string | null;
  MEDIDA_APLICADA: string | null;
  JUSTIFICATIVA: string | null;
}

// Ideia que foi ocultada pela moderação e reenviada pelo autor para uma nova análise
interface IdeiaReanalise {
  ID: number;
  TITULO: string;
  DESCRICAO: string;
  CATEGORIA?: string;
  ANONIMO?: boolean | number;
  MOTIVO_MODERACAO?: string | null;
  NOME_AUTOR?: string;
  PROPRIA_IDEIA?: boolean;
}

const MSG_PROPRIA_IDEIA =
  "Esta ideia é sua. Por segurança, outro administrador precisa decidir.";

const FILTRO_REANALISE = "Reanálise";
const FILTRO_CONVERSAS = "Conversas";

// "há 2 dias", "há 3 h"... a partir de uma data ISO
const tempoRelativo = (data?: string | null) => {
  if (!data) return "";
  const instante = new Date(data).getTime();
  if (Number.isNaN(instante)) return "";

  const minutos = Math.max(0, Math.round((Date.now() - instante) / 60000));
  if (minutos < 1) return "agora há pouco";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias < 30) return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
  return new Date(data).toLocaleDateString("pt-BR");
};

const atrasoDoCartao = (indice: number): CSSProperties =>
  ({ "--ad-atraso": `${Math.min(indice, 8) * 45}ms` }) as CSSProperties;

const MEDIDAS = [
  { valor: "Aviso", rotulo: "Aviso ao autor", icone: "fa-bell" },
  { valor: "Ocultar ideia", rotulo: "Ocultar / refazer ideia", icone: "fa-eye-slash" },
  { valor: "Excluir ideia", rotulo: "Excluir ideia", icone: "fa-trash" },
] as const;

const DICAS_MEDIDA: Record<string, string> = {
  "Ocultar ideia":
    "A ideia sai do ar, mas o autor pode reformulá-la e reenviar para uma nova análise.",
  "Excluir ideia":
    "A ideia é removida de vez. O histórico desta denúncia continua guardado.",
};

export default function AdminDenunciasPage() {
  const [penalidadeAlvo, setPenalidadeAlvo] = useState<{ usuarioId: number; denunciaId: number } | null>(null);
  const { showToast } = useToast();

  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("Todas");
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null);
  const [denunciaSelecionada, setDenunciaSelecionada] =
    useState<Denuncia | null>(null);

  const [ideiaDetalhada, setIdeiaDetalhada] = useState<IdeiaDetalhada | null>(
    null,
  );
  const [rascunhoCarregadoId, setRascunhoCarregadoId] = useState<number | null>(
    null,
  );

  const [rascunho, setRascunho] = useState<RascunhoDenuncia>({
    RESULTADO: "",
    MEDIDA_APLICADA: "",
    JUSTIFICATIVA: "",
  });

  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [statusRascunho, setStatusRascunho] = useState("");

  // Reanálise: ideias ocultadas que o autor reformulou e reenviou
  const [reanalises, setReanalises] = useState<IdeiaReanalise[]>([]);
  const [rejeitandoId, setRejeitandoId] = useState<number | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [decidindoId, setDecidindoId] = useState<number | null>(null);

  // Conversas (chat entre interessado e autor) que foram denunciadas
  const [conversasDenunciadas, setConversasDenunciadas] = useState<DenunciaConversa[]>([]);

  const carregarConversasDenunciadas = async () => {
    try {
      const resposta = await fetchApi<DenunciaConversa[]>("/admin/conversas-denunciadas");
      setConversasDenunciadas(Array.isArray(resposta) ? resposta : []);
    } catch (erro: any) {
      showToast(erro.message || "Erro ao carregar as conversas denunciadas", "error");
    }
  };

  const carregarReanalises = async () => {
    try {
      const resposta = await fetchApi<IdeiaReanalise[]>("/admin/ideias-revisao");
      setReanalises(Array.isArray(resposta) ? resposta : []);
    } catch (erro: any) {
      showToast(erro.message || "Erro ao carregar as reanálises", "error");
    }
  };

  const aprovarReanalise = async (id: number) => {
    if (reanalises.find((i) => i.ID === id)?.PROPRIA_IDEIA) {
      showToast(MSG_PROPRIA_IDEIA, "error");
      return;
    }

    try {
      setDecidindoId(id);
      await fetchApi(`/admin/ideias/${id}/aprovar`, { method: "PATCH" });
      setReanalises((atuais) => atuais.filter((ideia) => ideia.ID !== id));
      showToast("Ideia aprovada e publicada novamente.", "success");
    } catch (erro: any) {
      showToast(erro.message || "Erro ao aprovar a ideia", "error");
      carregarReanalises();
    } finally {
      setDecidindoId(null);
    }
  };

  const rejeitarReanalise = async (id: number) => {
    const motivo = motivoRejeicao.trim();

    if (reanalises.find((i) => i.ID === id)?.PROPRIA_IDEIA) {
      showToast(MSG_PROPRIA_IDEIA, "error");
      return;
    }

    if (motivo.length < 3) {
      showToast("Explique o motivo da rejeição (mínimo 3 caracteres).", "error");
      return;
    }

    try {
      setDecidindoId(id);
      await fetchApi(`/admin/ideias/${id}/rejeitar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo }),
      });
      setReanalises((atuais) => atuais.filter((ideia) => ideia.ID !== id));
      setRejeitandoId(null);
      setMotivoRejeicao("");
      showToast("Ideia rejeitada. O autor foi avisado.", "success");
    } catch (erro: any) {
      showToast(erro.message || "Erro ao rejeitar a ideia", "error");
      carregarReanalises();
    } finally {
      setDecidindoId(null);
    }
  };

  const carregarDenuncias = async () => {
    try {
      setLoading(true);

      const resposta = await fetchApi<any>("/denuncias");

      setDenuncias(resposta);
    } catch (erro: any) {
      showToast(erro.message || "Erro ao carregar denúncias", "error");
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id: number, status: string) => {
    try {
      setAtualizandoId(id);

      await fetchApi(`/denuncias/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      setDenuncias((anteriores) =>
        anteriores.map((denuncia) =>
          denuncia.ID === id
            ? {
                ...denuncia,
                STATUS: status,
                RESOLVIDA_AT:
                  status === "Resolvida" ? new Date().toISOString() : null,
              }
            : denuncia,
        ),
      );

      showToast("Status atualizado com sucesso!", "success");
    } catch (erro: any) {
      showToast(erro.message || "Erro ao atualizar o status", "error");
    } finally {
      setAtualizandoId(null);
    }
  };
  const abrirDenuncia = async (denuncia: Denuncia) => {
    try {
      setCarregandoDetalhes(true);
      setStatusRascunho("");
      const denunciaAtualizada = await fetchApi<Denuncia>(
        `/denuncias/${denuncia.ID}`,
      );

      setDenunciaSelecionada(denunciaAtualizada);
      setRascunhoCarregadoId(null);
      setIdeiaDetalhada(null);

      setRascunho({
        RESULTADO: "",
        MEDIDA_APLICADA: "",
        JUSTIFICATIVA: "",
      });

      // Busca os detalhes da ideia denunciada (se ela ainda existir)
      if (denuncia.IDEIAS_ID && !denuncia.IDEIA_EXCLUIDA) {
        try {
          const ideia = await fetchApi<IdeiaDetalhada>(
            `/admin/ideias/${denuncia.IDEIAS_ID}`,
          );
          setIdeiaDetalhada(ideia);
        } catch {
          setIdeiaDetalhada({
            ID: denuncia.IDEIA_ID_ORIGINAL || denuncia.IDEIAS_ID || 0,
            USUARIOS_ID: 0,
            TITULO: denuncia.IDEIA_TITULO || "Ideia excluída",
            DESCRICAO:
              denuncia.IDEIA_DESCRICAO ||
              "(Esta ideia foi removida, mas seu histórico de denúncia foi mantido)",
            CATEGORIA: denuncia.CATEGORIA_IDEIA || "Geral",
            STATUS: "Excluída",
            NOME_AUTOR: denuncia.AUTOR_NOME || "Não informado",
          });
        }
      } else {
        // Ideia já excluída: recupera os dados salvos no snapshot da denúncia
        setIdeiaDetalhada({
          ID: denuncia.IDEIA_ID_ORIGINAL || denuncia.IDEIAS_ID || 0,
          USUARIOS_ID: 0,
          TITULO: denuncia.IDEIA_TITULO || "Ideia excluída",
          DESCRICAO:
            denuncia.IDEIA_DESCRICAO ||
            "(Esta ideia foi removida, mas seu histórico de denúncia foi mantido)",
          CATEGORIA: denuncia.CATEGORIA_IDEIA || "Geral",
          STATUS: "Excluída",
          NOME_AUTOR: denuncia.AUTOR_NOME || "Não informado",
        });
      }

      // Busca o rascunho salvo para esta denúncia
      const resposta = await fetchApi<RascunhoDenuncia | null>(
        `/denuncias/${denuncia.ID}/rascunho`,
      );

      if (resposta) {
        setRascunho({
          RESULTADO: resposta.RESULTADO ?? "",
          MEDIDA_APLICADA: resposta.MEDIDA_APLICADA ?? "",
          JUSTIFICATIVA: resposta.JUSTIFICATIVA ?? "",
        });
      }
      setRascunhoCarregadoId(denuncia.ID);
    } catch (erro: any) {
      showToast(
        erro.message || "Erro ao carregar os detalhes da denúncia",
        "error",
      );
    } finally {
      setCarregandoDetalhes(false);
    }
  };

  const fecharModal = () => {
    setDenunciaSelecionada(null);
    setIdeiaDetalhada(null);
    setStatusRascunho("");
  };
  const concluirAnalise = async () => {
    if (!denunciaSelecionada) return;

    if (denunciaSelecionada.PROPRIA_IDEIA) {
      showToast(MSG_PROPRIA_IDEIA, "error");
      return;
    }

    if (
      !rascunho.RESULTADO ||
      !rascunho.MEDIDA_APLICADA ||
      !rascunho.JUSTIFICATIVA?.trim()
    ) {
      showToast(
        "Preencha o resultado, a medida aplicada e a justificativa.",
        "error",
      );
      return;
    }

    try {
      setStatusRascunho("Concluindo análise...");

      await fetchApi(`/denuncias/${denunciaSelecionada.ID}/concluir`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resultado: rascunho.RESULTADO,
          medidaAplicada: rascunho.MEDIDA_APLICADA,
          justificativa: rascunho.JUSTIFICATIVA.trim(),
        }),
      });

      setDenuncias((anteriores) =>
        anteriores.map((denuncia) =>
          denuncia.ID === denunciaSelecionada.ID
            ? {
                ...denuncia,
                STATUS: "Resolvida",
                RESOLVIDA_AT: new Date().toISOString(),
              }
            : denuncia,
        ),
      );

      showToast("Denúncia concluída com sucesso!", "success");
      fecharModal();
    } catch (erro: any) {
      setStatusRascunho("Não foi possível concluir a análise.");
      showToast(erro.message || "Erro ao concluir a denúncia.", "error");
    }
  };
  const deixarEmAnalise = async () => {
    if (!denunciaSelecionada) return;

    try {
      setStatusRascunho("Atualizando status...");

      await fetchApi(`/denuncias/${denunciaSelecionada.ID}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Em análise",
        }),
      });

      setDenuncias((anteriores) =>
        anteriores.map((denuncia) =>
          denuncia.ID === denunciaSelecionada.ID
            ? { ...denuncia, STATUS: "Em análise" }
            : denuncia,
        ),
      );

      showToast("Denúncia mantida em análise.", "success");
      fecharModal();
    } catch (erro: any) {
      showToast(
        erro.message || "Não foi possível atualizar o status.",
        "error",
      );
    }
  };

  const denunciasFiltradas = denuncias.filter((denuncia) => {
    if (filtro === FILTRO_REANALISE || filtro === FILTRO_CONVERSAS) {
      return false;
    }

    if (filtro === "Todas") {
      return true;
    }

    return denuncia.STATUS === filtro;
  });
  useEffect(() => {
    if (!denunciaSelecionada) return undefined;

    const aoApertar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fecharModal();
    };

    window.addEventListener("keydown", aoApertar);
    return () => window.removeEventListener("keydown", aoApertar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [denunciaSelecionada]);
  useEffect(() => {
    carregarDenuncias();
    carregarReanalises();
    carregarConversasDenunciadas();
  }, []);
  useEffect(() => {
    if (
      !denunciaSelecionada ||
      denunciaSelecionada.PROPRIA_IDEIA ||
      rascunhoCarregadoId !== denunciaSelecionada.ID
    ) {
      return;
    }

    const temporizador = setTimeout(async () => {
      try {
        setStatusRascunho("Salvando rascunho...");

        await fetchApi(`/denuncias/${denunciaSelecionada.ID}/rascunho`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resultado: rascunho.RESULTADO || null,
            medidaAplicada: rascunho.MEDIDA_APLICADA || null,
            justificativa: rascunho.JUSTIFICATIVA || null,
          }),
        });

        setStatusRascunho("Rascunho salvo automaticamente.");
      } catch (erro: any) {
        setStatusRascunho("Não foi possível salvar o rascunho.");
        console.error("Erro ao salvar rascunho:", erro);
      }
    }, 700);

    return () => clearTimeout(temporizador);
  }, [rascunho, denunciaSelecionada, rascunhoCarregadoId]);


  // ---------- números das abas ----------
  const contagem = (status: string) =>
    denuncias.filter((d) => d.STATUS === status).length;
  const conversasPendentes = conversasDenunciadas.filter(
    (c) => c.STATUS === "Pendente",
  ).length;
  const esperandoDecisao =
    contagem("Pendente") + reanalises.length + conversasPendentes;

  const abasDeIdeias = [
    { id: "Todas", rotulo: "Todas", n: denuncias.length },
    { id: "Pendente", rotulo: "Pendentes", n: contagem("Pendente") },
    { id: "Em análise", rotulo: "Em análise", n: contagem("Em análise") },
    { id: "Resolvida", rotulo: "Resolvidas", n: contagem("Resolvida") },
  ];

  const textoVazio: Record<string, { titulo: string; texto: string }> = {
    Todas: {
      titulo: "Nenhuma denúncia por aqui",
      texto: "Quando alguém denunciar uma ideia, ela aparece nesta lista.",
    },
    Pendente: {
      titulo: "Tudo em dia",
      texto: "Não há denúncias esperando para serem analisadas.",
    },
    "Em análise": {
      titulo: "Nada em análise agora",
      texto: "As denúncias que você começar a analisar aparecem aqui.",
    },
    Resolvida: {
      titulo: "Nenhuma denúncia resolvida ainda",
      texto: "As denúncias concluídas ficam guardadas aqui.",
    },
  };

  const travado =
    Boolean(denunciaSelecionada?.PROPRIA_IDEIA) ||
    denunciaSelecionada?.STATUS === "Resolvida";
  const procedente = rascunho.RESULTADO === "Procedente";
  const tamanhoJustificativa = (rascunho.JUSTIFICATIVA ?? "").length;
  const decisaoCompleta =
    (rascunho.RESULTADO === "Improcedente" ||
      (rascunho.RESULTADO === "Procedente" &&
        MEDIDAS.some((medida) => medida.valor === rascunho.MEDIDA_APLICADA))) &&
    (rascunho.JUSTIFICATIVA ?? "").trim().length > 0;

  const proximoStatus = (status: string) =>
    status === "Pendente" ? "Em análise" : "Pendente";

  return (
    <AppLayout>
      <div className="ad-page">
        <div className="ad-topo">
          <div>
            <h1>Denúncias</h1>
            <p>
              Analise as denúncias dos usuários, as ideias reenviadas e as
              conversas denunciadas.
            </p>
          </div>

          {!loading && (
            <span
              className={`ad-resumo${esperandoDecisao === 0 ? " ad-resumo--ok" : ""}`}
            >
              <i
                className={`fa-solid ${esperandoDecisao === 0 ? "fa-circle-check" : "fa-bolt"}`}
                aria-hidden="true"
              ></i>
              {esperandoDecisao === 0
                ? "Nada esperando decisão"
                : `${esperandoDecisao} ${esperandoDecisao === 1 ? "item espera" : "itens esperam"} decisão`}
            </span>
          )}
        </div>

        <div className="ad-abas" role="tablist" aria-label="Filtrar denúncias">
          {abasDeIdeias.map((aba) => (
            <button
              key={aba.id}
              type="button"
              role="tab"
              aria-selected={filtro === aba.id}
              className="ad-aba"
              onClick={() => setFiltro(aba.id)}
            >
              {aba.rotulo}
              <span className="ad-aba-n">{aba.n}</span>
            </button>
          ))}

          <span className="ad-aba-divisor" aria-hidden="true"></span>

          <button
            type="button"
            role="tab"
            aria-selected={filtro === FILTRO_REANALISE}
            className="ad-aba"
            onClick={() => setFiltro(FILTRO_REANALISE)}
          >
            Reanálise
            <span
              className={`ad-aba-n${reanalises.length > 0 ? " ad-aba-n--atencao" : ""}`}
            >
              {reanalises.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filtro === FILTRO_CONVERSAS}
            className="ad-aba"
            onClick={() => setFiltro(FILTRO_CONVERSAS)}
          >
            Conversas
            <span
              className={`ad-aba-n${conversasPendentes > 0 ? " ad-aba-n--atencao" : ""}`}
            >
              {conversasPendentes}
            </span>
          </button>
        </div>

        {filtro === FILTRO_CONVERSAS ? (
          <ConversasDenunciadas
            denuncias={conversasDenunciadas}
            onAtualizar={carregarConversasDenunciadas}
          />
        ) : filtro === FILTRO_REANALISE ? (
          reanalises.length === 0 ? (
            <div className="ad-vazio">
              <div className="ad-vazio-icone">
                <i className="fa-solid fa-rotate" aria-hidden="true"></i>
              </div>
              <h3>Nenhuma ideia aguardando reanálise</h3>
              <p>
                Quando um autor reformular uma ideia ocultada e reenviar, ela
                aparece aqui.
              </p>
            </div>
          ) : (
            <div className="ad-lista">
              {reanalises.map((ideia, indice) => (
                <article
                  key={ideia.ID}
                  className="ad-card"
                  data-tipo="reanalise"
                  style={atrasoDoCartao(indice)}
                >
                  <div className="ad-card-topo">
                    <div className="ad-card-titulo">
                      <h3>{ideia.TITULO}</h3>
                      <span className="ad-tag ad-tag--roxa">
                        <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                        Reenviada
                      </span>
                    </div>
                  </div>

                  <p className="ad-meta">
                    <span>
                      Autor <b>{ideia.NOME_AUTOR || "Não informado"}</b>
                      {ideia.ANONIMO ? " (publicada como anônima)" : ""}
                    </span>
                    <span>
                      Categoria <b>{ideia.CATEGORIA || "Geral"}</b>
                    </span>
                  </p>

                  {ideia.MOTIVO_MODERACAO && (
                    <div className="ad-aviso">
                      <i className="fa-solid fa-eye-slash" aria-hidden="true"></i>
                      <span>
                        Motivo da ocultação anterior: {ideia.MOTIVO_MODERACAO}
                      </span>
                    </div>
                  )}

                  <div className="ad-bloco">
                    <strong>Conteúdo reenviado</strong>
                    {ideia.DESCRICAO}
                  </div>

                  {ideia.PROPRIA_IDEIA && (
                    <div className="ad-aviso">
                      <i className="fa-solid fa-user-shield" aria-hidden="true"></i>
                      <span>{MSG_PROPRIA_IDEIA}</span>
                    </div>
                  )}

                  {rejeitandoId === ideia.ID ? (
                    <div className="ad-rejeitar">
                      <label
                        className="ad-rotulo"
                        htmlFor={`motivo-rejeicao-${ideia.ID}`}
                      >
                        Motivo da rejeição{" "}
                        <small>(o autor vai ler)</small>
                      </label>
                      <textarea
                        id={`motivo-rejeicao-${ideia.ID}`}
                        className="ad-campo"
                        value={motivoRejeicao}
                        onChange={(e) => setMotivoRejeicao(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="Explique o que ainda precisa ser ajustado..."
                      />
                      <div className="ad-card-rodape">
                        <span className="ad-id">
                          {motivoRejeicao.length}/1000
                        </span>
                        <div className="ad-acoes">
                          <button
                            type="button"
                            className="ad-btn ad-btn--suave"
                            onClick={() => {
                              setRejeitandoId(null);
                              setMotivoRejeicao("");
                            }}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="ad-btn ad-btn--perigo"
                            disabled={decidindoId === ideia.ID}
                            onClick={() => rejeitarReanalise(ideia.ID)}
                          >
                            Confirmar rejeição
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="ad-card-rodape">
                      <span className="ad-id">Ideia #{ideia.ID}</span>
                      <div className="ad-acoes">
                        <button
                          type="button"
                          className="ad-btn ad-btn--suave-perigo"
                          disabled={
                            decidindoId === ideia.ID ||
                            Boolean(ideia.PROPRIA_IDEIA)
                          }
                          onClick={() => {
                            setRejeitandoId(ideia.ID);
                            setMotivoRejeicao("");
                          }}
                        >
                          <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                          Rejeitar
                        </button>
                        <button
                          type="button"
                          className="ad-btn ad-btn--ok"
                          disabled={
                            decidindoId === ideia.ID ||
                            Boolean(ideia.PROPRIA_IDEIA)
                          }
                          onClick={() => aprovarReanalise(ideia.ID)}
                        >
                          <i className="fa-solid fa-check" aria-hidden="true"></i>
                          Aprovar e publicar
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )
        ) : loading ? (
          <div className="ad-lista" aria-busy="true" aria-label="Carregando denúncias">
            <div className="ad-esqueleto"></div>
            <div className="ad-esqueleto"></div>
            <div className="ad-esqueleto"></div>
          </div>
        ) : denunciasFiltradas.length === 0 ? (
          <div className="ad-vazio">
            <div className="ad-vazio-icone">
              <i className="fa-solid fa-flag-checkered" aria-hidden="true"></i>
            </div>
            <h3>{(textoVazio[filtro] ?? textoVazio.Todas).titulo}</h3>
            <p>{(textoVazio[filtro] ?? textoVazio.Todas).texto}</p>
          </div>
        ) : (
          <div className="ad-lista">
            {denunciasFiltradas.map((denuncia, indice) => (
              <article
                key={`${filtro}-${denuncia.ID}`}
                className="ad-card"
                data-status={denuncia.STATUS}
                style={atrasoDoCartao(indice)}
              >
                <div className="ad-card-topo">
                  <div className="ad-card-titulo">
                    <h3>{denuncia.IDEIA_TITULO}</h3>
                    {(denuncia.IDEIA_EXCLUIDA || !denuncia.IDEIAS_ID) && (
                      <span className="ad-tag ad-tag--bad">
                        <i className="fa-solid fa-trash" aria-hidden="true"></i>
                        Ideia excluída
                      </span>
                    )}
                  </div>

                  <span className="ad-status" data-status={denuncia.STATUS}>
                    {denuncia.STATUS}
                  </span>
                </div>

                <p className="ad-meta">
                  <span>
                    Denunciada por <b>{denuncia.USUARIO_NOME}</b>
                  </span>
                  <span>
                    Autor <b>{denuncia.AUTOR_NOME}</b>
                  </span>
                  <span>{tempoRelativo(denuncia.CREATED_AT)}</span>
                </p>

                <div className="ad-motivo">
                  <i className="fa-solid fa-flag" aria-hidden="true"></i>
                  <div>
                    <strong>{denuncia.MOTIVO}</strong>
                    {denuncia.DESCRICAO && <p>{denuncia.DESCRICAO}</p>}
                  </div>
                </div>

                {denuncia.PROPRIA_IDEIA && (
                  <div className="ad-aviso">
                    <i className="fa-solid fa-user-shield" aria-hidden="true"></i>
                    <span>{MSG_PROPRIA_IDEIA}</span>
                  </div>
                )}

                <div className="ad-card-rodape">
                  <span className="ad-id">
                    Denúncia #{denuncia.ID}
                    {denuncia.STATUS === "Resolvida" && denuncia.ADMIN_NOME
                      ? ` · decidida por ${denuncia.ADMIN_NOME}`
                      : ""}
                  </span>

                  <div className="ad-acoes">
                    {denuncia.STATUS !== "Resolvida" && (
                      <button
                        type="button"
                        className="ad-btn ad-btn--texto"
                        disabled={
                          atualizandoId === denuncia.ID ||
                          Boolean(denuncia.PROPRIA_IDEIA)
                        }
                        onClick={() =>
                          atualizarStatus(
                            denuncia.ID,
                            proximoStatus(denuncia.STATUS),
                          )
                        }
                      >
                        {denuncia.STATUS === "Pendente"
                          ? "Marcar em análise"
                          : "Voltar para pendente"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="ad-btn ad-btn--azul"
                      onClick={() => abrirDenuncia(denuncia)}
                    >
                      {denuncia.STATUS === "Resolvida" ? "Ver análise" : "Analisar"}
                      <i
                        className="fa-solid fa-arrow-right"
                        aria-hidden="true"
                      ></i>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {denunciaSelecionada &&
        createPortal(
          <div className="ad-fundo" onClick={fecharModal}>
            <aside
              className="ad-painel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ad-painel-titulo"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ad-painel-topo">
                <div>
                  <span className="ad-painel-sub">
                    Denúncia #{denunciaSelecionada.ID} ·{" "}
                    {tempoRelativo(denunciaSelecionada.CREATED_AT)}
                  </span>
                  <h2 id="ad-painel-titulo">Análise da denúncia</h2>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    className="ad-status"
                    data-status={denunciaSelecionada.STATUS}
                  >
                    {denunciaSelecionada.STATUS}
                  </span>
                  <button
                    type="button"
                    className="ad-fechar"
                    onClick={fecharModal}
                    aria-label="Fechar"
                  >
                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                  </button>
                </div>
              </div>

              <div className="ad-painel-corpo">
                {carregandoDetalhes ? (
                  <>
                    <div className="ad-esqueleto"></div>
                    <div className="ad-esqueleto"></div>
                    <div className="ad-esqueleto"></div>
                  </>
                ) : (
                  <>
                    {denunciaSelecionada.PROPRIA_IDEIA && (
                      <div className="ad-aviso ad-aviso--bad" role="alert">
                        <i
                          className="fa-solid fa-user-shield"
                          aria-hidden="true"
                        ></i>
                        <span>{MSG_PROPRIA_IDEIA}</span>
                      </div>
                    )}

                    {denunciaSelecionada.STATUS === "Resolvida" && (
                      <div className="ad-aviso ad-aviso--info">
                        <i
                          className="fa-solid fa-circle-check"
                          aria-hidden="true"
                        ></i>
                        <span>
                          Esta denúncia já foi decidida
                          {denunciaSelecionada.ADMIN_NOME
                            ? ` por ${denunciaSelecionada.ADMIN_NOME}`
                            : ""}
                          .
                        </span>
                      </div>
                    )}

                    <section className="ad-secao">
                      <h3>
                        <i className="fa-solid fa-flag" aria-hidden="true"></i>
                        O que foi denunciado
                      </h3>

                      {ideiaDetalhada ? (
                        <div className="ad-ideia">
                          <div className="ad-ideia-meta">
                            <span className="ad-tag">
                              {ideiaDetalhada.CATEGORIA || "Geral"}
                            </span>
                            {ideiaDetalhada.STATUS && (
                              <span
                                className={`ad-tag${ideiaDetalhada.STATUS === "Excluída" ? " ad-tag--bad" : ""}`}
                              >
                                {ideiaDetalhada.STATUS}
                              </span>
                            )}
                          </div>
                          <h4>{ideiaDetalhada.TITULO}</h4>
                          <p>{ideiaDetalhada.DESCRICAO || "Sem descrição."}</p>
                          {ideiaDetalhada.STATUS === "Excluída" && (
                            <div
                              className="ad-aviso ad-aviso--bad"
                              style={{ marginTop: 12 }}
                            >
                              <i
                                className="fa-solid fa-triangle-exclamation"
                                aria-hidden="true"
                              ></i>
                              <span>
                                Esta ideia foi excluída do sistema, mas o
                                histórico da denúncia foi preservado.
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="ad-aviso">
                          <i
                            className="fa-solid fa-circle-info"
                            aria-hidden="true"
                          ></i>
                          <span>Não foi possível carregar os dados da ideia.</span>
                        </div>
                      )}
                    </section>

                    <section className="ad-secao">
                      <h3>
                        <i className="fa-solid fa-comment" aria-hidden="true"></i>
                        A denúncia
                      </h3>

                      <div className="ad-pares">
                        <div className="ad-par">
                          <span>Denunciante</span>
                          <b>{denunciaSelecionada.USUARIO_NOME}</b>
                        </div>
                        <div className="ad-par">
                          <span>Autor da ideia</span>
                          <b>{denunciaSelecionada.AUTOR_NOME}</b>
                        </div>
                        <div className="ad-par ad-par--largo">
                          <span>Motivo</span>
                          <b>{denunciaSelecionada.MOTIVO}</b>
                        </div>
                        <div className="ad-par ad-par--largo">
                          <span>Descrição</span>
                          <b style={{ fontWeight: 400, whiteSpace: "pre-wrap" }}>
                            {denunciaSelecionada.DESCRICAO ||
                              "Nenhuma descrição informada."}
                          </b>
                        </div>
                      </div>
                    </section>

                    <section className="ad-secao">
                      <h3>
                        <i className="fa-solid fa-gavel" aria-hidden="true"></i>
                        Sua decisão
                      </h3>

                      <p className="ad-passo" id="ad-passo-resultado">
                        1. A denúncia procede?
                      </p>
                      <div
                        className="ad-opcoes"
                        role="radiogroup"
                        aria-labelledby="ad-passo-resultado"
                      >
                        <label className="ad-opcao ad-opcao--bad">
                          <input
                            type="radio"
                            name="resultado-denuncia"
                            value="Procedente"
                            disabled={travado}
                            checked={procedente}
                            onChange={() =>
                              setRascunho((anterior) => ({
                                ...anterior,
                                RESULTADO: "Procedente",
                                // "Nenhuma" só vale para denúncia improcedente
                                MEDIDA_APLICADA:
                                  anterior.MEDIDA_APLICADA === "Nenhuma"
                                    ? ""
                                    : anterior.MEDIDA_APLICADA,
                              }))
                            }
                          />
                          <span className="ad-opcao-corpo">
                            <span className="ad-opcao-icone">
                              <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
                            </span>
                            <span>
                              <b>Procedente</b>
                              <small>A ideia desrespeita as regras.</small>
                            </span>
                          </span>
                        </label>

                        <label className="ad-opcao ad-opcao--ok">
                          <input
                            type="radio"
                            name="resultado-denuncia"
                            value="Improcedente"
                            disabled={travado}
                            checked={rascunho.RESULTADO === "Improcedente"}
                            onChange={() =>
                              setRascunho((anterior) => ({
                                ...anterior,
                                RESULTADO: "Improcedente",
                                MEDIDA_APLICADA: "Nenhuma",
                              }))
                            }
                          />
                          <span className="ad-opcao-corpo">
                            <span className="ad-opcao-icone">
                              <i className="fa-solid fa-shield-heart" aria-hidden="true"></i>
                            </span>
                            <span>
                              <b>Improcedente</b>
                              <small>Está tudo certo com a ideia.</small>
                            </span>
                          </span>
                        </label>
                      </div>

                      <p className="ad-passo" id="ad-passo-medida">
                        2. Qual medida aplicar?
                      </p>
                      <div
                        className="ad-chips"
                        role="radiogroup"
                        aria-labelledby="ad-passo-medida"
                      >
                        {MEDIDAS.map((medida) => (
                          <label
                            key={medida.valor}
                            className={`ad-chip${medida.valor === "Excluir ideia" ? " ad-chip--bad" : ""}`}
                          >
                            <input
                              type="radio"
                              name="medida-denuncia"
                              value={medida.valor}
                              disabled={travado || !procedente}
                              checked={rascunho.MEDIDA_APLICADA === medida.valor}
                              onChange={() =>
                                setRascunho((anterior) => ({
                                  ...anterior,
                                  MEDIDA_APLICADA: medida.valor,
                                }))
                              }
                            />
                            <span>
                              <i
                                className={`fa-solid ${medida.icone}`}
                                aria-hidden="true"
                              ></i>
                              {medida.rotulo}
                            </span>
                          </label>
                        ))}
                      </div>

                      {!procedente && !travado && (
                        <div className="ad-aviso ad-aviso--info ad-dica">
                          <i className="fa-solid fa-circle-info" aria-hidden="true"></i>
                          <span>
                            {rascunho.RESULTADO === "Improcedente"
                              ? "Denúncia improcedente: nenhuma medida será aplicada."
                              : "Escolha o resultado acima. As medidas só ficam disponíveis quando a denúncia é procedente."}
                          </span>
                        </div>
                      )}

                      {rascunho.MEDIDA_APLICADA &&
                        DICAS_MEDIDA[rascunho.MEDIDA_APLICADA] && (
                          <div
                            key={rascunho.MEDIDA_APLICADA}
                            className={`ad-aviso ad-dica${rascunho.MEDIDA_APLICADA === "Excluir ideia" ? " ad-aviso--bad" : ""}`}
                          >
                            <i
                              className="fa-solid fa-triangle-exclamation"
                              aria-hidden="true"
                            ></i>
                            <span>{DICAS_MEDIDA[rascunho.MEDIDA_APLICADA]}</span>
                          </div>
                        )}

                      <label
                        className="ad-rotulo"
                        htmlFor="justificativa-denuncia"
                        style={{ marginTop: 20 }}
                      >
                        3. Justificativa{" "}
                        <small>(fica registrada no histórico)</small>
                      </label>
                      <textarea
                        id="justificativa-denuncia"
                        className="ad-campo"
                        value={rascunho.JUSTIFICATIVA ?? ""}
                        disabled={travado}
                        maxLength={1000}
                        onChange={(e) =>
                          setRascunho((anterior) => ({
                            ...anterior,
                            JUSTIFICATIVA: e.target.value,
                          }))
                        }
                        placeholder="Explique os motivos da decisão..."
                        rows={5}
                      />
                      <p className="ad-contador">{tamanhoJustificativa}/1000</p>
                    </section>

                    {denunciaSelecionada.AUTOR_ID &&
                      !denunciaSelecionada.PROPRIA_IDEIA && (
                        <div className="pn-gatilho">
                          <div>
                            <b>Caso muito grave?</b>
                            <small>
                              Banir ou excluir o autor. Pede várias confirmações e fica
                              registrado.
                            </small>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setPenalidadeAlvo({
                                usuarioId: Number(denunciaSelecionada.AUTOR_ID),
                                denunciaId: denunciaSelecionada.ID,
                              })
                            }
                          >
                            Banir ou excluir autor
                          </button>
                        </div>
                      )}
                  </>
                )}
              </div>

              <div className="ad-painel-rodape">
                <span className="ad-salvo" aria-live="polite">
                  {statusRascunho && !travado && (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
                      {statusRascunho}
                    </>
                  )}
                </span>

                <div className="ad-acoes">
                  <button
                    type="button"
                    className="ad-btn ad-btn--suave"
                    onClick={fecharModal}
                  >
                    Fechar
                  </button>
                  {!travado && (
                    <button
                      type="button"
                      className="ad-btn ad-btn--suave"
                      onClick={deixarEmAnalise}
                      disabled={carregandoDetalhes}
                    >
                      Deixar em análise
                    </button>
                  )}
                  <button
                    type="button"
                    className="ad-btn ad-btn--ok"
                    onClick={() => concluirAnalise()}
                    disabled={carregandoDetalhes || travado || !decisaoCompleta}
                    title={
                      decisaoCompleta
                        ? undefined
                        : "Escolha o resultado, a medida (se procedente) e escreva a justificativa."
                    }
                  >
                    <i className="fa-solid fa-check" aria-hidden="true"></i>
                    Concluir análise
                  </button>
                </div>
              </div>
            </aside>
          </div>,
          document.body,
        )}
      {penalidadeAlvo && (
        <PenalidadeUsuarioModal
          usuarioId={penalidadeAlvo.usuarioId}
          denunciaId={penalidadeAlvo.denunciaId}
          aoFechar={() => setPenalidadeAlvo(null)}
          aoConcluir={() => {
            setPenalidadeAlvo(null);
            carregarDenuncias();
          }}
        />
      )}
    </AppLayout>
  );
}
