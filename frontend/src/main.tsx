import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";
import "./responsivo.css";
import "./acessibilidade.css";
import "./tema-escuro.css";
import "./tema-ajustes.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
