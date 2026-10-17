import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import "./components/workspace/workspace.css";
import "./components/workspace/design-system.css";
import "./components/workspace/swingometer.css";
import "./components/home/editorial-home.css";
import "./components/workspace/editorial-swingometer.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
