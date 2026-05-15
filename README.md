# 🔩 RepuestosPRO
## Sistema de gestión inteligente de pedidos y repuestos para talleres técnicos

---

## 🚀 Instalación en 4 pasos

```bash
# 1. Crear proyecto con Vite
npx create-vite@latest repuestos-pro --template react
cd repuestos-pro

# 2. Instalar dependencias (sin librerías externas de UI)
npm install

# 3. Copiar los archivos entregados a su lugar
#    Ver tabla de estructura abajo

# 4. Levantar el servidor de desarrollo
npm run dev
# → Abre http://localhost:5173 automáticamente
```

---

## 📁 Estructura completa de archivos

```
repuestos-pro/
│
├── index.html                          ← HTML base con PWA + loader
├── vite.config.js                      ← Configuración Vite
├── package.json                        ← Dependencias
│
└── src/
    ├── main.jsx                        ← Entry point React
    ├── App.jsx                         ← App_Final.jsx (renombrar)
    │
    └── modules/
        ├── AuthSystem.jsx              ← Login + Recuperar contraseña
        ├── RepuestosPRO.jsx            ← Dashboard + Cotizaciones + Crear Pedido
        ├── ModuloPedidos.jsx           ← Tabla avanzada de pedidos
        ├── ModuloRepuestos.jsx         ← Catálogo con historial de precios
        ├── ModuloProveedores.jsx       ← Gestión + comparador proveedores
        ├── PanelAdmin.jsx              ← Usuarios + Auditoría + Reportes + Config
        ├── SistemaNotificaciones.jsx   ← Notificaciones RT + Comentarios + Feed
        └── SistemaExportacion.jsx      ← Exportar PDF, CSV/Excel y JSON
```

---

## 🔌 Cómo integrar los módulos en App.jsx

Descomenta las líneas de importación en `App_Final.jsx`:

```jsx
import AuthSystem          from "./modules/AuthSystem";
import RepuestosPRO        from "./modules/RepuestosPRO";
import ModuloPedidos       from "./modules/ModuloPedidos";
import ModuloRepuestos     from "./modules/ModuloRepuestos";
import ModuloProveedores   from "./modules/ModuloProveedores";
import PanelAdmin          from "./modules/PanelAdmin";
import SistemaNotificaciones from "./modules/SistemaNotificaciones";
import SistemaExportacion  from "./modules/SistemaExportacion";
```

---

## 🧩 Módulos implementados

| Módulo                    | Archivo                      | Estado |
|--------------------------|------------------------------|--------|
| Login + Recuperar clave  | `AuthSystem.jsx`             | ✅ Listo |
| Dashboard principal      | `RepuestosPRO.jsx`           | ✅ Listo |
| Crear pedido (técnico)   | `RepuestosPRO.jsx`           | ✅ Listo |
| Cotizaciones             | `RepuestosPRO.jsx`           | ✅ Listo |
| Módulo de pedidos        | `ModuloPedidos.jsx`          | ✅ Listo |
| Catálogo de repuestos    | `ModuloRepuestos.jsx`        | ✅ Listo |
| Gestión de proveedores   | `ModuloProveedores.jsx`      | ✅ Listo |
| Panel administrador      | `PanelAdmin.jsx`             | ✅ Listo |
| Notificaciones RT        | `SistemaNotificaciones.jsx`  | ✅ Listo |
| Comentarios internos     | `SistemaNotificaciones.jsx`  | ✅ Listo |
| Feed de actividad        | `SistemaNotificaciones.jsx`  | ✅ Listo |
| Exportar PDF             | `SistemaExportacion.jsx`     | ✅ Listo |
| Exportar CSV/Excel       | `SistemaExportacion.jsx`     | ✅ Listo |
| Exportar JSON (backup)   | `SistemaExportacion.jsx`     | ✅ Listo |
| Devoluciones             | `App_Final.jsx`              | ✅ Listo |

---

## 🔐 Roles, permisos y usuarios de prueba

### Usuarios demo
| Email                    | Contraseña  | Rol           |
|--------------------------|-------------|---------------|
| admin@taller.com         | Admin123    | Administrador |
| suministro@taller.com    | Sumi123     | Suministro    |
| tecnico@taller.com       | Tecnico123  | Técnico       |

### Permisos por rol
| Permiso                    | Técnico | Suministro | Admin |
|---------------------------|---------|------------|-------|
| Crear solicitudes          | ✅      | ✅         | ✅    |
| Editar precios             | ⛔      | ✅         | ✅    |
| Aprobar cotizaciones       | ⛔      | ✅         | ✅    |
| Ver reportes financieros   | ⛔      | ✅         | ✅    |
| Registrar devoluciones     | ⛔      | ✅         | ✅    |
| Gestionar usuarios         | ⛔      | ⛔         | ✅    |
| Exportar PDF/Excel         | ⛔      | ✅         | ✅    |
| Auditoría del sistema      | ⛔      | ⛔         | ✅    |
| Configuración              | ⛔      | ⛔         | ✅    |

---

## 🎨 Sistema de diseño

### Tipografía
- **Principal:** DM Sans (300, 400, 500, 600, 700)
- **Monoespaciada:** DM Mono (400, 500) — precios, IDs, código

### Paleta de colores
```
Background:   #F7F6F3  (beige cálido)
Surface:      #FFFFFF
Surface 2:    #F0EEE9
Border:       #E2DFD8
Text:         #1A1916  (casi negro cálido)
Text 2:       #6B6860
Text 3:       #9C9A92
Accent:       #1A1916

Azul:         #2563EB  (pedidos, info)
Verde:        #15803D  (entregado, éxito)
Ámbar:        #D97706  (pendiente, alerta)
Rojo:         #DC2626  (urgente, devuelto, error)
Púrpura:      #7C3AED  (admin, especial)
```

### Principios de diseño
- **Minimalista** — sin elementos innecesarios
- **Espaciado generoso** — padding 16–24px, gap 10–14px
- **Bordes sutiles** — 1px, radio 8–14px
- **Sombras suaves** — solo donde agrega jerarquía
- **Tipografía clara** — tamaños 11–20px, pesos 400–700
- **Sin librerías UI externas** — todo CSS-in-JS nativo

---

## 📱 Responsive y PWA

El sistema es totalmente responsive:
- **📱 Móvil** (<768px): sidebar oculto, layout apilado, toques optimizados
- **📱 Tablet** (768–1024px): grid 2 columnas, sidebar colapsable
- **🖥 Desktop** (>1024px): layout completo con sidebar fijo

Para activar PWA completo:
```bash
npm install -D vite-plugin-pwa
```

Agrega en `vite.config.js`:
```js
import { VitePWA } from "vite-plugin-pwa";

plugins: [
  react(),
  VitePWA({
    registerType: "autoUpdate",
    manifest: {
      name:        "RepuestosPRO",
      short_name:  "RepuestosPRO",
      theme_color: "#1A1916",
      background_color: "#F7F6F3",
      display:     "standalone",
      start_url:   "/",
      icons: [{ src:"/icon.png", sizes:"192x192", type:"image/png" }],
    },
  }),
]
```

---

## 🏗 Arquitectura de datos (próxima fase: backend)

### Modelo de base de datos (PostgreSQL + Prisma)

```prisma
model Usuario {
  id        String   @id @default(cuid())
  nombre    String
  email     String   @unique
  password  String   // bcrypt hash
  rol       Rol      // ADMIN | SUMINISTRO | TECNICO
  activo    Boolean  @default(true)
  createdAt DateTime @default(now())
  pedidos   Pedido[]
}

model Pedido {
  id          String   @id @default(cuid())
  repuesto    String   // nombre normalizado
  marca       String
  modelo      String
  tipo        TipoCalidad // ORIGINAL | OEM | GENERICO | RECUPERADO
  cantidad    Int
  unitario    Float?
  prioridad   Prioridad   // NORMAL | ALTA | URGENTE
  estado      Estado      // PENDIENTE | PEDIDO | ENTREGADO | DEVUELTO | NO_CONSIGUE
  tecnicoId   String
  tecnico     Usuario  @relation(fields:[tecnicoId], references:[id])
  proveedor   String?
  observaciones String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  devueltos   Int      @default(0)
  comentarios Comentario[]
  historial   HistorialPrecio[]
}

model Proveedor {
  id          String   @id @default(cuid())
  nombre      String
  tipo        String
  ciudad      String
  contacto    String
  telefono    String
  email       String
  rating      Float    @default(0)
  estado      String   @default("activo")
  createdAt   DateTime @default(now())
}

model Repuesto {
  id           String   @id @default(cuid())
  nombre       String   @unique  // nombre normalizado
  aliases      String[] // variantes del nombre
  marca        String
  categoria    String
  calidad      TipoCalidad
  precioActual Float
  tags         String[]
  proveedorId  String?
  createdAt    DateTime @default(now())
  historial    HistorialPrecio[]
}

model HistorialPrecio {
  id         String   @id @default(cuid())
  repuestoId String?
  pedidoId   String?
  precio     Float
  proveedor  String
  fecha      DateTime @default(now())
}

model Comentario {
  id        String   @id @default(cuid())
  pedidoId  String
  pedido    Pedido   @relation(fields:[pedidoId], references:[id])
  userId    String
  texto     String
  tipo      String   @default("normal")
  createdAt DateTime @default(now())
}

model AuditoriaLog {
  id       String   @id @default(cuid())
  userId   String
  accion   String
  modulo   String
  detalle  String
  ip       String?
  createdAt DateTime @default(now())
}

enum Rol         { ADMIN SUMINISTRO TECNICO }
enum TipoCalidad { ORIGINAL OEM GENERICO RECUPERADO }
enum Prioridad   { NORMAL ALTA URGENTE }
enum Estado      { PENDIENTE PEDIDO ENTREGADO DEVUELTO NO_CONSIGUE }
```

---

## 🔮 Roadmap — Próximas fases

### Fase 2 — Backend REST API (2–3 semanas)
- [ ] Node.js + Express / NestJS
- [ ] PostgreSQL + Prisma ORM
- [ ] JWT + Refresh Tokens + 2FA
- [ ] Endpoints CRUD para todos los módulos
- [ ] Upload de imágenes (Cloudinary / S3)
- [ ] WebSockets (Socket.io) para notificaciones RT reales

### Fase 3 — Funcionalidades avanzadas (2 semanas)
- [ ] Escaneo QR/código de barras para repuestos
- [ ] Integración con proveedores vía API (precios automáticos)
- [ ] Generación de PDF server-side (Puppeteer / React-PDF)
- [ ] Notificaciones push PWA nativas
- [ ] Import masivo desde Excel

### Fase 4 — Inteligencia (mes 2)
- [ ] Predicción de demanda de repuestos por historial
- [ ] Alerta automática cuando precio sube más del X%
- [ ] Sugerencia del mejor proveedor basado en historial
- [ ] Dashboard predictivo con proyecciones

### Fase 5 — Escala (mes 3+)
- [ ] Multi-tenant (N talleres en una sola instancia)
- [ ] App React Native (Expo) para móvil nativo
- [ ] Panel de franquicias / cadenas de talleres
- [ ] API pública para integraciones externas

---

## 📊 Resumen del sistema entregado

| Categoría           | Detalle                                           |
|--------------------|---------------------------------------------------|
| Archivos React      | 8 módulos JSX + App + main                        |
| Líneas de código    | ~4.800 líneas                                     |
| Dependencias UI     | 0 (cero librerías externas de componentes)        |
| Stack               | React 18 + Vite 5 + CSS-in-JS nativo             |
| Tipografía          | DM Sans + DM Mono (Google Fonts)                  |
| Responsive          | ✅ Móvil + Tablet + Desktop                        |
| Roles               | Admin · Suministro · Técnico                      |
| Auth                | Login + Recuperar contraseña + Bienvenida por rol |
| Exportación         | PDF (print) + CSV/Excel + JSON                    |
| Notificaciones      | Toasts + Panel lateral + RT simulado              |
| Comentarios         | Por pedido, con tipos y estilo chat               |
| Anti-duplicados     | Fuzzy search + normalización de nombres           |
| Historial precios   | 6 meses por repuesto con gráfico                  |
| Auditoría           | Log completo con filtros y tipos                  |

---

*RepuestosPRO © 2026 — Construido para eliminar errores humanos y pérdidas económicas en la gestión de talleres técnicos.*
