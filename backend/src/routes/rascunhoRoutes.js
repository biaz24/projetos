import { Router } from "express";
import rascunhoController from "../controllers/rascunhoController.js";
import autenticarToken from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/rascunhos", autenticarToken, rascunhoController.criarRascunho);
router.get("/rascunhos", autenticarToken, rascunhoController.listarMeusRascunhos);
router.put("/rascunhos/:id", autenticarToken, rascunhoController.atualizarRascunho);
router.delete("/rascunhos/:id", autenticarToken, rascunhoController.deletarRascunho);

export default router;
