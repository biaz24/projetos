import multer from "multer";
import path from "path";
import fs from "fs";

const pastaUploads = path.resolve("uploads");

if (!fs.existsSync(pastaUploads)) {
  fs.mkdirSync(pastaUploads, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaUploads);
  },

  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname);

    const nomeUnico = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${extensao}`;

    cb(null, nomeUnico);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ["image/jpeg", "image/png", "application/pdf"];

    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não permitido. Envie JPG, PNG ou PDF."));
    }
  },
});

export default upload;
