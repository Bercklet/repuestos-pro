// ─── vite.config.js ──────────────────────────────────────────────────────────
// Copia este archivo en la raíz del proyecto (junto a package.json)

import { defineConfig } from "vite";
import react             from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    open: true,          // abre el navegador automáticamente
    host: true,          // permite acceso desde la red local (tablet/celular)
  },

  build: {
    outDir:        "dist",
    sourcemap:     false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react","react-dom"],
        },
      },
    },
  },

  preview: {
    port: 4173,
    open: true,
  },
});

/*
 * ─── INSTALACIÓN COMPLETA ──────────────────────────────────────────────────
 *
 * 1. Crear proyecto:
 *    npx create-vite@latest repuestos-pro --template react
 *    cd repuestos-pro
 *
 * 2. Instalar dependencias:
 *    npm install
 *
 * 3. Estructura de archivos (copiar los entregados):
 *
 *    repuestos-pro/
 *    ├── index.html                  ← ver abajo
 *    ├── vite.config.js              ← este archivo
 *    ├── package.json                ← el entregado
 *    └── src/
 *        ├── main.jsx                ← el entregado
 *        ├── App.jsx                 ← App_Final.jsx (renombrar)
 *        └── modules/
 *            ├── AuthSystem.jsx
 *            ├── RepuestosPRO.jsx
 *            ├── ModuloPedidos.jsx
 *            ├── ModuloRepuestos.jsx
 *            ├── ModuloProveedores.jsx
 *            ├── PanelAdmin.jsx
 *            ├── SistemaNotificaciones.jsx
 *            └── SistemaExportacion.jsx
 *
 * 4. Correr en desarrollo:
 *    npm run dev
 *    → http://localhost:5173
 *
 * 5. Build para producción:
 *    npm run build
 *    npm run preview
 *
 * ─── INDEX.HTML ────────────────────────────────────────────────────────────
 * Reemplaza el index.html que genera Vite con el contenido de abajo.
 */
