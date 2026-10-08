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

  const caminhoArquivo = path.resolve(pastaBackend, caminho);

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

async function excluirArquivos(anexos) {
  for (const anexo of anexos) {
    await excluirArquivo(anexo.CAMINHO);
  }
}

export default {
  excluirArquivo,
  excluirArquivos,
};

//Porque o próprio arquivo sabe onde está
