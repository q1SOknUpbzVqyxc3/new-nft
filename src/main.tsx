import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/auth-context";
import { App } from "./app";
import "./app/fonts";
import "./app/globals.css";
import "./app/themes.css";
import { applyDesign, readDesign } from "./lib/design";

applyDesign(readDesign());

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element is missing");
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
