// Funções simples de validação. Sem bibliotecas externas.

export function ehTexto(valor) {
  return typeof valor === "string";
}

// Valida se é texto, tira espaços das pontas e confere o tamanho.
// Retorna o texto limpo ou null se for inválido.
export function textoComLimite(valor, { min = 1, max }) {
  if (!ehTexto(valor)) return null;
  const limpo = valor.trim();
  if (limpo.length < min || limpo.length > max) return null;
  return limpo;
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Retorna o e-mail normalizado (minúsculo, sem espaços) ou null se inválido.
export function normalizarEmail(valor) {
  if (!ehTexto(valor)) return null;
  const email = valor.trim().toLowerCase();
  if (email.length > 254 || !REGEX_EMAIL.test(email)) return null;
  return email;
}

export const MENSAGEM_SENHA =
  "A senha deve ter pelo menos 8 caracteres, uma letra maiúscula, um número e um caractere especial.";

// Mesma regra já usada na redefinição de senha.
// O limite de 72 bytes existe porque o bcrypt ignora o que passar disso.
export function senhaEhForte(senha) {
  return (
    ehTexto(senha) &&
    senha.length >= 8 &&
    Buffer.byteLength(senha, "utf8") <= 72 &&
    /[A-Z]/.test(senha) &&
    /[0-9]/.test(senha) &&
    /[^A-Za-z0-9]/.test(senha)
  );
}

// Converte o parâmetro da URL em número inteiro positivo, ou null.
export function idPositivo(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

// Garante que page e limit são números seguros (evita limit=1000000 e page negativa).
export function paginacaoSegura(page, limit, { limitMaximo = 50, limitPadrao = 10 } = {}) {
  let p = Number.parseInt(page, 10);
  let l = Number.parseInt(limit, 10);

  if (!Number.isInteger(p) || p < 1) p = 1;
  if (p > 100000) p = 100000;
  if (!Number.isInteger(l) || l < 1) l = limitPadrao;
  if (l > limitMaximo) l = limitMaximo;

  return { page: p, limit: l };
}

export const CATEGORIAS_VALIDAS = [
  "Tecnologia",
  "Games",
  "Sustentabilidade",
  "Educação",
  "Utilitários",
  "Geral",
];

export const STATUS_VALIDOS = ["Disponível", "Em desenvolvimento", "Concluída"];

// Escapa texto para colocar dentro de HTML (usado nos e-mails).
export function escaparHtml(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
