import { Router } from "express";
import comentarioController from "../controllers/comentarioController.js";
import autenticarToken from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/comentarios", autenticarToken, comentarioController.criarComentario);
router.get("/ideias/:id/comentarios", comentarioController.listarComentariosPorIdeia);
router.put("/comentarios/:id", autenticarToken, comentarioController.atualizarComentario);
router.delete("/comentarios/:id", autenticarToken, comentarioController.deletarComentario);

export default router;
