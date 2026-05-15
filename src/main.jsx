// ─── src/main.jsx ─────────────────────────────────────────────────────────────
// Punto de entrada de la aplicación React.
// No requiere modificaciones — solo copia en src/main.jsx

import React    from "react";
import ReactDOM from "react-dom/client";
import App      from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/* ─── NOTAS DE CONFIGURACIÓN ───────────────────────────────────────────────
 *
 * 1. VITE (index.html ya incluido con create-vite):
 *    <div id="root"></div>
 *
 * 2. FUENTES GOOGLE — ya cargadas inline en cada módulo vía @import.
 *    Para producción, agrega esto en el <head> de index.html:
 *
 *    <link rel="preconnect" href="https://fonts.googleapis.com">
 *    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 *    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
 *
 * 3. PWA — agrega el plugin Vite PWA:
 *    npm install -D vite-plugin-pwa
 *    En vite.config.js:
 *    import { VitePWA } from "vite-plugin-pwa";
 *    plugins: [react(), VitePWA({ registerType: "autoUpdate" })]
 *
 * 4. BACKEND (próxima fase):
 *    - Node.js + Express o NestJS
 *    - PostgreSQL + Prisma ORM
 *    - JWT + Refresh tokens
 *    - WebSockets (Socket.io) para tiempo real
 */
