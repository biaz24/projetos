import React, { useState, useEffect, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AppLayout } from "../components/AppLayout";
import { fetchApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import "./Rascunhos.css";

interface Rascunho {
  ID: number;
  TITULO: string;
  DESCRICAO: string;
  UPDATED_AT: string;
}

const CATEGORIAS = [
  "Tecnologia",
  "Games",
  "Sustentabilidade",
  "Educação",
  "Utilitários",
  "Geral",
];

const STATUS_IDEIA = ["Disponível", "Em desenvolvimento", "Concluída"];

// "há 2 dias", "há 3 h"...
const tempoRelativo = (data?: string) => {
  if (!data) return "Salvo recentemente";
  const instante = new Date(data).getTime();
  if (Number.isNaN(instante)) return "Salvo recentemente";

  const minutos = Math.max(0, Math.round((Date.now() - instante) / 60000));
  if (minutos < 1) return "Salvo agora há pouco";
  if (minutos < 60) return `Salvo há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `Salvo há ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias < 30) return `Salvo há ${dias} ${dias === 1 ? "dia" : "dias"}`;
  return `Salvo em ${new Date(data).toLocaleDateString("pt-BR")}`;
};

const dataCompleta = (data?: string) => {
  if (!data) return undefined;
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return undefined;
  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

// Janela central: fecha com Esc e ao clicar fora, e é desenhada fora do layout
const Janela: React.FC<{
  aoFechar: () => void;
  estreita?: boolean;
  rotulo: string;
  children: React.ReactNode;
}> = ({ aoFechar, estreita, rotulo, children }) => {
  useEffect(() => {
    const aoApertar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") aoFechar();
    };

    window.addEventListener("keydown", aoApertar);
    return () => window.removeEventListener("keydown", aoApertar);
  }, [aoFechar]);

  return createPortal(
    <div className="rs-fundo" onClick={aoFechar}>
      <div
        className={`rs-janela${estreita ? " rs-janela--estreita" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={rotulo}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

export const RascunhosPage: React.FC = () => {
  const { showToast } = useToast();

  const [rascunhos, setRascunhos] = useState<Rascunho[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Modal de Rascunho
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  const [publicarModalOpen, setPublicarModalOpen] = useState(false);
  const [rascunhoParaPublicar, setRascunhoParaPublicar] =
    useState<Rascunho | null>(null);
  const [categoria, setCategoria] = useState("Geral");
  const [anonimo, setAnonimo] = useState(0);
  const [publicando, setPublicando] = useState(false);
  const [status, setStatus] = useState("Disponível");

  // Exclusão: pede confirmação numa janela própria
  const [rascunhoParaExcluir, setRascunhoParaExcluir] =
    useState<Rascunho | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregarRascunhos = async () => {
    try {
      setLoading(true);
      const data = await fetchApi<Rascunho[]>("/rascunhos");
      setRascunhos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar rascunhos:", err);
      showToast("Não foi possível carregar seus rascunhos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarRascunhos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenCreateModal = () => {
    setEditId(null);
    setTitulo("");
    setDescricao("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (rascunho: Rascunho) => {
    setEditId(rascunho.ID);
    setTitulo(rascunho.TITULO);
    setDescricao(rascunho.DESCRICAO);
    setModalOpen(true);
  };

  const handleOpenPublicarModal = (rascunho: Rascunho) => {
    setRascunhoParaPublicar(rascunho);
    setCategoria("Geral");
    setStatus("Disponível");
    setAnonimo(0);
    setPublicarModalOpen(true);
  };

  const fecharPublicar = () => {
    setPublicarModalOpen(false);
    setRascunhoParaPublicar(null);
  };

  const handleTransformarEmIdeia = async () => {
    if (!rascunhoParaPublicar || publicando) return;

    setPublicando(true);

    try {
      // Primeiro cria a ideia no banco
      await fetchApi("/ideias", {
        method: "POST",
        body: JSON.stringify({
          titulo: rascunhoParaPublicar.TITULO.trim(),
          descricao: rascunhoParaPublicar.DESCRICAO.trim(),
          categoria,
          status,
          anonimo,
        }),
      });

      // Se a ideia foi criada, exclui o rascunho
      await fetchApi(`/rascunhos/${rascunhoParaPublicar.ID}`, {
        method: "DELETE",
      });

      // Remove da tela
      setRascunhos((prev) =>
        prev.filter((r) => r.ID !== rascunhoParaPublicar.ID),
      );

      fecharPublicar();

      showToast("Ideia publicada com sucesso!", "success");
    } catch (err: any) {
      console.error("Erro ao transformar rascunho em ideia:", err);
      showToast(err.message || "Erro ao publicar ideia.", "error");
    } finally {
      setPublicando(false);
    }
  };

  const handleSaveRascunho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      if (editId) {
        await fetchApi(`/rascunhos/${editId}`, {
          method: "PUT",
          body: JSON.stringify({ titulo, descricao }),
        });
      } else {
        await fetchApi("/rascunhos", {
          method: "POST",
          body: JSON.stringify({ titulo, descricao }),
        });
      }
      setModalOpen(false);
      showToast("Rascunho salvo!", "success");
      await carregarRascunhos();
    } catch (err: any) {
      console.error("Erro ao salvar rascunho:", err);
      showToast(err.message || "Não foi possível salvar o rascunho.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRascunho = async () => {
    if (!rascunhoParaExcluir || excluindo) return;

    try {
      setExcluindo(true);
      await fetchApi(`/rascunhos/${rascunhoParaExcluir.ID}`, {
        method: "DELETE",
      });
      setRascunhos((prev) =>
        prev.filter((r) => r.ID !== rascunhoParaExcluir.ID),
      );
      setRascunhoParaExcluir(null);
      showToast("Rascunho excluído.", "success");
    } catch (err: any) {
      console.error("Erro ao deletar rascunho:", err);
      showToast(err.message || "Não foi possível excluir o rascunho.", "error");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <AppLayout>
      <section className="content rs-page">
        <div className="rs-topo">
          <div>
            <h1>Rascunhos</h1>
            <p>
              Suas ideias salvas que ainda não foram publicadas. Termine
              no seu ritmo e publique quando estiver pronta.
            </p>
          </div>

          {rascunhos.length > 0 && (
            <button
              type="button"
              className="rs-btn rs-btn--azul"
              onClick={handleOpenCreateModal}
            >
              <i className="fa-solid fa-plus" aria-hidden="true"></i>
              Novo rascunho
            </button>
          )}
        </div>

        {loading ? (
          <div className="rs-grade" aria-busy="true" aria-label="Carregando rascunhos">
            <div className="rs-esqueleto"></div>
            <div className="rs-esqueleto"></div>
            <div className="rs-esqueleto"></div>
          </div>
        ) : rascunhos.length === 0 ? (
          <div className="rs-vazio">
            <div className="rs-vazio-icone">
              <i className="fa-regular fa-lightbulb" aria-hidden="true"></i>
            </div>
            <h2>Nenhum rascunho salvo</h2>
            <p>
              Anote uma ideia agora e volte depois para terminar. Ela só vai
              para o site quando você publicar.
            </p>
            <button
              type="button"
              className="rs-btn rs-btn--azul"
              onClick={handleOpenCreateModal}
            >
              <i className="fa-solid fa-plus" aria-hidden="true"></i>
              Escrever primeiro rascunho
            </button>
          </div>
        ) : (
          <div className="rs-grade">
            {rascunhos.map((item, idx) => (
              <article
                key={item.ID}
                className="rs-card"
                style={
                  { "--rs-atraso": `${Math.min(idx, 8) * 55}ms` } as CSSProperties
                }
              >
                <h3>{item.TITULO}</h3>
                <p className="rs-card-texto">{item.DESCRICAO}</p>

                <div className="rs-card-rodape">
                  <span className="rs-data" title={dataCompleta(item.UPDATED_AT)}>
                    <i className="fa-regular fa-clock" aria-hidden="true"></i>
                    {tempoRelativo(item.UPDATED_AT)}
                  </span>

                  <div className="rs-acoes">
                    <button
                      type="button"
                      className="rs-icone"
                      onClick={() => handleOpenEditModal(item)}
                      title="Editar rascunho"
                      aria-label={`Editar o rascunho ${item.TITULO}`}
                    >
                      <i className="fa-solid fa-pen" aria-hidden="true"></i>
                    </button>

                    <button
                      type="button"
                      className="rs-icone rs-icone--perigo"
                      onClick={() => setRascunhoParaExcluir(item)}
                      title="Excluir rascunho"
                      aria-label={`Excluir o rascunho ${item.TITULO}`}
                    >
                      <i className="fa-regular fa-trash-can" aria-hidden="true"></i>
                    </button>

                    <button
                      type="button"
                      className="rs-publicar"
                      onClick={() => handleOpenPublicarModal(item)}
                      title="Transformar rascunho em ideia"
                    >
                      <i className="fa-solid fa-lightbulb" aria-hidden="true"></i>
                      Publicar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Criar / editar rascunho */}
      {modalOpen && (
        <Janela
          aoFechar={() => !saving && setModalOpen(false)}
          rotulo={editId ? "Editar rascunho" : "Novo rascunho"}
        >
          <form onSubmit={handleSaveRascunho}>
            <div className="rs-janela-topo">
              <div>
                <h2>{editId ? "Editar rascunho" : "Novo rascunho"}</h2>
                <p>Escreva do jeito que vier. Dá para ajustar depois.</p>
              </div>
              <button
                type="button"
                className="rs-fechar"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </div>

            <div className="rs-janela-corpo">
              <div className="rs-bloco">
                <label className="rs-rotulo" htmlFor="rascunho-titulo">
                  Título
                </label>
                <input
                  id="rascunho-titulo"
                  className="rs-campo"
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Transporte público sob demanda"
                  required
                  autoFocus
                />
              </div>

              <div className="rs-bloco">
                <label className="rs-rotulo" htmlFor="rascunho-descricao">
                  Descrição
                </label>
                <textarea
                  id="rascunho-descricao"
                  className="rs-campo"
                  rows={6}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva suas anotações ou detalhes sobre o projeto..."
                  required
                />
              </div>
            </div>

            <div className="rs-janela-rodape">
              <button
                type="button"
                className="rs-btn rs-btn--suave"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rs-btn rs-btn--azul"
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar rascunho"}
              </button>
            </div>
          </form>
        </Janela>
      )}

      {/* Transformar rascunho em ideia */}
      {publicarModalOpen && rascunhoParaPublicar && (
        <Janela aoFechar={() => !publicando && fecharPublicar()} rotulo="Publicar como nova ideia">
          <div className="rs-janela-topo">
            <div>
              <h2>Publicar como nova ideia</h2>
              <p>Confira como ela vai aparecer e escolha os detalhes.</p>
            </div>
            <button
              type="button"
              className="rs-fechar"
              onClick={fecharPublicar}
              aria-label="Fechar"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>

          <div className="rs-janela-corpo">
            <div className="rs-resumo">
              <b>{rascunhoParaPublicar.TITULO}</b>
              <span>{rascunhoParaPublicar.DESCRICAO}</span>
            </div>

            <div className="rs-bloco">
              <p className="rs-rotulo" id="rs-rotulo-categoria">
                Categoria
              </p>
              <div className="rs-chips" role="radiogroup" aria-labelledby="rs-rotulo-categoria">
                {CATEGORIAS.map((opcao) => (
                  <label key={opcao} className="rs-chip">
                    <input
                      type="radio"
                      name="categoria-ideia"
                      value={opcao}
                      checked={categoria === opcao}
                      onChange={() => setCategoria(opcao)}
                    />
                    <span>{opcao}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rs-bloco">
              <p className="rs-rotulo" id="rs-rotulo-status">
                Status da ideia
              </p>
              <div className="rs-chips" role="radiogroup" aria-labelledby="rs-rotulo-status">
                {STATUS_IDEIA.map((opcao) => (
                  <label key={opcao} className="rs-chip">
                    <input
                      type="radio"
                      name="status-ideia"
                      value={opcao}
                      checked={status === opcao}
                      onChange={() => setStatus(opcao)}
                    />
                    <span>{opcao}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="rs-troca">
              <input
                type="checkbox"
                role="switch"
                checked={anonimo === 1}
                onChange={(e) => setAnonimo(e.target.checked ? 1 : 0)}
              />
              <span className="rs-troca-trilho" aria-hidden="true"></span>
              <span>
                <b>Publicar anonimamente</b>
                <small>Seu nome não aparece na ideia.</small>
              </span>
            </label>
          </div>

          <div className="rs-janela-rodape">
            <button
              type="button"
              className="rs-btn rs-btn--suave"
              onClick={fecharPublicar}
              disabled={publicando}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rs-btn rs-btn--spark"
              onClick={handleTransformarEmIdeia}
              disabled={publicando}
            >
              <i className="fa-solid fa-lightbulb" aria-hidden="true"></i>
              {publicando ? "Publicando..." : "Publicar ideia"}
            </button>
          </div>
        </Janela>
      )}

      {/* Confirmar exclusão */}
      {rascunhoParaExcluir && (
        <Janela
          estreita
          aoFechar={() => !excluindo && setRascunhoParaExcluir(null)}
          rotulo="Excluir rascunho"
        >
          <div className="rs-confirma-icone">
            <i className="fa-regular fa-trash-can" aria-hidden="true"></i>
          </div>
          <div className="rs-janela-topo">
            <div>
              <h2>Excluir este rascunho?</h2>
              <p>
                “{rascunhoParaExcluir.TITULO}” será apagado e não dá para
                desfazer.
              </p>
            </div>
          </div>
          <div className="rs-janela-rodape" style={{ paddingTop: 22 }}>
            <button
              type="button"
              className="rs-btn rs-btn--suave"
              onClick={() => setRascunhoParaExcluir(null)}
              disabled={excluindo}
            >
              Manter
            </button>
            <button
              type="button"
              className="rs-btn rs-btn--perigo"
              onClick={handleDeleteRascunho}
              disabled={excluindo}
            >
              {excluindo ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </Janela>
      )}
    </AppLayout>
  );
};
