import express from "express";
import anexoController from "../controllers/anexoController.js";
import autenticarToken from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/ideias/:ideiaId/anexos",
  autenticarToken,
  (req, res, next) => {
    upload.single("arquivo")(req, res, (erro) => {
      if (erro) {
        return res.status(400).json({
          erro: erro.message,
        });
      }

      next();
    });
  },
  anexoController.enviarAnexo,
);

router.get(
  "/ideias/:ideiaId/anexos",
  autenticarToken,
  anexoController.listarAnexosPorIdeia,
);

router.get("/anexos/:id", autenticarToken, anexoController.buscarAnexoPorId);

export default router;
