import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { pastaUploads } from "../config/paths.js";
import { detectarTipoPeloConteudo } from "../utils/tipoDeArquivo.js";

if (!fs.existsSync(pastaUploads)) {
  fs.mkdirSync(pastaUploads, { recursive: true });
}

// Tipo permitido -> extensão que o arquivo terá no servidor.
// A extensão NÃO vem do nome enviado pelo usuário (alguém poderia mandar "virus.html").
const TIPOS_PERMITIDOS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaUploads);
  },

  filename: (req, file, cb) => {
    // Nome aleatório: não dá para adivinhar o endereço de um arquivo.
    cb(null, `${crypto.randomUUID()}${TIPOS_PERMITIDOS[file.mimetype]}`);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    if (Object.hasOwn(TIPOS_PERMITIDOS, file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não permitido. Envie JPG, PNG ou PDF."));
    }
  },
});

async function lerInicioDoArquivo(caminho, tamanho = 16) {
  const arquivo = await fs.promises.open(caminho, "r");

  try {
    const buffer = Buffer.alloc(tamanho);
    const { bytesRead } = await arquivo.read(buffer, 0, tamanho, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await arquivo.close();
  }
}

async function apagarSilenciosamente(caminho) {
  try {
    await fs.promises.unlink(caminho);
  } catch {
    // se não conseguir apagar, não há mais nada a fazer aqui
  }
}

function limparNomeOriginal(nome) {
  return path
    .basename(String(nome ?? "arquivo"))
    .replace(/[\u0000-\u001f<>:"/\\|?*]/g, "_")
    .slice(0, 200);
}

// Use no lugar de upload.single(...) nas rotas.
// Recebe o arquivo e confere se o conteúdo é mesmo JPG, PNG ou PDF.
export function receberArquivoUnico(campo) {
  const receber = upload.single(campo);

  return (req, res, next) => {
    receber(req, res, async (erro) => {
      if (erro) {
        if (erro instanceof multer.MulterError) {
          const mensagem =
            erro.code === "LIMIT_FILE_SIZE"
              ? "Arquivo muito grande. O limite é 10 MB."
              : "Não foi possível receber o arquivo.";
          return res.status(400).json({ erro: mensagem });
        }

        // Erro do nosso fileFilter ("Tipo de arquivo não permitido...")
        return res.status(400).json({ erro: erro.message });
      }

      // Sem arquivo: o controller responde "Nenhum arquivo foi enviado".
      if (!req.file) {
        return next();
      }

      try {
        const inicio = await lerInicioDoArquivo(req.file.path);
        const tipoReal = detectarTipoPeloConteudo(inicio);

        if (!tipoReal || tipoReal !== req.file.mimetype) {
          await apagarSilenciosamente(req.file.path);
          return res.status(400).json({
            erro: "O conteúdo do arquivo não é um JPG, PNG ou PDF válido.",
          });
        }

        req.file.originalname = limparNomeOriginal(req.file.originalname);
        return next();
      } catch (erroInterno) {
        await apagarSilenciosamente(req.file.path);
        return next(erroInterno);
      }
    });
  };
}

export default upload;
