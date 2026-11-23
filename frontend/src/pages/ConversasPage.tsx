import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { fetchApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import type { Contato, MensagemContato } from "../types";
import { useDestaque } from "../utils/destaque";
import "./Conversas.css";

const MENSAGEM_MAX = 1000;
const AVISAR_RESTANTES = 150;
const ATUALIZAR_LISTA_MS = 20000;
const ATUALIZAR_CHAT_MS = 5000;
const NOME_ANONIMO = "Autor anônimo";

const MOTIVOS_DENUNCIA = [
  "Assédio ou ofensas",
  "Spam ou propaganda",
  "Golpe ou pedido de dinheiro",
  "Tentativa de roubar dados",
  "Outro",
];

type Filtro = "todas" | "pedidos" | "abertas";

const FILTROS: { id: Filtro; nome: string }[] = [
  { id: "todas", nome: "Todas" },
  { id: "pedidos", nome: "Pedidos" },
  { id: "abertas", nome: "Abertas" },
];

type Acao = "recusar" | "encerrar" | "cancelar";

const CONFIRMACOES: Record<
  Acao,
  { titulo: string; texto: string; botao: string; tipo: "perigo" | "azul" }
> = {
  recusar: {
    titulo: "Recusar este pedido?",
    texto: "A pessoa será avisada de que você não pode conversar agora.",
    botao: "Recusar pedido",
    tipo: "perigo",
  },
  encerrar: {
    titulo: "Encerrar esta conversa?",
    texto:
      "Ninguém poderá enviar novas mensagens. A outra pessoa será avisada.",
    botao: "Encerrar conversa",
    tipo: "perigo",
  },
  cancelar: {
    titulo: "Cancelar o seu pedido?",
    texto:
      "Você não poderá enviar outro pedido para esta ideia depois de cancelar.",
    botao: "Cancelar pedido",
    tipo: "perigo",
  },
};

// Cores do avatar: escolhidas pelo nome, para a mesma pessoa ter sempre a mesma cor.
const CORES_AVATAR = [
  { fundo: "#dbe7ff", texto: "#07327c" },
  { fundo: "#d9f3e6", texto: "#17683b" },
  { fundo: "#fde4ef", texto: "#9b2c5f" },
  { fundo: "#ece3ff", texto: "#5b3aa6" },
  { fundo: "#d8f1f5", texto: "#0f6676" },
  { fundo: "#ffe8d6", texto: "#a24b0a" },
];

function corDoNome(nome: string) {
  let soma = 0;
  for (let i = 0; i < nome.length; i += 1) soma += nome.charCodeAt(i);
  return CORES_AVATAR[soma % CORES_AVATAR.length];
}

const Avatar: React.FC<{ nome: string; grande?: boolean }> = ({
  nome,
  grande = false,
}) => {
  const anonimo = nome === NOME_ANONIMO;
  const cor = anonimo ? { fundo: "#e8ecf3", texto: "#52607f" } : corDoNome(nome);

  return (
    <span
      className={`cv-avatar${grande ? " cv-avatar--grande" : ""}`}
      style={{ background: cor.fundo, color: cor.texto }}
      aria-hidden="true"
    >
      {anonimo ? (
        <i className="fa-solid fa-user-secret"></i>
      ) : (
        nome.trim().charAt(0).toUpperCase() || "?"
      )}
    </span>
  );
};

const NOMES_STATUS: Record<Contato["STATUS"], string> = {
  Pendente: "Aguardando resposta",
  Aceito: "Conversa aberta",
  Recusado: "Pedido recusado",
  Encerrado: "Conversa encerrada",
};

function nomeDoStatus(contato: Contato): string {
  if (contato.STATUS === "Pendente" && contato.PAPEL === "autor") {
    return "Pedido recebido";
  }
  return NOMES_STATUS[contato.STATUS];
}

const Etiqueta: React.FC<{ contato: Contato }> = ({ contato }) => (
  <span className={`cv-etiqueta cv-etiqueta--${contato.STATUS.toLowerCase()}`}>
    <span className="cv-ponto" aria-hidden="true"></span>
    {nomeDoStatus(contato)}
  </span>
);

// ---- datas ----

function ehValida(data?: string): Date | null {
  if (!data) return null;
  const d = new Date(data);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mesmoDia(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function horaCurta(data?: string): string {
  const d = ehValida(data);
  return d
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "";
}

// Hora na lista: hoje mostra a hora; ontem, "Ontem"; antes disso, a data.
function horaDaLista(data?: string): string {
  const d = ehValida(data);
  if (!d) return "";

  const hoje = new Date();
  if (mesmoDia(d, hoje)) return horaCurta(data);

  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (mesmoDia(d, ontem)) return "Ontem";

  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function rotuloDoDia(d: Date): string {
  const hoje = new Date();
  if (mesmoDia(d, hoje)) return "Hoje";

  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (mesmoDia(d, ontem)) return "Ontem";

  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

// ---- página ----

export const ConversasPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [contatos, setContatos] = useState<Contato[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const idAberto = Number(searchParams.get("abrir")) || null;
  const [contatoAberto, setContatoAberto] = useState<Contato | null>(null);
  const [mensagens, setMensagens] = useState<MensagemContato[]>([]);
  const [carregandoChat, setCarregandoChat] = useState(false);
  const [escalonar, setEscalonar] = useState(false);

  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [decidindo, setDecidindo] = useState(false);
  const [confirmando, setConfirmando] = useState<Acao | null>(null);

  const [denunciando, setDenunciando] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVOS_DENUNCIA[0]);
  const [descricao, setDescricao] = useState("");
  const [enviandoDenuncia, setEnviandoDenuncia] = useState(false);

  // Vindo do sininho: a lista e a conversa piscam quando tudo estiver carregado
  useDestaque(
    !carregandoLista &&
      (idAberto === null ||
        (contatoAberto?.ID === idAberto && !carregandoChat)),
  );

  const rolagemRef = useRef<HTMLDivElement | null>(null);
  const campoRef = useRef<HTMLTextAreaElement | null>(null);
  const rolarParaOFim = useRef(true);

  // showToast e setSearchParams mudam de identidade a cada renderização; guardá-los
  // em "refs" evita que a conversa seja recarregada (e o carregando pisque) a cada aviso.
  const showToastRef = useRef(showToast);
  const setSearchParamsRef = useRef(setSearchParams);
  showToastRef.current = showToast;
  setSearchParamsRef.current = setSearchParams;

  const carregarLista = useCallback(async () => {
    try {
      const lista = await fetchApi<Contato[]>("/contatos");
      setContatos(Array.isArray(lista) ? lista : []);
    } catch {
      // mantém a lista anterior; o aviso só aparece na primeira carga
    } finally {
      setCarregandoLista(false);
    }
  }, []);

  const carregarChat = useCallback(
    async (id: number, primeiraVez: boolean) => {
      try {
        if (primeiraVez) setCarregandoChat(true);

        const resposta = await fetchApi<{
          contato: Contato;
          mensagens: MensagemContato[];
        }>(`/contatos/${id}`);

        setContatoAberto(resposta.contato);
        setMensagens(resposta.mensagens);

        // O servidor marcou como lidas ao abrir: atualiza o contador da lista.
        if (primeiraVez) carregarLista();
      } catch {
        if (primeiraVez) {
          setContatoAberto(null);
          setMensagens([]);
          setSearchParamsRef.current({}, { replace: true });
          showToastRef.current("Conversa não encontrada", "error");
        }
      } finally {
        if (primeiraVez) setCarregandoChat(false);
      }
    },
    [carregarLista],
  );

  // Lista: carrega ao entrar e atualiza de tempos em tempos
  useEffect(() => {
    carregarLista();
    const intervalo = setInterval(carregarLista, ATUALIZAR_LISTA_MS);
    return () => clearInterval(intervalo);
  }, [carregarLista]);

  // Conversa aberta: carrega e atualiza a cada poucos segundos
  useEffect(() => {
    setContatoAberto(null);
    setMensagens([]);
    setTexto("");
    setDenunciando(false);

    if (!idAberto) return undefined;

    rolarParaOFim.current = true;
    setEscalonar(true);
    const fimDaEntrada = setTimeout(() => setEscalonar(false), 1000);

    carregarChat(idAberto, true);
    const intervalo = setInterval(
      () => carregarChat(idAberto, false),
      ATUALIZAR_CHAT_MS,
    );

    return () => {
      clearTimeout(fimDaEntrada);
      clearInterval(intervalo);
    };
  }, [idAberto, carregarChat]);

  // Rola até a última mensagem ao abrir, ao enviar e quando chega algo novo (se a pessoa já estava no fim)
  useEffect(() => {
    const el = rolagemRef.current;
    if (!el || mensagens.length === 0) return;

    const pertoDoFim = el.scrollHeight - el.scrollTop - el.clientHeight < 220;

    if (rolarParaOFim.current || pertoDoFim) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: rolarParaOFim.current ? "auto" : "smooth",
      });
      rolarParaOFim.current = false;
    }
  }, [mensagens]);

  // Campo de escrever cresce junto com o texto (até um limite)
  useEffect(() => {
    const campo = campoRef.current;
    if (!campo) return;

    campo.style.height = "auto";
    campo.style.height = `${Math.min(campo.scrollHeight, 120)}px`;
  }, [texto, contatoAberto?.STATUS]);

  // Esc fecha a janela de confirmação
  useEffect(() => {
    if (!confirmando) return undefined;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setConfirmando(null);
    };

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [confirmando]);

  const abrir = (id: number) => setSearchParams({ abrir: String(id) });
  const voltarParaLista = () => setSearchParams({});

  const atualizarTudo = async () => {
    await carregarLista();
    if (idAberto) await carregarChat(idAberto, false);
  };

  const enviar = async () => {
    const conteudo = texto.trim();

    if (!conteudo || !contatoAberto || enviando) return;

    try {
      setEnviando(true);
      await fetchApi(`/contatos/${contatoAberto.ID}/mensagens`, {
        method: "POST",
        body: JSON.stringify({ texto: conteudo }),
      });
      setTexto("");
      rolarParaOFim.current = true;
      await atualizarTudo();
    } catch (err: any) {
      showToast(err.message || "Erro ao enviar a mensagem", "error");
      await atualizarTudo();
    } finally {
      setEnviando(false);
      campoRef.current?.focus();
    }
  };

  const aoTeclar = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter envia; Shift+Enter quebra a linha
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      enviar();
    }
  };

  const executar = async (acao: "aceitar" | "recusar" | "encerrar") => {
    if (!contatoAberto || decidindo) return;

    try {
      setDecidindo(true);
      const resposta = await fetchApi<{ mensagem: string }>(
        `/contatos/${contatoAberto.ID}/${acao}`,
        { method: "PATCH" },
      );
      showToast(resposta.mensagem, "success");
    } catch (err: any) {
      showToast(err.message || "Não foi possível concluir a ação", "error");
    } finally {
      setDecidindo(false);
      setConfirmando(null);
      await atualizarTudo();
    }
  };

  const confirmar = () => {
    if (!confirmando) return;
    executar(confirmando === "recusar" ? "recusar" : "encerrar");
  };

  const denunciar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contatoAberto || enviandoDenuncia) return;

    try {
      setEnviandoDenuncia(true);
      const resposta = await fetchApi<{ mensagem: string }>(
        `/contatos/${contatoAberto.ID}/denunciar`,
        {
          method: "POST",
          body: JSON.stringify({
            motivo,
            descricao: descricao.trim() || undefined,
          }),
        },
      );
      showToast(resposta.mensagem, "success");
      setDenunciando(false);
      setDescricao("");
    } catch (err: any) {
      showToast(err.message || "Erro ao enviar a denúncia", "error");
    } finally {
      setEnviandoDenuncia(false);
    }
  };

  // ---- dados da lista ----
  const totalPedidos = contatos.filter((c) => c.STATUS === "Pendente").length;
  const totalAbertas = contatos.filter((c) => c.STATUS === "Aceito").length;
  const contagem: Record<Filtro, number> = {
    todas: contatos.length,
    pedidos: totalPedidos,
    abertas: totalAbertas,
  };

  const visiveis = contatos.filter((c) => {
    if (filtro === "pedidos") return c.STATUS === "Pendente";
    if (filtro === "abertas") return c.STATUS === "Aceito";
    return true;
  });

  const indiceDoFiltro = FILTROS.findIndex((f) => f.id === filtro);
  const souAutor = contatoAberto?.PAPEL === "autor";
  const restantes = MENSAGEM_MAX - texto.length;

  // ---- mensagens agrupadas por dia e por quem escreveu ----
  const blocos: React.ReactNode[] = [];
  let ultimoDia: Date | null = null;

  mensagens.forEach((m, i) => {
    const quando = ehValida(m.CREATED_AT);
    const anterior = mensagens[i - 1];
    const proxima = mensagens[i + 1];

    if (quando && (!ultimoDia || !mesmoDia(quando, ultimoDia))) {
      blocos.push(
        <div className="cv-dia" key={`dia-${m.ID}`}>
          {rotuloDoDia(quando)}
        </div>,
      );
    }
    if (quando) ultimoDia = quando;

    const quandoProxima = ehValida(proxima?.CREATED_AT);
    const inicioDoGrupo =
      !anterior ||
      anterior.MINHA !== m.MINHA ||
      Boolean(quando && ehValida(anterior.CREATED_AT) && !mesmoDia(quando, ehValida(anterior.CREATED_AT) as Date));
    const fimDoGrupo =
      !proxima ||
      proxima.MINHA !== m.MINHA ||
      Boolean(quando && quandoProxima && !mesmoDia(quando, quandoProxima));

    const atraso = escalonar
      ? Math.max(0, i - (mensagens.length - 8)) * 45
      : 0;

    blocos.push(
      <div
        key={m.ID}
        className={[
          "cv-msg",
          m.MINHA ? "cv-msg--minha" : "cv-msg--deles",
          inicioDoGrupo ? "cv-msg--inicio" : "",
          fimDoGrupo ? "cv-msg--fim" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ "--cv-atraso": `${atraso}ms` } as React.CSSProperties}
      >
        <div className="cv-balao">{m.TEXTO}</div>
        {fimDoGrupo && <span className="cv-hora">{horaCurta(m.CREATED_AT)}</span>}
      </div>,
    );
  });

  return (
    <AppLayout>
      <section className="content cv-page">
        <div className="cv-intro">
          <h1>Conversas</h1>
          <p className="description">
            Seus pedidos para adotar ideias e as conversas com quem se
            interessou pelas suas.
          </p>
        </div>

        <div className="cv-shell" data-aberta={idAberto ? "true" : "false"}>
          {/* ------------------------------ lista ------------------------------ */}
          <aside className="cv-lista" aria-label="Lista de conversas">
            <div className="cv-filtros" role="tablist" aria-label="Filtrar conversas">
              <span
                className="cv-filtros-marca"
                style={{ transform: `translateX(${indiceDoFiltro * 100}%)` }}
                aria-hidden="true"
              ></span>
              {FILTROS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={filtro === f.id}
                  className="cv-filtro"
                  onClick={() => setFiltro(f.id)}
                >
                  {f.nome}
                  <span className="cv-filtro-n">{contagem[f.id]}</span>
                </button>
              ))}
            </div>

            <div className="cv-itens">
              {carregandoLista ? (
                [0, 1, 2, 3].map((n) => (
                  <div className="cv-esqueleto" key={n} aria-hidden="true">
                    <div className="cv-esqueleto-bola"></div>
                    <div>
                      <div className="cv-esqueleto-linha" style={{ width: "55%" }}></div>
                      <div className="cv-esqueleto-linha" style={{ width: "80%" }}></div>
                    </div>
                  </div>
                ))
              ) : contatos.length === 0 ? (
                <div className="cv-vazio cv-vazio-lista">
                  <span className="cv-vazio-icone" aria-hidden="true">
                    <i className="fa-regular fa-lightbulb"></i>
                  </span>
                  <h2>Nenhuma conversa ainda</h2>
                  <p>
                    Quando você pedir para adotar uma ideia, ou alguém pedir a
                    sua, a conversa aparece aqui.
                  </p>
                  <button
                    type="button"
                    className="cv-botao cv-botao--azul"
                    onClick={() => navigate("/home")}
                  >
                    Explorar ideias
                  </button>
                </div>
              ) : visiveis.length === 0 ? (
                <p className="cv-nota" style={{ padding: "18px 14px", textAlign: "center" }}>
                  Nenhuma conversa neste filtro.
                </p>
              ) : (
                visiveis.map((contato) => (
                  <button
                    key={contato.ID}
                    type="button"
                    className={`cv-item${contato.NAO_LIDAS ? " cv-item--nova" : ""}`}
                    data-destaque={`conversa-${contato.ID}`}
                    aria-current={contato.ID === idAberto}
                    onClick={() => abrir(contato.ID)}
                  >
                    <Avatar nome={contato.OUTRO_NOME} />

                    <span style={{ minWidth: 0 }}>
                      <span className="cv-item-topo">
                        <span className="cv-item-nome">{contato.OUTRO_NOME}</span>
                        <span className="cv-item-hora">
                          {horaDaLista(contato.UPDATED_AT)}
                        </span>
                      </span>

                      <span className="cv-item-ideia">
                        {contato.IDEIA_TITULO}
                      </span>

                      <span className="cv-item-previa">
                        <span className="cv-item-texto">{contato.ULTIMA_MENSAGEM}</span>
                        {Boolean(contato.NAO_LIDAS) && (
                          <span
                            className="cv-badge"
                            aria-label={`${contato.NAO_LIDAS} mensagens não lidas`}
                          >
                            {contato.NAO_LIDAS}
                          </span>
                        )}
                      </span>

                      {contato.STATUS !== "Aceito" && <Etiqueta contato={contato} />}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* ---------------------------- conversa ---------------------------- */}
          <section className="cv-chat" aria-label="Conversa">
            {!idAberto ? (
              <div className="cv-vazio">
                <span className="cv-vazio-icone" aria-hidden="true">
                  <i className="fa-regular fa-comments"></i>
                </span>
                <h2>Escolha uma conversa</h2>
                <p>
                  Selecione um contato na lista para ler as mensagens ou
                  responder a um pedido.
                </p>
              </div>
            ) : carregandoChat || !contatoAberto ? (
              <div className="cv-vazio">
                <span className="cv-vazio-icone" aria-hidden="true">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                </span>
                <p>Abrindo conversa...</p>
              </div>
            ) : (
              <div className="cv-conversa" key={contatoAberto.ID}>
                <header className="cv-topo">
                  <button
                    type="button"
                    className="cv-voltar"
                    onClick={voltarParaLista}
                    aria-label="Voltar para a lista"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>

                  <Avatar nome={contatoAberto.OUTRO_NOME} grande />

                  <div className="cv-topo-info">
                    <div className="cv-topo-nome">{contatoAberto.OUTRO_NOME}</div>
                    <button
                      type="button"
                      className="cv-ideia"
                      onClick={() => navigate(`/ideia/${contatoAberto.IDEIAS_ID}`)}
                      title="Ver a ideia"
                    >
                      <span className="cv-ideia-icone" aria-hidden="true">
                        <i className="fa-solid fa-lightbulb"></i>
                      </span>
                      <span className="cv-ideia-titulo">{contatoAberto.IDEIA_TITULO}</span>
                    </button>
                  </div>

                  <div className="cv-acoes">
                    <Etiqueta contato={contatoAberto} />

                    {contatoAberto.STATUS === "Aceito" && (
                      <button
                        type="button"
                        className="cv-btn-icone"
                        onClick={() => setConfirmando("encerrar")}
                        aria-label="Encerrar conversa"
                      >
                        <i className="fa-solid fa-lock"></i>
                        <span className="cv-btn-texto">Encerrar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="cv-btn-icone cv-btn-icone--perigo"
                      onClick={() => setDenunciando((aberto) => !aberto)}
                      aria-expanded={denunciando}
                      aria-label="Denunciar conversa"
                    >
                      <i className="fa-solid fa-flag"></i>
                      <span className="cv-btn-texto">Denunciar</span>
                    </button>
                  </div>
                </header>

                {/* painel de denúncia: desliza para baixo */}
                <div className="cv-denuncia" data-aberta={denunciando ? "true" : "false"}>
                  <div className="cv-denuncia-miolo">
                    <form className="cv-denuncia-form" onSubmit={denunciar}>
                      <h3 className="cv-denuncia-titulo">Denunciar esta conversa</h3>

                      <fieldset className="cv-motivos">
                        <legend style={{ position: "absolute", opacity: 0 }}>
                          Motivo da denúncia
                        </legend>
                        {MOTIVOS_DENUNCIA.map((m) => (
                          <label className="cv-motivo" key={m}>
                            <input
                              type="radio"
                              name="motivo-conversa"
                              value={m}
                              checked={motivo === m}
                              onChange={() => setMotivo(m)}
                              tabIndex={denunciando ? 0 : -1}
                            />
                            <span>{m}</span>
                          </label>
                        ))}
                      </fieldset>

                      <textarea
                        className="cv-campo"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        maxLength={2000}
                        rows={3}
                        placeholder="Conte o que aconteceu (opcional)"
                        aria-label="Descrição da denúncia"
                        tabIndex={denunciando ? 0 : -1}
                      />

                      <p className="cv-nota">
                        Ao denunciar, a moderação poderá ler esta conversa.
                      </p>

                      <div className="cv-linha-botoes">
                        <button
                          type="submit"
                          className="cv-botao cv-botao--perigo"
                          disabled={enviandoDenuncia}
                          tabIndex={denunciando ? 0 : -1}
                        >
                          Enviar denúncia
                        </button>
                        <button
                          type="button"
                          className="cv-botao cv-botao--suave"
                          onClick={() => setDenunciando(false)}
                          tabIndex={denunciando ? 0 : -1}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="cv-aviso" role="note">
                  <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
                  <span>
                    Nunca envie senhas, códigos ou dinheiro. A moderação só lê
                    esta conversa se alguém a denunciar.
                  </span>
                </div>

                <div
                  className="cv-mensagens"
                  ref={rolagemRef}
                  role="log"
                  aria-live="polite"
                  aria-label="Mensagens"
                >
                  {blocos}
                </div>

                <div className="cv-rodape">
                  {contatoAberto.STATUS === "Pendente" && souAutor && (
                    <div className="cv-decisao" data-destaque="decisao">
                      <p className="cv-decisao-texto">
                        <strong>{contatoAberto.OUTRO_NOME} quer adotar a sua ideia</strong>
                        Se você aceitar, vocês conversam por aqui, em privado.
                      </p>
                      <div className="cv-linha-botoes">
                        <button
                          type="button"
                          className="cv-botao cv-botao--ok"
                          disabled={decidindo}
                          onClick={() => executar("aceitar")}
                        >
                          <i className="fa-solid fa-check" aria-hidden="true"></i>
                          Aceitar
                        </button>
                        <button
                          type="button"
                          className="cv-botao cv-botao--suave-perigo"
                          disabled={decidindo}
                          onClick={() => setConfirmando("recusar")}
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  )}

                  {contatoAberto.STATUS === "Pendente" && !souAutor && (
                    <div className="cv-decisao cv-decisao--neutra" data-destaque="decisao">
                      <p className="cv-decisao-texto">
                        <strong>Pedido enviado</strong>
                        Você poderá conversar assim que o autor aceitar.
                      </p>
                      <button
                        type="button"
                        className="cv-botao cv-botao--suave"
                        disabled={decidindo}
                        onClick={() => setConfirmando("cancelar")}
                      >
                        Cancelar pedido
                      </button>
                    </div>
                  )}

                  {contatoAberto.STATUS === "Aceito" && (
                    <>
                      <div className="cv-escrever" data-destaque="composer">
                        <textarea
                          ref={campoRef}
                          className="cv-campo"
                          value={texto}
                          onChange={(e) => setTexto(e.target.value)}
                          onKeyDown={aoTeclar}
                          maxLength={MENSAGEM_MAX}
                          rows={1}
                          placeholder="Escreva uma mensagem"
                          aria-label="Mensagem"
                        />
                        <button
                          type="button"
                          className="cv-enviar"
                          onClick={enviar}
                          disabled={enviando || !texto.trim()}
                          aria-label="Enviar mensagem"
                        >
                          <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
                        </button>
                      </div>
                      {restantes <= AVISAR_RESTANTES && (
                        <div
                          className={`cv-contador${restantes <= 0 ? " cv-contador--limite" : ""}`}
                        >
                          {restantes} caracteres restantes
                        </div>
                      )}
                    </>
                  )}

                  {(contatoAberto.STATUS === "Recusado" ||
                    contatoAberto.STATUS === "Encerrado") && (
                    <div className="cv-fechada" data-destaque="decisao">
                      <i className="fa-solid fa-lock" aria-hidden="true"></i>
                      {contatoAberto.STATUS === "Recusado"
                        ? "Este pedido foi recusado."
                        : "Esta conversa foi encerrada. Não é possível enviar novas mensagens."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </section>

      {/* Janela de confirmação (fica fora da página para cobrir a tela toda) */}
      {confirmando &&
        createPortal(
          <div className="cv-fundo" onClick={() => setConfirmando(null)}>
            <div
              className="cv-janela"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="cv-janela-titulo"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="cv-janela-titulo">{CONFIRMACOES[confirmando].titulo}</h3>
              <p>{CONFIRMACOES[confirmando].texto}</p>
              <div className="cv-linha-botoes">
                <button
                  type="button"
                  className="cv-botao cv-botao--suave"
                  onClick={() => setConfirmando(null)}
                  autoFocus
                >
                  Voltar
                </button>
                <button
                  type="button"
                  className={`cv-botao cv-botao--${CONFIRMACOES[confirmando].tipo}`}
                  disabled={decidindo}
                  onClick={confirmar}
                >
                  {CONFIRMACOES[confirmando].botao}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </AppLayout>
  );
};
