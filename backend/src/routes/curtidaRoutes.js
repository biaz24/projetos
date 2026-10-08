import express from "express";
import curtidaController from "../controllers/curtidaController.js";
import autenticarToken from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/curtidas", autenticarToken, curtidaController.curtirIdeia);

router.delete(
  "/curtidas/:ideiaId",
  autenticarToken,
  curtidaController.descurtirIdeia,
);

router.get(
  "/curtidas/:ideiaId/verificar",
  autenticarToken,
  curtidaController.verificarCurtida,
);

router.get(
  "/curtidas/:ideiaId/usuarios",
  autenticarToken,
  curtidaController.listarQuemCurtiu,
);

router.get(
  "/curtidas/:ideiaId",
  autenticarToken,
  curtidaController.contarCurtidas,
);

export default router;
