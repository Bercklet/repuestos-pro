import { useState } from "react";

// ─── DATOS ────────────────────────────────────────────────────────────────────
const USUARIOS = [
  { id: 1, nombre: "Juan Martínez",  email: "juan@taller.com",    rol: "admin",      avatar: "JM", activo: true,  ultimo: "Ahora",       pedidos: 0,  color: "#7c3aed" },
  { id: 2, nombre: "Ana García",     email: "ana@taller.com",     rol: "suministro", avatar: "AG", activo: true,  ultimo: "Hace 20m",    pedidos: 0,  color: "#2563eb" },
  { id: 3, nombre: "Carlos Ruiz",    email: "carlos@taller.com",  rol: "tecnico",    avatar: "CR", activo: true,  ultimo: "Hace 1h",     pedidos: 18, color: "#15803d" },
  { id: 4, nombre: "Luis Pérez",     email: "luis@taller.com",    rol: "tecnico",    avatar: "LP", activo: true,  ultimo: "Hace 2h",     pedidos: 12, color: "#d97706" },
  { id: 5, nombre: "María Soto",     email: "maria@taller.com",   rol: "tecnico",    avatar: "MS", activo: false, ultimo: "Hace 3 días", pedidos: 9,  color: "#dc2626" },
  { id: 6, nombre: "Pedro Herrera",  email: "pedro@taller.com",   rol: "suministro", avatar: "PH", activo: true,  ultimo: "Hace 5h",     pedidos: 0,  color: "#0891b2" },
];

const AUDITORIA = [
  { id: 1, user: "Ana García",    rol: "Suministro", accion: "Precio actualizado",      detalle: "Pantalla Oppo A79: $120.000 → $115.000",       modulo: "Cotizaciones", tiempo: "Hace 20min", tipo: "editar" },
  { id: 2, user: "Carlos Ruiz",   rol: "Técnico",    accion: "Pedido creado",            detalle: "Batería Samsung S23 · Prioridad: Normal",        modulo: "Pedidos",      tiempo: "Hace 1h",   tipo: "crear" },
  { id: 3, user: "Ana García",    rol: "Suministro", accion: "Estado cambiado",          detalle: "#0479: Pedido → Entregado",                      modulo: "Pedidos",      tiempo: "Hace 1h",   tipo: "estado" },
  { id: 4, user: "Juan Martínez", rol: "Admin",      accion: "Usuario creado",           detalle: "Pedro Herrera · Rol: Suministro",                modulo: "Usuarios",     tiempo: "Hace 3h",   tipo: "usuario" },
  { id: 5, user: "Ana García",    rol: "Suministro", accion: "Devolución registrada",    detalle: "Pantalla Huawei Y9s · −$110.000 · Defecto fab.", modulo: "Devoluciones", tiempo: "Hace 3h",   tipo: "devolucion" },
  { id: 6, user: "Luis Pérez",    rol: "Técnico",    accion: "Pedido creado",            detalle: "Conector carga iPhone 14 · Prioridad: Urgente",  modulo: "Pedidos",      tiempo: "Hace 5h",   tipo: "crear" },
  { id: 7, user: "Juan Martínez", rol: "Admin",      accion: "Permiso modificado",       detalle: "Carlos Ruiz: sin acceso a precios confirmado",   modulo: "Usuarios",     tiempo: "Ayer",      tipo: "usuario" },
  { id: 8, user: "Ana García",    rol: "Suministro", accion: "Proveedor agregado",       detalle: "DistriMovil SAS · Tipo: Genérico",               modulo: "Proveedores",  tiempo: "Ayer",      tipo: "crear" },
  { id: 9, user: "María Soto",    rol: "Técnico",    accion: "Sesión iniciada",          detalle: "IP: 192.168.1.45 · Chrome / Android",            modulo: "Auth",         tiempo: "Hace 3 días",tipo: "sesion" },
  { id: 10,user: "Carlos Ruiz",   rol: "Técnico",    accion: "Intento acceso denegado",  detalle: "Intentó editar precio sin permiso",              modulo: "Seguridad",    tiempo: "Hace 4 días",tipo: "alerta" },
];

const REPORTE_MENSUAL = [
  { mes: "Dic", gastado: 3200000, devuelto: 180000 },
  { mes: "Ene", gastado: 4100000, devuelto: 250000 },
  { mes: "Feb", gastado: 2800000, devuelto: 120000 },
  { mes: "Mar", gastado: 5200000, devuelto: 340000 },
  { mes: "Abr", gastado: 4700000, devuelto: 200000 },
  { mes: "May", gastado: 4820000, devuelto: 310000 },
];

const fmtCOP = (n) => {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + Math.round(n / 1000) + "k";
  return "$" + n.toLocaleString("es-CO");
};

const ROLES_CFG = {
  admin:      { label: "Administrador", bg: "#ede9fe", color: "#7c3aed" },
  suministro: { label: "Suministro",    bg: "#dbeafe", color: "#2563eb" },
  tecnico:    { label: "Técnico",       bg: "#dcfce7", color: "#15803d" },
};

const PERMISOS = {
  tecnico:    { crear_pedido: true,  editar_precio: false, aprobar: false, ver_reportes: false, gestionar_usuarios: false, exportar: false },
  suministro: { crear_pedido: true,  editar_precio: true,  aprobar: true,  ver_reportes: true,  gestionar_usuarios: false, exportar: true  },
  admin:      { crear_pedido: true,  editar_precio: true,  aprobar: true,  ver_reportes: true,  gestionar_usuarios: true,  exportar: true  },
};

const PERMISOS_LABELS = {
  crear_pedido:       "Crear solicitudes de pedido",
  editar_precio:      "Editar precios y valores",
  aprobar:            "Aprobar cotizaciones",
  ver_reportes:       "Ver reportes financieros",
  gestionar_usuarios: "Gestionar usuarios y roles",
  exportar:           "Exportar PDF / Excel",
};

// ─── SUBCOMPONENTES ───────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{
        padding: "7px 16px", borderRadius: 8, border: "none", fontFamily: "inherit",
        fontSize: 13.5, fontWeight: 500, cursor: "pointer", transition: "all .15s",
        background: active ? "#1a1916" : "transparent",
        color: active ? "#fff" : "#6b6860",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f0eee9"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

function SectionCard({ title, sub, icon, iconBg, iconColor, children, action }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2dfd8", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "13px 18px 11px", borderBottom: "1px solid #e2dfd8", display: "flex", alignItems: "center", gap: 10 }}>
        {icon && <div style={{ width: 28, height: 28, borderRadius: 7, background: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px" }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: "#9c9a92", marginTop: 1 }}>{sub}</div>}
        </div>
        {action && <div style={{ fontSize: 13, color: "#2563eb", fontWeight: 600, cursor: "pointer" }}>{action}</div>}
      </div>
      <div style={{ padding: "16px 18px" }}>{children}</div>
    </div>
  );
}

// ─── TAB: USUARIOS ────────────────────────────────────────────────────────────
function TabUsuarios() {
  const [usuarios, setUsuarios] = useState(USUARIOS);
  const [editando, setEditando] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const toggleActivo = (id) => setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: !u.activo } : u));
  const cambiarRol = (id, rol) => setUsuarios(prev => prev.map(u => u.id === id ? { ...u, rol } : u));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setShowNew(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#1a1916", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          + Nuevo usuario
        </button>
      </div>

      {showNew && (
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: "#0369a1" }}>➕ Nuevo usuario</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[["Nombre completo","text","Ej: Juan Pérez"],["Correo electrónico","email","Ej: juan@taller.com"]].map(([l,t,p]) => (
              <div key={l}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6860", display: "block", marginBottom: 4 }}>{l}</label>
                <input type={t} placeholder={p} style={{ width: "100%", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6860", display: "block", marginBottom: 4 }}>Rol</label>
              <select style={{ width: "100%", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                <option>Técnico</option><option>Suministro</option><option>Administrador</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { alert("✅ Usuario creado. Se envió correo de bienvenida."); setShowNew(false); }}
              style={{ padding: "7px 14px", background: "#1a1916", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
              Crear usuario
            </button>
            <button onClick={() => setShowNew(false)}
              style={{ padding: "7px 14px", background: "transparent", color: "#6b6860", border: "1px solid #e2dfd8", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {usuarios.map(u => (
          <div key={u.id} style={{ background: "#fff", border: "1px solid #e2dfd8", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", opacity: u.activo ? 1 : 0.6 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${u.color}88, ${u.color})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {u.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{u.nombre}</span>
                {!u.activo && <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 99, background: "#fee2e2", color: "#dc2626", fontWeight: 600 }}>Inactivo</span>}
              </div>
              <div style={{ fontSize: 12, color: "#9c9a92", marginTop: 1 }}>{u.email}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: ROLES_CFG[u.rol].bg, color: ROLES_CFG[u.rol].color }}>
                {ROLES_CFG[u.rol].label}
              </span>
              {u.rol === "tecnico" && (
                <span style={{ fontSize: 12, color: "#9c9a92" }}>📋 {u.pedidos} pedidos</span>
              )}
              <span style={{ fontSize: 12, color: "#9c9a92" }}>🕐 {u.ultimo}</span>
              <select value={u.rol} onChange={e => cambiarRol(u.id, e.target.value)}
                style={{ background: "#f7f6f3", border: "1px solid #e2dfd8", borderRadius: 7, padding: "4px 24px 4px 8px", fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
                <option value="tecnico">Técnico</option>
                <option value="suministro">Suministro</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={() => toggleActivo(u.id)}
                style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid", fontSize: 12, fontFamily: "inherit", cursor: "pointer", fontWeight: 500, background: "transparent", borderColor: u.activo ? "#fecaca" : "#d3cfc6", color: u.activo ? "#dc2626" : "#15803d" }}>
                {u.activo ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de permisos por rol */}
      <div style={{ marginTop: 20 }}>
        <SectionCard title="Permisos por rol" sub="Configura qué puede hacer cada tipo de usuario" icon="🔐" iconBg="#ede9fe" iconColor="#7c3aed">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ fontSize: 12, fontWeight: 700, color: "#9c9a92", textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e2dfd8" }}>PERMISO</th>
                  {Object.keys(ROLES_CFG).map(rol => (
                    <th key={rol} style={{ fontSize: 12, fontWeight: 700, padding: "8px 12px", borderBottom: "1px solid #e2dfd8", textAlign: "center" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 99, background: ROLES_CFG[rol].bg, color: ROLES_CFG[rol].color, fontSize: 11.5 }}>
                        {ROLES_CFG[rol].label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(PERMISOS_LABELS).map(([key, label], i) => (
                  <tr key={key} style={{ background: i % 2 === 0 ? "#fafaf9" : "#fff" }}>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "#1a1916", borderBottom: "1px solid #f0eee9" }}>{label}</td>
                    {Object.keys(ROLES_CFG).map(rol => (
                      <td key={rol} style={{ padding: "10px 12px", textAlign: "center", borderBottom: "1px solid #f0eee9" }}>
                        <span style={{ fontSize: 16 }}>{PERMISOS[rol][key] ? "✅" : "⛔"}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ─── TAB: AUDITORÍA ───────────────────────────────────────────────────────────
const TIPO_CFG = {
  crear:      { icon: "➕", bg: "#dcfce7", color: "#15803d" },
  editar:     { icon: "✏️", bg: "#dbeafe", color: "#2563eb" },
  estado:     { icon: "🔄", bg: "#ede9fe", color: "#7c3aed" },
  devolucion: { icon: "↩️", bg: "#fee2e2", color: "#dc2626" },
  usuario:    { icon: "👤", bg: "#fef3c7", color: "#d97706" },
  sesion:     { icon: "🔑", bg: "#f0f9ff", color: "#0369a1" },
  alerta:     { icon: "⚠️", bg: "#fff7ed", color: "#ea580c" },
};

function TabAuditoria() {
  const [filtro, setFiltro] = useState("todo");
  const [busqueda, setBusqueda] = useState("");

  const filtered = AUDITORIA.filter(a => {
    const matchFiltro = filtro === "todo" || a.tipo === filtro;
    const matchBusq = !busqueda || a.user.toLowerCase().includes(busqueda.toLowerCase()) || a.accion.toLowerCase().includes(busqueda.toLowerCase()) || a.detalle.toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusq;
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#9c9a92" }}>🔍</span>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar en el historial…"
            style={{ width: "100%", background: "#fff", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 12px 7px 28px", fontSize: 13, fontFamily: "inherit", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", gap: 4, background: "#f0eee9", borderRadius: 8, padding: 3, flexWrap: "wrap" }}>
          {[["todo","Todo"],["crear","Creados"],["editar","Editados"],["estado","Estados"],["devolucion","Devol."],["alerta","Alertas"]].map(([v,l]) => (
            <button key={v} onClick={() => setFiltro(v)}
              style={{ padding: "5px 10px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: filtro === v ? "#fff" : "transparent", color: filtro === v ? "#1a1916" : "#6b6860", boxShadow: filtro === v ? "0 1px 3px rgba(0,0,0,.06)" : "none", transition: "all .15s" }}>
              {l}
            </button>
          ))}
        </div>
        <button style={{ padding: "7px 12px", background: "transparent", border: "1px solid #e2dfd8", borderRadius: 8, fontSize: 12.5, color: "#6b6860", cursor: "pointer", fontFamily: "inherit" }}>
          📥 Exportar log
        </button>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2dfd8", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafaf9" }}>
              {["TIPO","ACCIÓN","DETALLE","MÓDULO","USUARIO","TIEMPO"].map(h => (
                <th key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9c9a92", textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #e2dfd8", letterSpacing: ".3px", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => {
              const tc = TIPO_CFG[a.tipo] || TIPO_CFG.editar;
              return (
                <tr key={a.id} style={{ borderBottom: "1px solid #f0eee9", transition: "background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafaf9"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{tc.icon}</div>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>{a.accion}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12.5, color: "#6b6860", maxWidth: 280 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.detalle}</div>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11.5, fontWeight: 500, background: "#f0eee9", color: "#6b6860" }}>{a.modulo}</span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>{a.user}</div>
                    <div style={{ fontSize: 11, color: "#9c9a92", marginTop: 1 }}>{a.rol}</div>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "#9c9a92", whiteSpace: "nowrap" }}>{a.tiempo}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: "10px 14px", borderTop: "1px solid #e2dfd8", background: "#fafaf9", fontSize: 12.5, color: "#9c9a92" }}>
          {filtered.length} registros · Retención: 365 días
        </div>
      </div>
    </div>
  );
}

// ─── TAB: REPORTES ────────────────────────────────────────────────────────────
function TabReportes() {
  const maxGastado = Math.max(...REPORTE_MENSUAL.map(r => r.gastado));
  const totalAño = REPORTE_MENSUAL.reduce((a, b) => a + b.gastado, 0);
  const totalDev = REPORTE_MENSUAL.reduce((a, b) => a + b.devuelto, 0);
  const promMes = totalAño / REPORTE_MENSUAL.length;

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "TOTAL PERÍODO",      val: fmtCOP(totalAño),                    icon: "💰", bg: "#dcfce7", c: "#15803d" },
          { label: "DEVOLUCIONES",        val: fmtCOP(totalDev),                    icon: "↩️", bg: "#fee2e2", c: "#dc2626" },
          { label: "NETO",                val: fmtCOP(totalAño - totalDev),         icon: "✅", bg: "#ede9fe", c: "#7c3aed" },
          { label: "PROMEDIO MENSUAL",    val: fmtCOP(promMes),                     icon: "📊", bg: "#dbeafe", c: "#2563eb" },
          { label: "TASA DEVOLUCIÓN",     val: ((totalDev/totalAño)*100).toFixed(1)+"%", icon: "📉", bg: "#fff7ed", c: "#ea580c" },
          { label: "MEJOR MES",           val: "Marzo $5.2M",                       icon: "🏆", bg: "#fef3c7", c: "#d97706" },
        ].map(m => (
          <div key={m.label} style={{ background: "#fff", border: "1px solid #e2dfd8", borderRadius: 12, padding: "13px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9c9a92", letterSpacing: ".3px" }}>{m.label}</span>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{m.icon}</div>
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.5px", fontFamily: "monospace" }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Gráfico de barras mensual */}
      <SectionCard title="Gasto mensual vs devoluciones" sub="Dic 2025 – May 2026 · Pesos colombianos" icon="📊" iconBg="#dbeafe" iconColor="#2563eb"
        action={<button style={{ fontSize: 12.5, color: "#2563eb", background: "transparent", border: "1px solid #bfdbfe", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}>📥 Exportar PDF</button>}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160, marginBottom: 10 }}>
          {REPORTE_MENSUAL.map((r, i) => {
            const h = Math.round((r.gastado / maxGastado) * 140);
            const dh = Math.round((r.devuelto / maxGastado) * 140);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6860" }}>{fmtCOP(r.gastado)}</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
                  <div title={`Gastado: ${fmtCOP(r.gastado)}`}
                    style={{ width: 28, height: h + "px", background: i === REPORTE_MENSUAL.length - 1 ? "#2563eb" : "#1a1916", borderRadius: "4px 4px 0 0", transition: "all .3s", minWidth: 20 }} />
                  <div title={`Devuelto: ${fmtCOP(r.devuelto)}`}
                    style={{ width: 14, height: dh + "px", background: "#fca5a5", borderRadius: "3px 3px 0 0" }} />
                </div>
                <span style={{ fontSize: 11, color: "#9c9a92", fontWeight: 500 }}>{r.mes}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[["#1a1916","Gastado"],["#fca5a5","Devuelto"],["#2563eb","Mes actual"]].map(([c,l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b6860" }}>
              <div style={{ width: 10, height: 10, background: c, borderRadius: 2 }} />{l}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Top técnicos */}
      <SectionCard title="Pedidos por técnico" sub="Acumulado del período" icon="👥" iconBg="#dcfce7" iconColor="#15803d">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { nombre: "Carlos Ruiz",  pedidos: 28, total: 3200000, devueltos: 2 },
            { nombre: "Ana García",   pedidos: 22, total: 2100000, devueltos: 1 },
            { nombre: "Luis Pérez",   pedidos: 18, total: 1840000, devueltos: 0 },
            { nombre: "María Soto",   pedidos: 12, total: 980000,  devueltos: 3 },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 12px", background: "#f7f6f3", borderRadius: 9 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#9c9a92", width: 20, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,#667eea,#764ba2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {t.nombre.split(" ").map(n => n[0]).join("")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.nombre}</div>
                <div style={{ fontSize: 11.5, color: "#9c9a92", marginTop: 1 }}>{t.pedidos} pedidos · {t.devueltos} devueltos</div>
              </div>
              <div style={{ flex: 1, maxWidth: 120 }}>
                <div style={{ height: 5, background: "#e2dfd8", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: (t.pedidos / 28 * 100) + "%", background: "#1a1916", borderRadius: 99 }} />
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, fontFamily: "monospace" }}>{fmtCOP(t.total)}</div>
                <div style={{ fontSize: 11, color: "#9c9a92" }}>total</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Marcas más solicitadas */}
      <SectionCard title="Marcas más solicitadas" sub="Por volumen de pedidos" icon="📱" iconBg="#fef3c7" iconColor="#d97706">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>
          {[
            { marca: "Samsung",  pct: 34, total: 34, color: "#2563eb" },
            { marca: "Apple",    pct: 28, total: 28, color: "#6b6860" },
            { marca: "Xiaomi",   pct: 18, total: 18, color: "#d97706" },
            { marca: "Oppo",     pct: 12, total: 12, color: "#15803d" },
            { marca: "Huawei",   pct: 8,  total: 8,  color: "#dc2626" },
          ].map(m => (
            <div key={m.marca} style={{ background: "#f7f6f3", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: m.color + "20", border: "2px solid " + m.color + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: m.color, margin: "0 auto 8px" }}>
                {m.pct}%
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{m.marca}</div>
              <div style={{ fontSize: 11.5, color: "#9c9a92", marginTop: 2 }}>{m.total} pedidos</div>
              <div style={{ height: 3, background: "#e2dfd8", borderRadius: 99, overflow: "hidden", marginTop: 8 }}>
                <div style={{ height: "100%", width: m.pct + "%", background: m.color, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── PANEL ADMINISTRADOR ──────────────────────────────────────────────────────
export default function PanelAdmin() {
  const [tab, setTab] = useState("usuarios");

  const TABS = [
    { id: "usuarios",  label: "👥 Usuarios",       },
    { id: "auditoria", label: "🕐 Auditoría",       },
    { id: "reportes",  label: "📊 Reportes",        },
    { id: "config",    label: "⚙️ Configuración",   },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f7f6f3", minHeight: "100vh", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px" }}>Panel de administración</div>
              <div style={{ fontSize: 13, color: "#6b6860", marginTop: 2 }}>Control total del sistema · {USUARIOS.filter(u => u.activo).length} usuarios activos</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12.5, color: "#15803d", fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#15803d", animation: "pulse 2s infinite" }} />
            Sistema operativo
          </div>
          <button style={{ padding: "7px 14px", background: "transparent", border: "1px solid #e2dfd8", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer", color: "#6b6860" }}>
            📥 Exportar todo
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#fff", border: "1px solid #e2dfd8", borderRadius: 12, padding: 5, width: "fit-content", overflowX: "auto" }}>
        {TABS.map(t => (
          <TabBtn key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</TabBtn>
        ))}
      </div>

      {/* Contenido */}
      {tab === "usuarios"  && <TabUsuarios />}
      {tab === "auditoria" && <TabAuditoria />}
      {tab === "reportes"  && <TabReportes />}
      {tab === "config"    && (
        <div>
          <SectionCard title="Configuración del sistema" sub="Ajustes generales de RepuestosPRO" icon="⚙️" iconBg="#f0eee9" iconColor="#6b6860">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Nombre del taller",          val: "TechCenter Medellín",  type: "text" },
                { label: "Moneda",                     val: "COP - Peso colombiano", type: "select", opts: ["COP - Peso colombiano","USD - Dólar","EUR - Euro"] },
                { label: "Retención de logs (días)",   val: "365",                  type: "number" },
                { label: "Notificaciones por email",   val: "true",                 type: "toggle" },
                { label: "Requerir 2FA para admins",   val: "false",                type: "toggle" },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0eee9" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{c.label}</span>
                  {c.type === "toggle" ? (
                    <div style={{ width: 44, height: 24, borderRadius: 99, background: c.val === "true" ? "#1a1916" : "#e2dfd8", cursor: "pointer", position: "relative", transition: "background .15s" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: c.val === "true" ? 23 : 3, transition: "left .15s" }} />
                    </div>
                  ) : c.type === "select" ? (
                    <select defaultValue={c.val} style={{ background: "#f7f6f3", border: "1px solid #e2dfd8", borderRadius: 7, padding: "5px 24px 5px 8px", fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                      {c.opts?.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={c.type} defaultValue={c.val} style={{ background: "#f7f6f3", border: "1px solid #e2dfd8", borderRadius: 7, padding: "5px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", textAlign: "right" }} />
                  )}
                </div>
              ))}
              <button style={{ width: "fit-content", padding: "8px 18px", background: "#1a1916", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", marginTop: 6 }}>
                Guardar configuración
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Zona de peligro" sub="Acciones irreversibles — usa con cuidado" icon="⚠️" iconBg="#fee2e2" iconColor="#dc2626">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Exportar copia de seguridad completa", btn: "Exportar .json", color: "#2563eb" },
                { label: "Limpiar logs de auditoría (>1 año)",   btn: "Limpiar logs",   color: "#d97706" },
                { label: "Restablecer configuración de fábrica", btn: "Restablecer",    color: "#dc2626" },
              ].map((z, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fff1f1", borderRadius: 9, flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 13.5, color: "#1a1916" }}>{z.label}</span>
                  <button onClick={() => alert("Acción de administrador requerida. Confirma en el modal de seguridad.")}
                    style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${z.color}40`, background: "transparent", color: z.color, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                    {z.btn}
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
}
