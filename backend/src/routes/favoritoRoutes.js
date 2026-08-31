import { Router } from "express";
import favoritoController from "../controllers/favoritoController.js";
import autenticarToken from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/favoritos", autenticarToken, favoritoController.toggleFavorito);
router.get("/usuarios/me/favoritos", autenticarToken, favoritoController.listarMeusFavoritos);

export default router;
