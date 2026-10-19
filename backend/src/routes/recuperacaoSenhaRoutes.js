import { Router } from "express";
import recuperacaoSenhaController from "../controllers/recuperacaoSenhaController.js";

const router = Router();

router.post("/esqueci-senha", recuperacaoSenhaController.solicitarRecuperacao);

router.post("/redefinir-senha", recuperacaoSenhaController.redefinirSenha);

export default router;
