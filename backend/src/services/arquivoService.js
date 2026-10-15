import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pastaBackend = path.resolve(__dirname, "../..");

async function excluirArquivo(caminho) {
  if (!caminho) {
    return;
  }

  const pastaUploads = path.resolve(pastaBackend, "uploads");
  const caminhoArquivo = path.resolve(pastaBackend, caminho);

  // Garante que o arquivo esteja dentro da pasta uploads.
  if (!caminhoArquivo.startsWith(pastaUploads + path.sep)) {
    throw new Error("Caminho de arquivo inválido para exclusão.");
  }

  try {
    await fs.unlink(caminhoArquivo);
    console.log(`Arquivo excluído: ${caminhoArquivo}`);
  } catch (erro) {
    if (erro.code === "ENOENT") {
      console.warn(`Arquivo não encontrado: ${caminhoArquivo}`);
      return;
    }

    throw erro;
  }
}

async function excluirArquivos(arquivos = []) {
  if (!Array.isArray(arquivos) || arquivos.length === 0) {
    return;
  }

  for (const anexo of arquivos) {
    const caminho =
      typeof anexo === "string" ? anexo : anexo?.CAMINHO || anexo?.caminho;
    if (caminho) {
      await excluirArquivo(caminho);
    }
  }
}

export default {
  excluirArquivo,
  excluirArquivos,
};

//Porque o próprio arquivo sabe onde está
