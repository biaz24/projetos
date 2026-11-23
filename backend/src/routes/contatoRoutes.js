import { Router } from "express";

import contatoController from "../controllers/contatoController.js";
import autenticarToken from "../middlewares/authMiddleware.js";
import verificarAdmin from "../middlewares/adminMiddleware.js";

const router = Router();

// ---- usuário logado: pedido de contato e chat privado ----
router.post("/contatos", autenticarToken, contatoController.criarContato);

router.get("/ideias/:ideiaId/meu-contato", autenticarToken, contatoController.meuContatoDaIdeia);

router.get("/contatos", autenticarToken, contatoController.listarContatos);

// Precisa vir ANTES de "/contatos/:id", senão "nao-lidas" seria lido como um id.
router.get("/contatos/nao-lidas", autenticarToken, contatoController.contarNaoLidas);

router.get("/contatos/:id", autenticarToken, contatoController.buscarContato);
router.patch("/contatos/:id/aceitar", autenticarToken, contatoController.aceitar);
router.patch("/contatos/:id/recusar", autenticarToken, contatoController.recusar);
router.patch("/contatos/:id/encerrar", autenticarToken, contatoController.encerrar);
router.post("/contatos/:id/mensagens", autenticarToken, contatoController.enviarMensagem);
router.post("/contatos/:id/denunciar", autenticarToken, contatoController.denunciar);

// ---- administrador: só lê uma conversa se ela tiver sido denunciada ----
router.get(
  "/admin/conversas-denunciadas",
  autenticarToken,
  verificarAdmin,
  contatoController.listarDenunciasDeConversas,
);

router.get(
  "/admin/conversas-denunciadas/:id",
  autenticarToken,
  verificarAdmin,
  contatoController.abrirDenunciaDeConversa,
);

router.patch(
  "/admin/conversas-denunciadas/:id/resolver",
  autenticarToken,
  verificarAdmin,
  contatoController.resolverDenunciaDeConversa,
);

export default router;
