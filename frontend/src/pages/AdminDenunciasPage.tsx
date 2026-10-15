import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { fetchApi } from "../services/api";
import { useToast } from "../context/ToastContext";

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
  IDEIA_EXCLUIDA?: boolean;
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
export default function AdminDenunciasPage() {
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
  const statusDisponiveis = ["Pendente", "Em análise", "Resolvida"];

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
  const denunciasFiltradas = denuncias.filter((denuncia) => {
    if (filtro === "Todas") {
      return true;
    }

    return denuncia.STATUS === filtro;
  });
  useEffect(() => {
    carregarDenuncias();
  }, []);
  useEffect(() => {
    if (
      !denunciaSelecionada ||
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

  return (
    <AppLayout>
      <div
        style={{
          padding: "30px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            color: "#07327c",
            fontSize: "24px",
            marginBottom: "8px",
          }}
        >
          Denúncias
        </h1>

        <p
          style={{
            color: "#64748b",
            fontSize: "13px",
            marginBottom: "25px",
          }}
        >
          Analise as denúncias enviadas pelos usuários.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          {["Todas", ...statusDisponiveis].map((status) => (
            <button
              key={status}
              onClick={() => setFiltro(status)}
              style={{
                padding: "9px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: filtro === status ? "#07327c" : "white",
                color: filtro === status ? "white" : "#334155",
                cursor: "pointer",
                fontWeight: filtro === status ? "bold" : "normal",
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Carregando denúncias...</p>
        ) : denunciasFiltradas.length === 0 ? (
          <p>Nenhuma denúncia encontrada neste filtro.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            {denunciasFiltradas.map((denuncia) => (
              <div
                key={denuncia.ID}
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "15px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        color: "#1e293b",
                        fontSize: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {denuncia.IDEIA_TITULO}
                      {(denuncia.IDEIA_EXCLUIDA || !denuncia.IDEIAS_ID) && (
                        <span
                          style={{
                            fontSize: "11px",
                            backgroundColor: "#fee2e2",
                            color: "#b91c1c",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          Ideia excluída
                        </span>
                      )}
                    </h3>

                    <p
                      style={{
                        margin: "8px 0",
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      Denunciado por: {denuncia.USUARIO_NOME}
                    </p>
                    <p
                      style={{
                        margin: "8px 0",
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      Autor da ideia: {denuncia.AUTOR_NOME}
                    </p>
                  </div>

                  <select
                    value={denuncia.STATUS}
                    disabled={atualizandoId === denuncia.ID}
                    onChange={(e) =>
                      atualizarStatus(denuncia.ID, e.target.value)
                    }
                    aria-label={`Alterar status da denúncia ${denuncia.ID}`}
                    style={{
                      padding: "7px 10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background:
                        denuncia.STATUS === "Pendente"
                          ? "#fef3c7"
                          : denuncia.STATUS === "Em análise"
                            ? "#dbeafe"
                            : "#dcfce7",
                      color:
                        denuncia.STATUS === "Pendente"
                          ? "#92400e"
                          : denuncia.STATUS === "Em análise"
                            ? "#1d4ed8"
                            : "#166534",
                      fontSize: "12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    {statusDisponiveis.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    marginTop: "15px",
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "12px",
                      color: "#334155",
                    }}
                  >
                    Motivo:
                  </strong>

                  <p
                    style={{
                      margin: "5px 0 0",
                      fontSize: "12px",
                      color: "#475569",
                    }}
                  >
                    {denuncia.MOTIVO}
                  </p>
                </div>

                {denuncia.DESCRICAO && (
                  <div style={{ marginTop: "12px" }}>
                    <strong
                      style={{
                        fontSize: "12px",
                        color: "#334155",
                      }}
                    >
                      Descrição:
                    </strong>

                    <p
                      style={{
                        fontSize: "12px",
                        color: "#475569",
                        marginTop: "5px",
                      }}
                    >
                      {denuncia.DESCRICAO}
                    </p>
                  </div>
                )}

                <p
                  style={{
                    marginTop: "15px",
                    fontSize: "11px",
                    color: "#94a3b8",
                  }}
                >
                  Denúncia #{denuncia.ID}
                </p>
                <button
                  type="button"
                  onClick={() => abrirDenuncia(denuncia)}
                  style={{
                    marginTop: "10px",
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#07327c",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Ver denúncia
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {denunciaSelecionada && (
        <div
          onClick={fecharModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 1000,
            overflowY: "auto",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "14px",
              padding: "25px",
              width: "100%",
              maxWidth: "750px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ color: "#07327c", margin: 0, fontSize: "21px" }}>
                Análise da denúncia #{denunciaSelecionada.ID}
              </h2>

              <button
                type="button"
                onClick={fecharModal}
                aria-label="Fechar modal"
                style={{
                  border: "none",
                  background: "#07327c",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                ×
              </button>
            </div>

            {carregandoDetalhes ? (
              <p>Carregando detalhes...</p>
            ) : (
              <>
                <section style={{ marginBottom: "22px" }}>
                  <h3 style={{ color: "#1e293b", fontSize: "16px" }}>
                    Informações da denúncia
                  </h3>

                  <p>
                    <strong>Denunciante:</strong>{" "}
                    {denunciaSelecionada.USUARIO_NOME}
                  </p>

                  <p>
                    <strong>Autor da ideia:</strong>{" "}
                    {denunciaSelecionada.AUTOR_NOME}
                  </p>

                  <p>
                    <strong>Motivo:</strong> {denunciaSelecionada.MOTIVO}
                  </p>

                  <p>
                    <strong>Descrição:</strong>{" "}
                    {denunciaSelecionada.DESCRICAO ||
                      "Nenhuma descrição informada."}
                  </p>

                  <p>
                    <strong>Status:</strong> {denunciaSelecionada.STATUS}
                  </p>
                </section>

                <section
                  style={{
                    marginBottom: "25px",
                    padding: "16px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                  }}
                >
                  <h3
                    style={{ color: "#07327c", fontSize: "16px", marginTop: 0 }}
                  >
                    Ideia denunciada
                  </h3>

                  {ideiaDetalhada ? (
                    <>
                      {ideiaDetalhada.STATUS === "Excluída" && (
                        <div
                          style={{
                            marginBottom: "12px",
                            padding: "8px 12px",
                            background: "#fee2e2",
                            color: "#991b1b",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <i className="fa-solid fa-triangle-exclamation"></i>
                          Esta ideia foi excluída do sistema, mas seu histórico
                          de denúncia foi preservado.
                        </div>
                      )}
                      <p>
                        <strong>Título:</strong> {ideiaDetalhada.TITULO}
                      </p>

                      <p
                        style={{
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        <strong>Descrição:</strong>{" "}
                        {ideiaDetalhada.DESCRICAO || "Sem descrição."}
                      </p>

                      <p>
                        <strong>Categoria:</strong>{" "}
                        {ideiaDetalhada.CATEGORIA || "Geral"}
                      </p>

                      <p>
                        <strong>Status da ideia:</strong>{" "}
                        {ideiaDetalhada.STATUS || "Não informado"}
                      </p>
                    </>
                  ) : (
                    <p>Não foi possível carregar os dados da ideia.</p>
                  )}
                </section>

                <section>
                  <h3 style={{ color: "#07327c", fontSize: "16px" }}>
                    Decisão administrativa
                  </h3>

                  <label
                    htmlFor="resultado-denuncia"
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "bold",
                    }}
                  >
                    Resultado da análise
                  </label>

                  <select
                    id="resultado-denuncia"
                    value={rascunho.RESULTADO ?? ""}
                    onChange={(e) =>
                      setRascunho((anterior) => ({
                        ...anterior,
                        RESULTADO: e.target.value,
                        MEDIDA_APLICADA:
                          e.target.value === "Improcedente"
                            ? "Nenhuma"
                            : anterior.MEDIDA_APLICADA,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "11px",
                      marginBottom: "16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">Selecione o resultado</option>
                    <option value="Procedente">Denúncia procedente</option>
                    <option value="Improcedente">Denúncia improcedente</option>
                  </select>

                  <label
                    htmlFor="medida-denuncia"
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "bold",
                    }}
                  >
                    Medida aplicada
                  </label>

                  <select
                    id="medida-denuncia"
                    value={rascunho.MEDIDA_APLICADA ?? ""}
                    onChange={(e) =>
                      setRascunho((anterior) => ({
                        ...anterior,
                        MEDIDA_APLICADA: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "11px",
                      marginBottom: "16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">Selecione a medida</option>

                    <option value="Nenhuma">Nenhuma</option>

                    {rascunho.RESULTADO === "Procedente" && (
                      <>
                        <option value="Aviso">Aviso ao autor</option>
                        <option value="Ocultar ideia">Ocultar ideia</option>
                        <option value="Excluir ideia">Excluir ideia</option>
                      </>
                    )}
                  </select>

                  <label
                    htmlFor="justificativa-denuncia"
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "bold",
                    }}
                  >
                    Justificativa
                  </label>

                  <textarea
                    id="justificativa-denuncia"
                    value={rascunho.JUSTIFICATIVA ?? ""}
                    onChange={(e) =>
                      setRascunho((anterior) => ({
                        ...anterior,
                        JUSTIFICATIVA: e.target.value,
                      }))
                    }
                    placeholder="Explique os motivos da decisão..."
                    rows={5}
                    style={{
                      width: "100%",
                      padding: "11px",
                      marginBottom: "16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      resize: "vertical",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />

                  <p
                    aria-live="polite"
                    style={{ color: "#64748b", fontSize: "12px" }}
                  >
                    {statusRascunho}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => concluirAnalise()}
                      disabled={carregandoDetalhes}
                      style={{
                        padding: "11px 18px",
                        border: "none",
                        borderRadius: "8px",
                        background: "#166534",
                        color: "white",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      Concluir análise
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
