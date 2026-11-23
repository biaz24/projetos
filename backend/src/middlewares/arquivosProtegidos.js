import { pastaUploads } from "../config/paths.js";
import anexoService from "../services/anexoService.js";
import ideiaService from "../services/ideiaService.js";
import { podeVerIdeia } from "../utils/ideiaPublica.js";

// Só nomes no formato que o servidor mesmo gera (uuid + extensão). Barra "../", pastas e nomes estranhos.
const NOME_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|pdf)$/;

// Entrega um arquivo enviado SÓ se a pessoa pode ver a ideia a que ele pertence.
// (Antes, qualquer usuário logado que soubesse o nome abria o anexo de uma ideia oculta.)
export async function entregarArquivo(req, res, next) {
  try {
    const nome = req.params.arquivo;

    if (typeof nome !== "string" || !NOME_VALIDO.test(nome)) {
      return res.status(404).json({ erro: "Arquivo não encontrado" });
    }

    const anexo = await anexoService.buscarPorNomeSalvo(nome);
    const ideia = anexo ? await ideiaService.buscarIdeiaPorId(anexo.IDEIAS_ID) : null;

    if (!anexo || !podeVerIdeia(ideia, req.user)) {
      return res.status(404).json({ erro: "Arquivo não encontrado" });
    }

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, max-age=3600");

    return res.sendFile(nome, { root: pastaUploads, dotfiles: "deny" }, (erro) => {
      if (erro && !res.headersSent) next(erro);
    });
  } catch (erro) {
    return next(erro);
  }
}
