import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fetchApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import "./PenalidadeUsuarioModal.css";

interface Resumo {
  usuario: { id: number; nome: string; banido: boolean };
  conteudo: { ideias: number; comentarios: number };
}

type Acao = "banir" | "excluir";

interface Props {
  usuarioId: number;
  denunciaId?: number;
  aoFechar: () => void;
  aoConcluir: () => void;
}

const MOTIVO_MIN = 20;
const MOTIVO_MAX = 500;
const NOMES_ETAPA = [
  "Etapa 1 de 4 · A medida",
  "Etapa 2 de 4 · O motivo",
  "Etapa 3 de 4 · Confirmar quem é",
  "Etapa 4 de 4 · Sua senha",
];

export const PenalidadeUsuarioModal: React.FC<Props> = ({
  usuarioId,
  denunciaId,
  aoFechar,
  aoConcluir,
}) => {
  const { showToast } = useToast();
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erroResumo, setErroResumo] = useState("");
  const [etapa, setEtapa] = useState(0);
  const [acao, setAcao] = useState<Acao>("banir");
  const [motivo, setMotivo] = useState("");
  const [nome, setNome] = useState("");
  const [entendo, setEntendo] = useState(false);
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    fetchApi<Resumo>(`/admin/usuarios/${usuarioId}/resumo`)
      .then((dados) => {
        if (!ativo) return;
        setResumo(dados);
        // Quem já está banido só pode ser excluído.
        if (dados.usuario.banido) setAcao("excluir");
      })
      .catch((e: any) => ativo && setErroResumo(e.message || "Não foi possível carregar o usuário."));

    return () => {
      ativo = false;
    };
  }, [usuarioId]);

  useEffect(() => {
    const aoApertar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape" && !enviando) aoFechar();
    };

    window.addEventListener("keydown", aoApertar);
    return () => window.removeEventListener("keydown", aoApertar);
  }, [aoFechar, enviando]);

  const nomeAlvo = resumo?.usuario.nome ?? "";
  const motivoOk = motivo.trim().length >= MOTIVO_MIN;
  const nomeOk = nomeAlvo !== "" && nome.trim().toLowerCase() === nomeAlvo.trim().toLowerCase();
  const confirmaOk = nomeOk && (acao === "banir" || entendo);

  const podeAvancar =
    etapa === 0 ? resumo !== null && (!resumo.usuario.banido || acao === "excluir")
      : etapa === 1 ? motivoOk
      : etapa === 2 ? confirmaOk
      : senha.length > 0;

  const concluir = async () => {
    if (enviando || !senha) return;
    setEnviando(true);
    setErro("");

    try {
      await fetchApi(`/admin/usuarios/${usuarioId}/penalidade`, {
        method: "POST",
        body: JSON.stringify({
          acao,
          motivo: motivo.trim(),
          confirmacaoNome: nome.trim(),
          senhaAdmin: senha,
          entendoQueNaoDesfaz: acao === "excluir" ? entendo : undefined,
          denunciaId,
        }),
      });

      showToast(acao === "banir" ? "Usuário banido." : "Usuário excluído.", "success");
      aoConcluir();
    } catch (e: any) {
      setErro(e.message || "Não foi possível aplicar a medida.");
      setSenha("");
    } finally {
      setEnviando(false);
    }
  };

  const avancar = (evento: React.FormEvent) => {
    evento.preventDefault();
    if (!podeAvancar || enviando) return;
    if (etapa < 3) setEtapa(etapa + 1);
    else void concluir();
  };

  return createPortal(
    <div className="pn-fundo" onClick={() => !enviando && aoFechar()}>
      <div
        className="pn-janela"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pn-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pn-topo">
          <span className="pn-icone" aria-hidden="true">
            <i className="fa-solid fa-user-slash"></i>
          </span>
          <div className="pn-topo-texto">
            <h2 id="pn-titulo">Banir ou excluir usuário</h2>
            <p>Só para casos muito graves. Cada etapa precisa ser confirmada.</p>
          </div>
          <button type="button" className="pn-fechar" onClick={aoFechar} disabled={enviando} aria-label="Fechar">
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <div className="pn-etapas" aria-hidden="true">
          {NOMES_ETAPA.map((n, i) => (
            <span key={n} className="pn-etapa" data-feita={i <= etapa}></span>
          ))}
        </div>
        <p className="pn-etapa-nome">{NOMES_ETAPA[etapa]}</p>

        <form onSubmit={avancar}>
          <div className="pn-corpo">
            {erroResumo && <div className="pn-caixa pn-caixa--bad"><i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>{erroResumo}</span></div>}
            {!resumo && !erroResumo && <p className="pn-ajuda">Carregando...</p>}

            {resumo && etapa === 0 && (
              <>
                <p className="pn-pergunta">O que fazer com a conta de <span className="pn-nome-alvo">{resumo.usuario.nome}</span>?</p>

                <div className="pn-numeros">
                  <div className="pn-numero"><b>{resumo.conteudo.ideias}</b><small>ideias</small></div>
                  <div className="pn-numero"><b>{resumo.conteudo.comentarios}</b><small>comentários</small></div>
                  <div className="pn-numero"><b>{resumo.usuario.banido ? "Sim" : "Não"}</b><small>já banido</small></div>
                </div>

                <div className="pn-opcoes" role="radiogroup" aria-label="Medida">
                  {!resumo.usuario.banido && (
                    <label className="pn-opcao">
                      <input type="radio" name="pn-acao" checked={acao === "banir"} onChange={() => setAcao("banir")} />
                      <span className="pn-opcao-corpo">
                        <i className="fa-solid fa-ban" aria-hidden="true"></i>
                        <span>
                          <b>Banir</b>
                          <small>A pessoa não consegue mais entrar e as ideias públicas dela ficam ocultas. Os dados ficam guardados e dá para liberar depois.</small>
                        </span>
                      </span>
                    </label>
                  )}
                  <label className="pn-opcao">
                    <input type="radio" name="pn-acao" checked={acao === "excluir"} onChange={() => setAcao("excluir")} />
                    <span className="pn-opcao-corpo">
                      <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
                      <span>
                        <b>Excluir a conta</b>
                        <small>Apaga a conta e tudo que é dela (ideias, comentários, conversas). Não tem como desfazer.</small>
                      </span>
                    </span>
                  </label>
                </div>

                <div className="pn-caixa">
                  <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                  <span>Antes de seguir, confira se uma advertência ou ocultar a ideia já não resolve.</span>
                </div>
              </>
            )}

            {resumo && etapa === 1 && (
              <>
                <p className="pn-pergunta">Por que esta medida é necessária?</p>
                <p className="pn-ajuda">Fica registrado no histórico de moderação, com o seu nome. Seja claro e objetivo.</p>
                <textarea
                  className="pn-campo"
                  rows={5}
                  maxLength={MOTIVO_MAX}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex.: ameaças repetidas a outros usuários, mesmo após advertência."
                  aria-label="Motivo"
                />
                <p className="pn-contador">
                  {motivo.trim().length}/{MOTIVO_MAX} · mínimo {MOTIVO_MIN}
                </p>
              </>
            )}

            {resumo && etapa === 2 && (
              <>
                <p className="pn-pergunta">Confirme quem será {acao === "banir" ? "banido" : "excluído"}.</p>
                <p className="pn-ajuda">
                  Digite o nome exato da conta: <span className="pn-nome-alvo">{nomeAlvo}</span>
                </p>
                <input
                  className="pn-campo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoComplete="off"
                  aria-label="Nome do usuário"
                />
                {acao === "excluir" && (
                  <label className="pn-marca">
                    <input type="checkbox" checked={entendo} onChange={(e) => setEntendo(e.target.checked)} />
                    <span>Entendo que excluir apaga tudo desta conta e <b>não tem volta</b>.</span>
                  </label>
                )}
              </>
            )}

            {resumo && etapa === 3 && (
              <>
                <p className="pn-pergunta">Última confirmação: digite a sua senha.</p>
                <div className={`pn-caixa${acao === "excluir" ? " pn-caixa--bad" : ""}`}>
                  <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                  <span>
                    {acao === "banir" ? "Banir" : "Excluir"} <b>{nomeAlvo}</b> agora.
                    {acao === "excluir" ? " Isso não pode ser desfeito." : " Você poderá liberar a conta depois."}
                  </span>
                </div>
                <input
                  className="pn-campo"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
                  aria-label="Sua senha"
                  placeholder="Sua senha de administrador"
                />
                {erro && <p className="pn-erro" role="alert">{erro}</p>}
              </>
            )}
          </div>

          <div className="pn-rodape">
            <button type="button" className="pn-btn pn-btn--suave" onClick={etapa === 0 ? aoFechar : () => { setErro(""); setEtapa(etapa - 1); }} disabled={enviando}>
              {etapa === 0 ? "Cancelar" : "Voltar"}
            </button>
            <div className="pn-rodape-dir">
              <button type="submit" className={`pn-btn ${etapa === 3 ? "pn-btn--perigo" : "pn-btn--azul"}`} disabled={!podeAvancar || enviando}>
                {etapa < 3 ? "Continuar" : enviando ? "Aplicando..." : acao === "banir" ? "Banir usuário" : "Excluir usuário"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
