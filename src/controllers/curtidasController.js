async function curtirIdeia(req, res) {
  try {
    const usuarioId = req.user.id;
    const { id } = req.params;

    await curtidasService.curtirIdeia(usuarioId, id);

    return res.status(201).json({
      mensagem: "Ideia curtida com sucesso",
    });
  } catch (erro) {
    console.error(erro);

    if (erro.message === "Você já curtiu esta ideia") {
      return res.status(400).json({
        erro: erro.message,
      });
    }

    return res.status(500).json({
      erro: "Erro ao curtir ideia",
    });
  }
}
//nao esta pronto
