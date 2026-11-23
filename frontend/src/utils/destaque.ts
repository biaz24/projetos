import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "../../css/destaque.css";

// Como funciona:
// 1. O sininho navega para a página da notificação e manda, junto, os nomes dos
//    itens que devem piscar:  navigate("/perfil", { state: { destaque: ["ideia-12"] } })
// 2. Na página, o item recebe  data-destaque="ideia-12"  e a página chama
//    useDestaque(pronto), onde "pronto" vira true quando os dados já carregaram.
// 3. O hook rola até o primeiro item encontrado e faz todos piscarem.

const DURACAO_MS = 2600;

function encontrar(nome: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-destaque="${nome}"]`);
}

// Faz os itens piscarem. Devolve true se pelo menos um foi encontrado.
export function piscar(nomes: string[]): boolean {
  const elementos = nomes
    .map(encontrar)
    .filter((elemento): elemento is HTMLElement => elemento !== null);

  if (elementos.length === 0) return false;

  elementos[0].scrollIntoView({ behavior: "smooth", block: "center" });

  elementos.forEach((elemento) => {
    // Remove e recoloca a classe para a animação reiniciar se o item já estava piscando
    elemento.classList.remove("destaque-piscada");
    void elemento.offsetWidth;
    elemento.classList.add("destaque-piscada");

    window.setTimeout(
      () => elemento.classList.remove("destaque-piscada"),
      DURACAO_MS,
    );
  });

  return true;
}

export function useDestaque(pronto: boolean) {
  const { state, key } = useLocation();
  const ultimaChave = useRef<string | null>(null);

  const bruto = (state as { destaque?: unknown } | null)?.destaque;
  const lista = Array.isArray(bruto) ? bruto.filter((n) => typeof n === "string").join("|") : "";

  useEffect(() => {
    if (!pronto || !lista) return undefined;

    // Cada clique no sininho gera uma "key" nova: pisca uma vez por clique
    if (ultimaChave.current === key) return undefined;

    let tentativas = 0;
    let temporizador = 0;

    const tentar = () => {
      if (piscar(lista.split("|"))) {
        ultimaChave.current = key;
        return;
      }

      // O item pode demorar um instante para aparecer na tela
      tentativas += 1;
      if (tentativas < 20) temporizador = window.setTimeout(tentar, 150);
    };

    temporizador = window.setTimeout(tentar, 200);
    return () => window.clearTimeout(temporizador);
  }, [pronto, lista, key]);
}
