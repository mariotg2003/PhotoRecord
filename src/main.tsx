import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AuthGate from "./components/AuthGate";
import "./App.css";

const root = document.getElementById("root");
if (!root) throw new Error("No se encontró el elemento raíz de PhotoRecord.");
createRoot(root).render(<StrictMode><AuthGate /></StrictMode>);
