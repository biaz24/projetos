/**
 * Gera src/tema-escuro.css a partir das cores que já existem no projeto.
 *
 * Como funciona: lê todos os .css e .tsx, pega cada cor clara/escura e cria uma
 * regra "html[data-theme="dark"] ..." com a versão escura dela. Assim as telas
 * antigas (cores escritas direto no código) também ganham o modo escuro sem
 * precisar reescrever nada.
 *
 * Quando mudar alguma cor do site, rode de novo (dentro de frontend/):
 *     npm run tema
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = join(raiz, "src", "tema-escuro.css");
const PREFIXO = 'html[data-theme="dark"]';

/* ---------- utilidades de cor ---------- */

const NOMES = { white: "#ffffff" };

function lerCor(texto) {
  let t = texto.toLowerCase();
  if (NOMES[t]) t = NOMES[t];
  let m = /^#([0-9a-f]{3})$/.exec(t);
  if (m) t = "#" + [...m[1]].map((c) => c + c).join("");
  m = /^#([0-9a-f]{6})$/.exec(t);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbParaHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslParaHex([h, s, l]) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

// Cinzas puros ficam com um leve tom azulado, combinando com o azul do site.
function tingir([h, s, l]) {
  return s < 0.12 ? [222, 0.22, l] : [h, s, l];
}

/* ---------- regras de conversão por tipo de uso ---------- */

// fundo: claros viram superfícies escuras, mantendo a ordem visual:
// branco puro (cartões) fica um degrau ACIMA do fundo da página; tons de
// cinza-azulado (chips, campos) ficam um pouco mais claros que o cartão.
function fundo(hsl) {
  const [h, s, l] = tingir(hsl);
  if (l > 0.7) {
    const sat = limitar(s * 0.55, 0.28, 0.45);
    if (l >= 0.995) return [h, sat, 0.165];
    if (l >= 0.968) return [h, sat, 0.105];
    return [h, sat, 0.18 + ((0.968 - l) / 0.268) * 0.12];
  }
  if (l < 0.35) return [h, s, l + 0.1];
  return [h, s, l];
}

// texto: escuros viram claros; claros (branco) continuam
function texto(hsl) {
  const [h, s, l] = tingir(hsl);
  if (l >= 0.7) return [h, s, l];
  return [h, s * 0.75, limitar(1.05 - l * 0.95, 0.62, 0.93)];
}

// borda: linhas claras viram linhas escuras; bordas coloridas seguem o texto
function borda(hsl) {
  const [h, s, l] = tingir(hsl);
  if (l > 0.7) return [h, s * 0.5, 0.22 + (1 - l) * 0.5];
  return texto(hsl);
}

// cores de destaque (azul, vermelho, verde...): servem de fundo E de texto
function destaque(hsl) {
  const [h, s, l] = tingir(hsl);
  return [h, s, limitar(l, 0.5, 0.62)];
}

function modoDaVariavel(nome, hsl) {
  if (/-(navy|blue|bad|ok|spark|trilho|warn|cor)$/.test(nome)) return destaque;
  if (/^--(b|bh)$|bg|fundo|wash|surface|soft|suave/.test(nome)) return fundo;
  if (/line|borda|border/.test(nome)) return borda;
  if (/ink|mute|text|texto/.test(nome)) return texto;
  return hsl[2] > 0.7 ? fundo : texto;
}

const REGEX_COR = /#[0-9a-fA-F]{3,8}\b|\bwhite\b/g;

function trocarCores(valor, modo) {
  let mudou = false;
  const novo = valor.replace(REGEX_COR, (cor) => {
    const rgb = lerCor(cor);
    if (!rgb) return cor;
    const saida = hslParaHex(modo(rgbParaHsl(rgb)));
    if (saida !== hslParaHex(rgbParaHsl(rgb))) mudou = true;
    return saida;
  });
  return mudou ? novo : null;
}

/* ---------- leitura dos arquivos ---------- */

function listar(dir, exts, acc = []) {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === "dist" || nome === "tema-escuro.css") continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) listar(p, exts, acc);
    else if (exts.some((e) => nome.endsWith(e))) acc.push(p);
  }
  return acc;
}

function separarNoTopo(texto, sep) {
  const partes = [];
  let nivel = 0, atual = "";
  for (const c of texto) {
    if (c === "(" || c === "[") nivel++;
    if (c === ")" || c === "]") nivel--;
    if (c === sep && nivel === 0) { partes.push(atual); atual = ""; } else atual += c;
  }
  if (atual.trim()) partes.push(atual);
  return partes;
}

// Lê o CSS e devolve uma lista de { media, seletor, declaracoes }
function lerCss(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const regras = [];
  function bloco(texto, contexto) {
    let i = 0;
    while (i < texto.length) {
      const abre = texto.indexOf("{", i);
      if (abre === -1) break;
      const cabeca = texto.slice(i, abre).trim();
      let nivel = 1, j = abre + 1;
      while (j < texto.length && nivel > 0) {
        if (texto[j] === "{") nivel++;
        else if (texto[j] === "}") nivel--;
        j++;
      }
      const corpo = texto.slice(abre + 1, j - 1);
      if (cabeca.startsWith("@")) {
        if (/^@(media|supports|container)/.test(cabeca)) bloco(corpo, [...contexto, cabeca]);
      } else if (cabeca) {
        const declaracoes = separarNoTopo(corpo, ";")
          .map((d) => {
            const k = d.indexOf(":");
            return k === -1 ? null : [d.slice(0, k).trim(), d.slice(k + 1).replace(/!important/i, "").trim()];
          })
          .filter(Boolean);
        regras.push({ contexto, seletores: separarNoTopo(cabeca, ",").map((s) => s.trim()), declaracoes });
      }
      i = j;
    }
  }
  bloco(css, []);
  return regras;
}

function prefixar(seletor) {
  if (seletor === ":root") return PREFIXO;
  if (/^html(?![\w-])/.test(seletor)) return PREFIXO + seletor.slice(4);
  return `${PREFIXO} ${seletor}`;
}

const EH_FUNDO = /^(background|background-color|background-image)$/;
const EH_TEXTO = /^(color|fill|stroke|caret-color|text-decoration-color|-webkit-text-fill-color)$/;
const EH_BORDA = /^(border(-top|-right|-bottom|-left)?(-color)?|outline(-color)?)$/;

// Qualquer valor que seja (ou use) uma cor — inclusive var(), transparent etc.
const TOKEN_COR = /#[0-9a-fA-F]{3,8}\b|\bwhite\b|rgba?\([^)]*\)|hsla?\([^)]*\)|var\([^)]*\)|\btransparent\b|\bcurrentColor\b|\binherit\b/i;

/*
 * IMPORTANTE: toda declaração de cor (mesmo as que não mudam, como
 * "background: transparent" ou "var(--x)") é copiada para o tema escuro.
 * Assim a disputa entre regras (qual ganha) continua igual à do tema claro.
 */
function converterDeclaracao([prop, valor], fundoColorido) {
  if (prop.startsWith("--tm-")) return null; // miniaturas do seletor de tema: cores fixas
  if (prop.startsWith("--")) {
    if (!TOKEN_COR.test(valor)) return null;
    const cor = valor.match(REGEX_COR)?.[0];
    if (!cor || !lerCor(cor)) return `${prop}: ${valor}`;
    const novo = trocarCores(valor, modoDaVariavel(prop, rgbParaHsl(lerCor(cor))));
    return `${prop}: ${novo ?? valor}`;
  }
  if (EH_FUNDO.test(prop)) {
    if (valor === "none") return `${prop}: none`;
    if (!TOKEN_COR.test(valor)) return null;
    const novo = trocarCores(valor, fundo) ?? valor;
    const ehImagem = /gradient|url\(/.test(valor);
    return `${ehImagem ? prop : "background-color"}: ${novo}`;
  }
  if (EH_TEXTO.test(prop)) {
    if (!TOKEN_COR.test(valor)) return null;
    if (fundoColorido) return `${prop}: ${valor}`;
    return `${prop}: ${trocarCores(valor, texto) ?? valor}`;
  }
  if (EH_BORDA.test(prop)) {
    const token = valor.match(TOKEN_COR)?.[0];
    if (!token) return null;
    const novo = trocarCores(token, borda) ?? token;
    const destino = prop.endsWith("-color") ? prop : `${prop}-color`;
    return `${destino}: ${novo}`;
  }
  return null;
}

// Fundo "colorido" (médio): o texto dele não deve ser invertido.
function temFundoColorido(declaracoes) {
  return declaracoes.some(([prop, valor]) => {
    if (!EH_FUNDO.test(prop) && !/^--(b|bh)$/.test(prop)) return false;
    return (valor.match(REGEX_COR) || []).some((c) => {
      const rgb = lerCor(c);
      if (!rgb) return false;
      const l = rgbParaHsl(rgb)[2];
      return l >= 0.3 && l <= 0.7;
    });
  });
}

/* ---------- geração ---------- */

const saida = [];
const nota = (t) => saida.push(t);

nota(`/* ARQUIVO GERADO por scripts/gerar-tema-escuro.mjs — não edite à mão.
   Para mudar o resultado: ajuste as regras do script e rode "npm run tema".
   Ajustes manuais ficam em tema-ajustes.css. */\n`);

// 1) arquivos .css
const cssArquivos = listar(raiz, [".css"]).filter((p) => !p.includes("tema-ajustes") && !p.includes("acessibilidade"));
for (const arquivo of cssArquivos) {
  const regras = lerCss(readFileSync(arquivo, "utf8"));
  const blocos = [];
  for (const r of regras) {
    const colorido = temFundoColorido(r.declaracoes);
    const decls = r.declaracoes.map((d) => converterDeclaracao(d, colorido)).filter(Boolean);
    if (!decls.length) continue;
    const seletor = r.seletores.map(prefixar).join(",\n");
    let texto = `${seletor} {\n${decls.map((d) => `  ${d};`).join("\n")}\n}`;
    for (const ctx of [...r.contexto].reverse()) texto = `${ctx} {\n${texto.replace(/^/gm, "  ")}\n}`;
    blocos.push(texto);
  }
  if (blocos.length) nota(`/* ${relative(raiz, arquivo)} */\n${blocos.join("\n")}\n`);
}

// 2) cores escritas direto no .tsx (style={{ ... }})
const cores = new Set();
for (const arquivo of listar(raiz, [".tsx"])) {
  for (const m of readFileSync(arquivo, "utf8").matchAll(REGEX_COR)) cores.add(m[0].toLowerCase());
}

// O navegador reescreve "#1e3a8a" como "rgb(30, 58, 138)" no atributo style.
const comoNoNavegador = (cor) => {
  if (cor === "white") return "white";
  const [r, g, b] = lerCor(cor);
  return `rgb(${r}, ${g}, ${b})`;
};
// Repetir [style] aumenta a força do seletor para vencer regras de classe.
const FORCA = "[style][style][style]";
const linhasInline = [];
for (const cor of [...cores].sort()) {
  if (!lerCor(cor)) continue;
  const css = comoNoNavegador(cor);
  const hsl = rgbParaHsl(lerCor(cor));
  const vBg = trocarCores(cor, fundo);
  const vTx = trocarCores(cor, texto);
  const vBd = trocarCores(cor, borda);
  if (vBg) linhasInline.push(`${PREFIXO} [style*="background: ${css}"]${FORCA},\n${PREFIXO} [style*="background-color: ${css}"]${FORCA} { background-color: ${vBg} !important; }`);
  if (vTx) linhasInline.push(`${PREFIXO} [style^="color: ${css}"]${FORCA},\n${PREFIXO} [style*="; color: ${css}"]${FORCA} { color: ${vTx} !important; }`);
  if (vBd) linhasInline.push(`${PREFIXO} [style*="solid ${css}"]${FORCA},\n${PREFIXO} [style*="dashed ${css}"]${FORCA},\n${PREFIXO} [style*="border-color: ${css}"]${FORCA} { border-color: ${vBd} !important; }`);
  void hsl;
}
// variáveis de cor passadas pelo React (style={{ "--nt-cor": cor }})
const nomesVars = new Set();
for (const arquivo of listar(raiz, [".tsx"])) {
  for (const m of readFileSync(arquivo, "utf8").matchAll(/"(--[a-z0-9-]+)"\s*:/g)) nomesVars.add(m[1]);
}
for (const nome of nomesVars) {
  if (nome.startsWith("--tm-")) continue;
  for (const cor of [...cores].sort()) {
    const rgb = lerCor(cor);
    if (!rgb) continue;
    const novo = hslParaHex(destaque(rgbParaHsl(rgb)));
    if (novo === hslParaHex(rgbParaHsl(rgb))) continue;
    linhasInline.push(`${PREFIXO} [style*="${nome}: ${cor}"]${FORCA} { ${nome}: ${novo} !important; }`);
  }
}
linhasInline.push(`${PREFIXO} [style*="background: none"]${FORCA},\n${PREFIXO} [style*="background: transparent"]${FORCA} { background: none !important; }`);
nota(`/* cores escritas direto nas páginas (style={{ ... }}) */\n${linhasInline.join("\n")}\n`);

writeFileSync(SAIDA, saida.join("\n"));
console.log(`tema-escuro.css gerado: ${saida.join("\n").split("\n").length} linhas, ${cssArquivos.length} arquivos .css, ${cores.size} cores nas páginas`);
