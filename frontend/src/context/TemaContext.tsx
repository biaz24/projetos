import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type PreferenciaTema = "claro" | "escuro" | "automatico";
export type TemaAplicado = "light" | "dark";

interface TemaContextData {
  /** O que a pessoa escolheu (inclui "automatico"). */
  preferencia: PreferenciaTema;
  /** O que está na tela agora. */
  tema: TemaAplicado;
  definirPreferencia: (valor: PreferenciaTema) => void;
}

const CHAVE = "ideiafutura:tema";

const TemaContext = createContext<TemaContextData>({} as TemaContextData);

function lerPreferencia(): PreferenciaTema {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo === "claro" || salvo === "escuro" || salvo === "automatico") return salvo;
  } catch {
    // navegador sem armazenamento: segue o padrão
  }
  return "automatico";
}

function sistemaEscuro(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export const TemaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(lerPreferencia);
  const [sistema, setSistema] = useState<TemaAplicado>(() => (sistemaEscuro() ? "dark" : "light"));

  // Acompanha o tema do computador/celular enquanto estiver em "Automático".
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const aoMudar = (e: MediaQueryListEvent) => setSistema(e.matches ? "dark" : "light");
    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, []);

  const tema: TemaAplicado =
    preferencia === "escuro" ? "dark" : preferencia === "claro" ? "light" : sistema;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
  }, [tema]);

  const definirPreferencia = useCallback((valor: PreferenciaTema) => {
    setPreferencia(valor);
    try {
      localStorage.setItem(CHAVE, valor);
    } catch {
      // sem armazenamento: vale só até fechar a aba
    }
  }, []);

  const valor = useMemo(() => ({ preferencia, tema, definirPreferencia }), [preferencia, tema, definirPreferencia]);

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
};

export const useTema = (): TemaContextData => useContext(TemaContext);
