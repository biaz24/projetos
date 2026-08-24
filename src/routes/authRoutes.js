import { Router } from "express";
import authController from "../controllers/authController.js";
import autenticarToken from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/auth/login", authController.login);
router.get("/auth/me", autenticarToken, authController.me);
router.post("/auth/refresh", authController.refresh);
router.post("/auth/logout", authController.logout);

export default router;
