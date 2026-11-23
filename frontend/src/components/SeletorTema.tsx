import React from "react";
import { useTema, type PreferenciaTema } from "../context/TemaContext";
import "./SeletorTema.css";

const OPCOES: { valor: PreferenciaTema; titulo: string; dica: string; icone: string }[] = [
  { valor: "claro", titulo: "Claro", dica: "Fundo branco", icone: "fa-sun" },
  { valor: "escuro", titulo: "Escuro", dica: "Menos brilho", icone: "fa-moon" },
  { valor: "automatico", titulo: "Automático", dica: "Igual ao seu aparelho", icone: "fa-circle-half-stroke" },
];

export const SeletorTema: React.FC = () => {
  const { preferencia, definirPreferencia } = useTema();

  return (
    <section className="tm-card" aria-labelledby="tm-titulo">
      <div className="tm-texto">
        <h3 id="tm-titulo">Aparência</h3>
        <p>Escolha como o site fica para você. A escolha fica salva neste aparelho.</p>
      </div>

      <div className="tm-opcoes" role="radiogroup" aria-labelledby="tm-titulo">
        {OPCOES.map((op) => (
          <button
            key={op.valor}
            type="button"
            role="radio"
            aria-checked={preferencia === op.valor}
            className="tm-opcao"
            data-tema={op.valor}
            onClick={() => definirPreferencia(op.valor)}
          >
            <span className="tm-previa" aria-hidden="true">
              <span className="tm-previa-barra"></span>
              <span className="tm-previa-cartao"></span>
              <span className="tm-previa-cartao tm-curto"></span>
            </span>
            <span className="tm-rotulo">
              <i className={`fa-solid ${op.icone}`} aria-hidden="true"></i>
              <b>{op.titulo}</b>
            </span>
            <small>{op.dica}</small>
          </button>
        ))}
      </div>
    </section>
  );
};
