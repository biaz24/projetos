import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchApi } from "../services/api";

export const RedefinirSenhaPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setMensagem("");

    if (!token) {
      setErro("Link de recuperação inválido.");
      return;
    }

    if (novaSenha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const resposta = await fetchApi<{ mensagem: string }>(
        "/redefinir-senha",
        {
          method: "POST",
          body: JSON.stringify({ token, novaSenha }),
        },
      );

      setMensagem(resposta.mensagem);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível redefinir a senha.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Redefinir senha</h1>

      {mensagem ? (
        <>
          <p>{mensagem}</p>
          <Link to="/">Voltar para o login</Link>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="novaSenha">Nova senha</label>
          <input
            id="novaSenha"
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            minLength={8}
            maxLength={128}
            required
          />

          <label htmlFor="confirmarSenha">Confirmar nova senha</label>
          <input
            id="confirmarSenha"
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            minLength={8}
            maxLength={128}
            required
          />

          {erro && <p role="alert">{erro}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>
      )}
    </main>
  );
};
