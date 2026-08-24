import { Router } from "express";
import comentarioController from "../controllers/comentarioController.js";

const router = Router();

router.post("/comentarios", comentarioController.criarComentario);

//esse daqui é para olhar os comentarios por ideias
router.get(
  "/ideias/:id/comentarios",
  comentarioController.listarComentariosPorIdeia,
);

router.put("/comentarios/:id", comentarioController.atualizarComentario);

router.delete("/comentarios/:id", comentarioController.deletarComentario);

export default router;
