import React, { useState, useEffect } from "react";
import { AppLayout } from "../components/AppLayout";
import { IdeaCard } from "../components/IdeaCard";
import { EmptyState } from "../components/EmptyState";
import { fetchApi } from "../services/api";
import { Ideia } from "../types";

export const SalvosPage: React.FC = () => {
  const [salvos, setSalvos] = useState<Ideia[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarSalvos = async () => {
    try {
      setLoading(true);
      const data = await fetchApi<Ideia[]>("/usuarios/me/favoritos");
      setSalvos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar ideias salvas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarSalvos();
  }, []);

  return (
    <AppLayout>
      <section className="content">
        <div style={{ marginBottom: "20px" }}>
          <h1>Ideias Salvas</h1>
          <p className="description">
            Sua lista de ideias favoritadas para consultar e desenvolver no futuro.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "1.8rem", color: "#07327c" }}></i>
          </div>
        ) : salvos.length === 0 ? (
          <EmptyState
            icon="fa-regular fa-bookmark"
            title="Nenhuma ideia salva"
            description="Clique no ícone de bookmark nas ideias do feed para guardá-las nesta página!"
          />
        ) : (
          salvos.map((ideia) => (
            <IdeaCard key={ideia.ID} ideia={{ ...ideia, isSaved: true }} />
          ))
        )}
      </section>
    </AppLayout>
  );
};
