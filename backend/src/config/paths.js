import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pasta "backend" (duas pastas acima de src/config).
// Usar um caminho fixo evita que a pasta uploads mude de lugar
// dependendo de onde o servidor foi iniciado.
export const pastaBackend = path.resolve(__dirname, "../..");
export const pastaUploads = path.resolve(pastaBackend, "uploads");
