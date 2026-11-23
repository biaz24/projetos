import contatoModel from "../models/contatoModel.js";

// Camada fina entre o controller e o model (mesmo padrão dos outros serviços).
// Cada função chama o model no momento da chamada.

const repassar = (nome) => (...args) => contatoModel[nome](...args);

export default {
  buscarPorId: repassar("buscarPorId"),
  buscarPorIdeiaEInteressado: repassar("buscarPorIdeiaEInteressado"),
  contarPedidosPendentesDoInteressado: repassar("contarPedidosPendentesDoInteressado"),
  criarComMensagem: repassar("criarComMensagem"),
  listarDoUsuario: repassar("listarDoUsuario"),
  contarNaoLidas: repassar("contarNaoLidas"),
  listarMensagens: repassar("listarMensagens"),
  marcarComoLido: repassar("marcarComoLido"),
  mudarStatus: repassar("mudarStatus"),
  inserirMensagem: repassar("inserirMensagem"),
  buscarDenunciaAbertaDoUsuario: repassar("buscarDenunciaAbertaDoUsuario"),
  criarDenuncia: repassar("criarDenuncia"),
  listarDenuncias: repassar("listarDenuncias"),
  buscarDenuncia: repassar("buscarDenuncia"),
  resolverDenuncia: repassar("resolverDenuncia"),
};
