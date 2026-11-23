// Decide o que a API pode mostrar sobre o autor de uma ideia.
//
// Regra: se a ideia é anônima, NINGUÉM além do próprio autor recebe o id, o nome
// ou o e-mail do autor. Esconder só na tela (frontend) não protege, porque
// qualquer pessoa consegue ver a resposta da API pelo navegador.

export function ideiaEhAnonima(ideia) {
  return Boolean(Number(ideia?.ANONIMO));
}

// Ideias ocultadas pela moderação (ou em revisão) não são "públicas".
export function ideiaEstaPublica(ideia) {
  return !ideia?.VISIBILIDADE || ideia.VISIBILIDADE === "Publica";
}

// Quem pode abrir a ideia: todo mundo se ela é pública;
// se está oculta/em revisão, só o próprio autor e os administradores.
export function podeVerIdeia(ideia, usuario) {
  if (!ideia) return false;
  if (ideiaEstaPublica(ideia)) return true;
  if (usuario?.tipo === "admin") return true;

  return Number(ideia.USUARIOS_ID) === Number(usuario?.id);
}

// usuarioLogadoId: id de quem está pedindo.
// incluirEmail: só a tela de detalhes precisa do e-mail (botão "Tenho interesse").
export function protegerAutor(ideia, usuarioLogadoId, { incluirEmail = false } = {}) {
  if (!ideia) return ideia;

  const ehOAutor = Number(ideia.USUARIOS_ID) === Number(usuarioLogadoId);
  const copia = { ...ideia };

  // Situação de moderação (oculta / em revisão) e motivo: só o próprio autor precisa ver.
  if (!ehOAutor) {
    delete copia.VISIBILIDADE;
    delete copia.MOTIVO_MODERACAO;
  }

  if (ideiaEhAnonima(copia) && !ehOAutor) {
    copia.USUARIOS_ID = null;
    copia.NOME_AUTOR = null;
    copia.EMAIL_AUTOR = null;
    return copia;
  }

  if (!incluirEmail && !ehOAutor) {
    delete copia.EMAIL_AUTOR;
  }

  return copia;
}

export function protegerListaDeIdeias(ideias, usuarioLogadoId) {
  return ideias.map((ideia) => protegerAutor(ideia, usuarioLogadoId));
}

// Comentários: se o autor de uma ideia anônima comentar na própria ideia,
// o nome dele não pode aparecer, senão o anonimato acaba ali.
export function protegerComentarios(comentarios, usuarioLogadoId) {
  return comentarios.map((c) => {
    const { IDEIA_ANONIMA, IDEIA_USUARIO_ID, ...resto } = c;

    const ehAutorDaIdeia = Number(resto.USUARIOS_ID) === Number(IDEIA_USUARIO_ID);
    const euMesmo = Number(resto.USUARIOS_ID) === Number(usuarioLogadoId);

    if (Number(IDEIA_ANONIMA) && ehAutorDaIdeia && !euMesmo) {
      return { ...resto, USUARIOS_ID: null, NOME_AUTOR: "Autor da ideia (anônimo)" };
    }

    return resto;
  });
}
