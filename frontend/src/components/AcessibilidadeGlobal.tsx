import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Acessibilidade para teclado e leitor de tela, em todas as páginas:
 *  1) Troca o título da aba a cada página e avisa o leitor de tela que a página mudou.
 *  2) Em qualquer janela (role="dialog" / aria-modal): o foco vai para dentro dela,
 *     o Tab não "foge" para trás da janela e, ao fechar, o foco volta ao botão que abriu.
 */

const TITULOS: Array<[RegExp, string]> = [
  [/^\/$/, "Entrar"],
  [/^\/cadastro/, "Criar conta"],
  [/^\/esqueceu-senha/, "Esqueci minha senha"],
  [/^\/redefinir-senha/, "Criar nova senha"],
  [/^\/confirmar-email/, "Confirmar e-mail"],
  [/^\/termos/, "Termos de Uso"],
  [/^\/privacidade/, "Política de Privacidade"],
  [/^\/home/, "Início"],
  [/^\/salvos/, "Ideias salvas"],
  [/^\/perfil/, "Meu perfil"],
  [/^\/rascunhos/, "Rascunhos"],
  [/^\/conversas/, "Conversas"],
  [/^\/ideia\//, "Detalhes da ideia"],
  [/^\/admin/, "Painel de denúncias"],
];

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function visivel(el: HTMLElement): boolean {
  return el.getClientRects().length > 0;
}

function focaveisDe(janela: HTMLElement): HTMLElement[] {
  return Array.from(janela.querySelectorAll<HTMLElement>(FOCAVEIS)).filter(visivel);
}

function janelaAberta(): HTMLElement | null {
  const todas = document.querySelectorAll<HTMLElement>('[aria-modal="true"], [role="dialog"], [role="alertdialog"]');
  return todas.length ? todas[todas.length - 1] : null;
}

export const AcessibilidadeGlobal: React.FC = () => {
  const { pathname } = useLocation();
  const primeira = useRef(true);
  const avisoRef = useRef<HTMLDivElement>(null);

  // 1) título + aviso de mudança de página
  useEffect(() => {
    const achado = TITULOS.find(([regra]) => regra.test(pathname));
    const nome = achado ? achado[1] : "Ideia Futura";
    document.title = nome === "Ideia Futura" ? nome : `${nome} | Ideia Futura`;

    if (primeira.current) {
      primeira.current = false;
      return undefined;
    }
    if (avisoRef.current) avisoRef.current.textContent = `Página: ${nome}`;
    const principal = document.getElementById("conteudo");
    if (principal) principal.focus({ preventScroll: true });
    return undefined;
  }, [pathname]);

  // 2) janelas: foco dentro, Tab preso, foco devolvido
  useEffect(() => {
    const abertas = new Map<HTMLElement, HTMLElement | null>();

    const observador = new MutationObserver(() => {
      const atuais = new Set(
        Array.from(
          document.querySelectorAll<HTMLElement>('[aria-modal="true"], [role="dialog"], [role="alertdialog"]')
        )
      );

      atuais.forEach((janela) => {
        if (abertas.has(janela)) return;
        const anterior = document.activeElement as HTMLElement | null;
        abertas.set(janela, anterior);
        window.setTimeout(() => {
          if (janela.contains(document.activeElement)) return;
          const primeiro = focaveisDe(janela)[0];
          if (primeiro) primeiro.focus();
          else {
            janela.setAttribute("tabindex", "-1");
            janela.focus();
          }
        }, 30);
      });

      Array.from(abertas.keys()).forEach((janela) => {
        if (atuais.has(janela)) return;
        const volta = abertas.get(janela);
        abertas.delete(janela);
        if (volta && document.body.contains(volta)) volta.focus();
      });
    });
    observador.observe(document.body, { childList: true, subtree: true });

    const aoApertar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        // janelas antigas sem tratamento próprio do Esc: aciona o botão "Fechar"/"Cancelar"
        const topo = janelaAberta();
        if (topo && topo.dataset.esc === "global") {
          const botoes = Array.from(topo.querySelectorAll<HTMLButtonElement>("button"));
          const fechar =
            botoes.find((b) => (b.getAttribute("aria-label") || "").toLowerCase().startsWith("fechar")) ||
            botoes.find((b) => /^(cancelar|fechar)$/i.test((b.textContent || "").trim()));
          if (fechar && !fechar.disabled) {
            evento.preventDefault();
            fechar.click();
          }
        }
        return;
      }
      if (evento.key !== "Tab") return;
      const janela = janelaAberta();
      if (!janela) return;
      const lista = focaveisDe(janela);
      if (!lista.length) {
        evento.preventDefault();
        return;
      }
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      const ativo = document.activeElement as HTMLElement | null;
      if (!ativo || !janela.contains(ativo)) {
        evento.preventDefault();
        primeiro.focus();
      } else if (evento.shiftKey && ativo === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && ativo === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener("keydown", aoApertar);

    return () => {
      observador.disconnect();
      document.removeEventListener("keydown", aoApertar);
    };
  }, []);

  return <div ref={avisoRef} className="so-leitor-de-tela" role="status" aria-live="polite" />;
};
