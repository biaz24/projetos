import { Router } from "express";
import ideiaController from "../controllers/ideiaController.js";

const router = Router();

router.post("/ideias", ideiaController.criarIdeia);

router.get("/ideias", ideiaController.listarIdeias);

router.get("/ideias/:id", ideiaController.buscarIdeiaPorId);

router.put("/ideias/:id", ideiaController.atualizarIdeia);

router.delete("/ideias/:id", ideiaController.deletarideia);

router.get(
  "/usuarios/:usuarioId/ideias",
  ideiaController.listarideiasPorUsuario,
);

export default router;
