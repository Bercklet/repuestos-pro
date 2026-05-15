import { useState, useEffect, useRef } from "react";

// ─── DATOS MOCK ─────────────────────────────────────────────────────────────
const PEDIDOS = [
  { id: "#0481", repuesto: "Pantalla Oppo A79 5G", tipo: "Genérico", cantidad: 2, unitario: 120000, tecnico: "Carlos R.", prioridad: "urgente", estado: "pedido", fecha: "Hoy 09:14" },
  { id: "#0480", repuesto: "Batería Samsung S23", tipo: "Original", cantidad: 1, unitario: 85000, tecnico: "Ana G.", prioridad: "normal", estado: "pendiente", fecha: "Hoy 08:32" },
  { id: "#0479", repuesto: "Conector carga iPhone 14", tipo: "OEM", cantidad: 3, unitario: 65000, tecnico: "Luis P.", prioridad: "urgente", estado: "entregado", fecha: "Ayer 16:20" },
  { id: "#0478", repuesto: "Flex cámara Xiaomi 12T", tipo: "Recuperado", cantidad: 1, unitario: 0, tecnico: "María S.", prioridad: "normal", estado: "no_consigue", fecha: "Ayer 14:05" },
  { id: "#0477", repuesto: "Pantalla Huawei Y9s", tipo: "OEM", cantidad: 1, unitario: 110000, tecnico: "Carlos R.", prioridad: "normal", estado: "devuelto", fecha: "Ayer 11:48" },
  { id: "#0476", repuesto: "Batería iPhone 13", tipo: "Original", cantidad: 2, unitario: 92000, tecnico: "Ana G.", prioridad: "alta", estado: "pedido", fecha: "Hace 2 días" },
];

const ACTIVIDAD = [
  { icon: "📦", color: "#dcfce7", text: "Pedido #0479 entregado", meta: "Conector iPhone 14 · Ana García", time: "12m" },
  { icon: "✏️", color: "#dbeafe", text: "Precio actualizado", meta: "Pantalla Oppo A79: $120k → $115k", time: "1h" },
  { icon: "↩️", color: "#fee2e2", text: "Devolución registrada", meta: "Pantalla Huawei Y9s · $110k desc.", time: "3h" },
  { icon: "🛒", color: "#fef3c7", text: "Nuevo pedido creado", meta: "Batería Samsung S23 · Carlos R.", time: "5h" },
];

const CHART_DATA = [
  { sem: "Sem 1", val: 820, dev: 0 },
  { sem: "Sem 2", val: 1150, dev: 110 },
  { sem: "Sem 3", val: 940, dev: 0 },
  { sem: "Hoy", val: 680, dev: 80 },
];

const TOP_REPUESTOS = [
  { name: "Pantalla Samsung A54", cat: "Display · Original", count: 18, pct: 100 },
  { name: "Batería iPhone 13", cat: "Batería · OEM", count: 14, pct: 78 },
  { name: "Pantalla Oppo A79 5G", cat: "Display · Genérico", count: 11, pct: 61 },
  { name: "Flex carga USB-C", cat: "Conector · Genérico", count: 9, pct: 50 },
  { name: "Cámara trasera Xiaomi", cat: "Cámara · OEM", count: 7, pct: 39 },
];

const SUGERENCIAS_FUZZY = [
  { name: "Pantalla Oppo A79 5G", veces: 11, precio: 120000, tipo: "ok", label: "Recomendado" },
  { name: "Oppo A79 pantalla", veces: 4, precio: 115000, tipo: "dup", label: "Duplicado" },
  { name: "Display A79 Oppo", veces: 2, precio: 118000, tipo: "dup", label: "Duplicado" },
];

const PROVEEDORES_COT = [
  { name: "TechParts Colombia", precio: 115000, entrega: "1–2 días", rating: 4.8, best: true },
  { name: "Repuestos Global", precio: 124000, entrega: "2–3 días", rating: 4.5, best: false },
  { name: "DistriMovil SAS", precio: 130000, entrega: "3 días", rating: 4.2, best: false },
];

const HIST_PRECIOS = [
  { mes: "Dic", val: 145000, tipo: "high" },
  { mes: "Ene", val: 138000, tipo: "" },
  { mes: "Feb", val: 108000, tipo: "low" },
  { mes: "Mar", val: 125000, tipo: "" },
  { mes: "Abr", val: 120000, tipo: "" },
  { mes: "May", val: 115000, tipo: "cur" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtCOP = (n) => "$" + Math.round(n).toLocaleString("es-CO");

const ESTADO_CFG = {
  pendiente:   { label: "Pendiente",    bg: "#fef3c7", color: "#d97706", dot: "#d97706" },
  pedido:      { label: "Pedido",       bg: "#dbeafe", color: "#2563eb", dot: "#2563eb" },
  entregado:   { label: "Entregado",    bg: "#dcfce7", color: "#15803d", dot: "#15803d" },
  devuelto:    { label: "Devuelto",     bg: "#fee2e2", color: "#dc2626", dot: "#dc2626" },
  no_consigue: { label: "No consigue",  bg: "#f4f3f0", color: "#9c9a92", dot: "#9c9a92" },
};

const PRIO_CFG = {
  urgente: { label: "Urgente", bg: "#fee2e2", color: "#dc2626" },
  alta:    { label: "Alta",    bg: "#fef3c7", color: "#d97706" },
  normal:  { label: "Normal",  bg: "#f4f3f0", color: "#9c9a92" },
};

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────

function Badge({ cfg, size = "sm" }) {
  const pad = size === "sm" ? "2px 8px" : "3px 10px";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: pad, borderRadius: 99, fontSize: 11.5, fontWeight: 600,
      background: cfg.bg, color: cfg.color, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot || cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function Card({ children, className = "", onClick, style = {} }) {
  return (
    <div onClick={onClick}
      className={className}
      style={{
        background: "#fff", border: "1px solid #e2dfd8", borderRadius: 14,
        overflow: "hidden", transition: "border-color .15s, box-shadow .15s",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon, iconBg, iconColor, title, sub, action }) {
  return (
    <div style={{ padding: "13px 18px 11px", borderBottom: "1px solid #e2dfd8", display: "flex", alignItems: "center", gap: 10 }}>
      {icon && (
        <div style={{ width: 28, height: 28, borderRadius: 7, background: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.2px" }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: "#9c9a92", marginTop: 1 }}>{sub}</div>}
      </div>
      {action && <div style={{ fontSize: 12.5, color: "#2563eb", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{action}</div>}
    </div>
  );
}

function Btn({ children, variant = "primary", onClick, style = {}, size = "md" }) {
  const pad = size === "sm" ? "5px 10px" : "7px 14px";
  const styles = {
    primary: { background: "#1a1916", color: "#fff", border: "none" },
    ghost: { background: "transparent", color: "#6b6860", border: "1px solid #e2dfd8" },
    danger: { background: "transparent", color: "#dc2626", border: "1px solid #fecaca" },
    green: { background: "#15803d", color: "#fff", border: "none" },
  };
  return (
    <button onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: pad, borderRadius: 8, fontSize: 13, fontWeight: 500,
        fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap",
        transition: "all .15s", ...styles[variant], ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard",    label: "Dashboard",      icon: "⊞", badge: null },
  { id: "pedidos",      label: "Pedidos",        icon: "🛒", badge: 8 },
  { id: "cotizaciones", label: "Cotizaciones",   icon: "📋", badge: null },
  { id: "repuestos",    label: "Repuestos",      icon: "🔧", badge: null },
  { id: "devoluciones", label: "Devoluciones",   icon: "↩", badge: 3, badgeColor: "#d97706" },
  { id: "proveedores",  label: "Proveedores",    icon: "🏪", badge: null },
  { id: "reportes",     label: "Reportes",       icon: "📊", badge: null },
  { id: "auditoria",    label: "Auditoría",      icon: "🕐", badge: null },
  { id: "usuarios",     label: "Usuarios",       icon: "👥", badge: null },
];

function Sidebar({ active, setActive, open, setOpen }) {
  return (
    <>
      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 99, display: "none" }}
          id="mob-overlay"
        />
      )}
      <aside style={{
        width: 220, background: "#fff", borderRight: "1px solid #e2dfd8",
        display: "flex", flexDirection: "column", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: "18px 16px 14px", display: "flex", alignItems: "center", gap: 9, borderBottom: "1px solid #e2dfd8" }}>
          <div style={{ width: 30, height: 30, background: "#1a1916", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#fff", fontSize: 15 }}>🔩</span>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.3px" }}>RepuestosPRO</div>
            <div style={{ fontSize: 10.5, color: "#9c9a92" }}>Taller Técnico</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: "12px 10px 8px", flex: 1 }}>
          {[
            { label: "Principal", items: NAV.slice(0, 4) },
            { label: "Gestión",   items: NAV.slice(4, 7) },
            { label: "Sistema",   items: NAV.slice(7) },
          ].map(group => (
            <div key={group.label} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9c9a92", letterSpacing: ".8px", textTransform: "uppercase", padding: "8px 8px 3px" }}>
                {group.label}
              </div>
              {group.items.map(item => (
                <div key={item.id} onClick={() => setActive(item.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "7px 8px", borderRadius: 7, cursor: "pointer",
                    fontSize: 13, fontWeight: active === item.id ? 500 : 400,
                    background: active === item.id ? "#1a1916" : "transparent",
                    color: active === item.id ? "#fff" : "#6b6860",
                    transition: "all .15s", marginBottom: 1,
                  }}
                  onMouseEnter={e => { if (active !== item.id) e.currentTarget.style.background = "#f0eee9"; }}
                  onMouseLeave={e => { if (active !== item.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 15, width: 18, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ background: item.badgeColor || "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, padding: "0 5px", borderRadius: 99, lineHeight: "16px" }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* User */}
        <div style={{ padding: 10, borderTop: "1px solid #e2dfd8" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 7, cursor: "pointer" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              JM
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>Juan Martínez</div>
              <div style={{ fontSize: 11, color: "#9c9a92" }}>Administrador</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ active, onNew }) {
  const labels = { dashboard: "Dashboard", pedidos: "Pedidos", cotizaciones: "Cotizaciones", repuestos: "Repuestos", devoluciones: "Devoluciones", proveedores: "Proveedores", reportes: "Reportes", auditoria: "Auditoría", usuarios: "Usuarios" };
  return (
    <header style={{ background: "#fff", borderBottom: "1px solid #e2dfd8", padding: "0 24px", height: 54, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 40 }}>
      <div style={{ flex: 1, position: "relative", maxWidth: 340 }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#9c9a92" }}>🔍</span>
        <input placeholder="Buscar pedidos, repuestos…"
          style={{ width: "100%", background: "#f0eee9", border: "1px solid #e2dfd8", borderRadius: 8, padding: "6px 12px 6px 32px", fontSize: 13, fontFamily: "inherit", color: "#1a1916", outline: "none" }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
        <div style={{ width: 33, height: 33, borderRadius: 8, border: "1px solid #e2dfd8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
          🔔
          <span style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, background: "#dc2626", borderRadius: "50%", border: "1.5px solid #fff" }} />
        </div>
        <Btn onClick={onNew}>+ Nuevo pedido</Btn>
      </div>
    </header>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const METRICAS = [
  { label: "PEDIDOS ACTIVOS",  value: "34",    change: "+12%", up: true,  icon: "🛒", iconBg: "#dbeafe", iconColor: "#2563eb" },
  { label: "TOTAL GASTADO",    value: "$4.82M", change: "+8.3%", up: true, icon: "💰", iconBg: "#dcfce7", iconColor: "#15803d" },
  { label: "PENDIENTES",       value: "8",     change: "Sin cambio", up: null, icon: "⏳", iconBg: "#fef3c7", iconColor: "#d97706" },
  { label: "ENTREGADOS",       value: "21",    change: "+5 semana", up: true, icon: "📦", iconBg: "#dcfce7", iconColor: "#15803d" },
  { label: "DEVOLUCIONES",     value: "3",     change: "+1 semana", up: false, icon: "↩️", iconBg: "#fee2e2", iconColor: "#dc2626" },
  { label: "TASA ENTREGA",     value: "94%",   change: "+2%", up: true,  icon: "✅", iconBg: "#ede9fe", iconColor: "#7c3aed" },
];

function Dashboard({ setView }) {
  const maxVal = Math.max(...CHART_DATA.map(d => d.val));

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", marginBottom: 3 }}>Dashboard</div>
          <div style={{ fontSize: 13, color: "#6b6860", display: "flex", alignItems: "center", gap: 6 }}>
            Lunes, 12 de mayo de 2026
            <span style={{ display: "inline-block", width: 7, height: 7, background: "#15803d", borderRadius: "50%", animation: "pulse 2s infinite" }} />
            Tiempo real
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost">📥 Exportar</Btn>
          <Btn variant="ghost">📅 Este mes ▾</Btn>
        </div>
      </div>

      {/* Alertas */}
      <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { type: "warn", icon: "⚠️", msg: "3 pedidos pendientes de aprobación hace más de 24h sin respuesta.", action: "Ver" },
          { type: "err",  icon: "📵", msg: 'Pantalla Samsung A54 marcada como "No se consigue" por 2 proveedores.', action: "Buscar" },
        ].map((a, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
            borderRadius: 10, border: "1px solid",
            background: a.type === "warn" ? "#fffbeb" : "#fff1f1",
            borderColor: a.type === "warn" ? "#fef3c7" : "#fee2e2",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{a.icon}</span>
            <span style={{ fontSize: 12.5, color: a.type === "warn" ? "#92400e" : "#991b1b", flex: 1 }}>{a.msg}</span>
            <Btn variant="ghost" size="sm">{a.action}</Btn>
          </div>
        ))}
      </div>

      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 20 }}>
        {METRICAS.map(m => (
          <Card key={m.label} style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9c9a92", letterSpacing: ".2px" }}>{m.label}</div>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: m.iconBg, color: m.iconColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{m.icon}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-1px", marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
            <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: m.up === true ? "#15803d" : m.up === false ? "#dc2626" : "#9c9a92" }}>
              {m.up === true ? "↑" : m.up === false ? "↓" : "—"} {m.change}
            </div>
          </Card>
        ))}
      </div>

      {/* Grid principal */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
        {/* Columna izquierda */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Tabla pedidos */}
          <Card>
            <CardHeader icon="📋" iconBg="#f0eee9" iconColor="#6b6860" title="Pedidos recientes" sub="Últimas 24 horas" action="Ver todos →" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["ID", "DISPOSITIVO / REPUESTO", "TÉCNICO", "PRIORIDAD", "ESTADO", "TOTAL"].map(h => (
                      <th key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9c9a92", textAlign: "left", padding: "9px 16px", borderBottom: "1px solid #e2dfd8", letterSpacing: ".3px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PEDIDOS.map((p, i) => (
                    <tr key={i} onClick={() => setView("pedidos")}
                      style={{ cursor: "pointer", transition: "background .1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafaf9"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #e2dfd8" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#9c9a92" }}>{p.id}</span>
                      </td>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #e2dfd8" }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{p.repuesto}</div>
                        <div style={{ fontSize: 11.5, color: "#9c9a92", marginTop: 1 }}>{p.tipo} · {p.cantidad} unid.</div>
                      </td>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #e2dfd8", fontSize: 12.5, color: "#6b6860" }}>{p.tecnico}</td>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #e2dfd8" }}><Badge cfg={PRIO_CFG[p.prioridad]} /></td>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #e2dfd8" }}><Badge cfg={ESTADO_CFG[p.estado]} /></td>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #e2dfd8", textAlign: "right", fontFamily: "monospace", fontSize: 12.5, fontWeight: 700, color: p.estado === "devuelto" ? "#9c9a92" : "#1a1916", textDecoration: p.estado === "devuelto" ? "line-through" : "none" }}>
                        {p.unitario ? fmtCOP(p.unitario * p.cantidad) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Gráfico */}
          <Card>
            <CardHeader icon="📈" iconBg="#f0eee9" iconColor="#6b6860" title="Gasto por semana" sub="Mayo 2026 · Miles de pesos COP" />
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
                {CHART_DATA.map((d, i) => {
                  const h = Math.round((d.val / maxVal) * 100);
                  const dh = Math.round((d.dev / maxVal) * 100);
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#6b6860" }}>{d.val >= 1000 ? (d.val/1000).toFixed(1) + "M" : d.val + "k"}</span>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
                        <div style={{ width: 26, height: h + "px", background: i === 3 ? "#b0aea8" : "#1a1916", borderRadius: "4px 4px 0 0", transition: "all .3s" }} />
                        {dh > 0 && <div style={{ width: 13, height: dh + "px", background: "#e2dfd8", borderRadius: "3px 3px 0 0" }} />}
                      </div>
                      <span style={{ fontSize: 11, color: "#9c9a92", fontWeight: 500 }}>{d.sem}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
                {[["#1a1916","Pedidos"],["#e2dfd8","Devoluciones"]].map(([c,l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b6860" }}>
                    <div style={{ width: 9, height: 9, background: c, borderRadius: 2 }} />{l}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Columna derecha */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Donut estados */}
          <Card>
            <CardHeader title="Por estado" sub="Pedidos activos" />
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
              <svg width="88" height="88" viewBox="0 0 88 88" style={{ flexShrink: 0 }}>
                <circle cx="44" cy="44" r="35" fill="none" stroke="#e2dfd8" strokeWidth="11" />
                <circle cx="44" cy="44" r="35" fill="none" stroke="#d97706" strokeWidth="11" strokeDasharray="52 168" strokeDashoffset="0" strokeLinecap="round" />
                <circle cx="44" cy="44" r="35" fill="none" stroke="#2563eb" strokeWidth="11" strokeDasharray="83 137" strokeDashoffset="-52" strokeLinecap="round" />
                <circle cx="44" cy="44" r="35" fill="none" stroke="#15803d" strokeWidth="11" strokeDasharray="70 150" strokeDashoffset="-135" strokeLinecap="round" />
                <circle cx="44" cy="44" r="35" fill="none" stroke="#dc2626" strokeWidth="11" strokeDasharray="13 207" strokeDashoffset="-205" strokeLinecap="round" />
                <text x="44" y="41" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1a1916" fontFamily="inherit">34</text>
                <text x="44" y="55" textAnchor="middle" fontSize="9" fill="#9c9a92" fontFamily="inherit">total</text>
              </svg>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[["#d97706","Pendiente",8],["#2563eb","Pedido",13],["#15803d","Entregado",11],["#dc2626","Devuelto",2]].map(([c,l,v]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
                    <span style={{ color: "#6b6860", flex: 1 }}>{l}</span>
                    <span style={{ fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Top repuestos */}
          <Card>
            <CardHeader title="Más solicitados" sub="Este mes" action="Análisis →" />
            <div style={{ padding: "10px 18px" }}>
              {TOP_REPUESTOS.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < TOP_REPUESTOS.length - 1 ? "1px solid #e2dfd8" : "none" }}>
                  <span style={{ width: 18, fontSize: 12, fontWeight: 700, color: "#9c9a92", textAlign: "center" }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: "#9c9a92" }}>{r.cat}</div>
                  </div>
                  <div style={{ width: 72, flexShrink: 0 }}>
                    <div style={{ height: 4, background: "#e8e5de", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: r.pct + "%", background: "#1a1916", borderRadius: 99 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#6b6860", width: 24, textAlign: "right" }}>{r.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Actividad */}
          <Card>
            <CardHeader title="Actividad reciente" sub="Últimas acciones" action="Auditoría →" />
            <div style={{ padding: "8px 18px" }}>
              {ACTIVIDAD.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < ACTIVIDAD.length - 1 ? "1px solid #e2dfd8" : "none" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: a.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 1 }}>{a.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{a.text}</div>
                    <div style={{ fontSize: 11.5, color: "#9c9a92", marginTop: 1 }}>{a.meta}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "#9c9a92", whiteSpace: "nowrap", marginTop: 3 }}>hace {a.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── CREAR PEDIDO ─────────────────────────────────────────────────────────────
function CrearPedido({ onBack }) {
  const [items, setItems] = useState([
    { name: "Pantalla Samsung A54", cant: 1, unit: 145000 },
    { name: "Adhesivo marco pantalla", cant: 1, unit: 8000 },
  ]);
  const [quality, setQuality] = useState("original");
  const [prio, setPrio] = useState("normal");
  const [searchVal, setSearchVal] = useState("");
  const [showSug, setShowSug] = useState(false);
  const [fotos, setFotos] = useState(["pantalla_rota_01.jpg", "detalle_esquina.jpg"]);

  const total = items.reduce((a, b) => a + b.cant * b.unit, 0);

  const handleSearch = (v) => {
    setSearchVal(v);
    const lv = v.toLowerCase();
    setShowSug(v.length >= 3 && (lv.includes("pant") || lv.includes("disp") || lv.includes("samsung") || lv.includes("a54")));
  };

  const pickSug = (name) => {
    setSearchVal("");
    setShowSug(false);
    setItems(prev => [...prev, { name, cant: 1, unit: 0 }]);
  };

  const addItem = () => setItems(prev => [...prev, { name: "", cant: 1, unit: 0 }]);
  const delItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const QUALITIES = [
    { id: "original", label: "Original", sub: "Fabricante · mayor costo" },
    { id: "oem", label: "OEM", sub: "Compatible certificado" },
    { id: "generico", label: "Genérico", sub: "Compatible estándar" },
    { id: "recuperado", label: "Recuperado", sub: "Segunda vida · bajo costo" },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      {/* Back */}
      <div onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13, color: "#6b6860", cursor: "pointer" }}>
        ← Dashboard / Pedidos / <span style={{ color: "#1a1916", fontWeight: 500 }}>Nuevo pedido</span>
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", marginBottom: 3 }}>Solicitud de repuesto</div>
      <div style={{ fontSize: 13, color: "#6b6860", marginBottom: 20 }}>Completa el formulario — suministro recibe la solicitud al instante.</div>

      {/* Steps */}
      <div style={{ background: "#fff", border: "1px solid #e2dfd8", borderRadius: 12, padding: "11px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
        {[
          { label: "Dispositivo", done: true, active: false },
          { label: "Repuestos",   done: false, active: true },
          { label: "Revisión",    done: false, active: false },
          { label: "Confirmado",  done: false, active: false },
        ].map((s, i, arr) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, flexShrink: 0,
                background: s.done ? "#15803d" : s.active ? "#1a1916" : "#f0eee9",
                color: s.done || s.active ? "#fff" : "#9c9a92",
              }}>
                {s.done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", color: s.done ? "#15803d" : s.active ? "#1a1916" : "#9c9a92" }}>
                {s.label}
              </span>
            </div>
            {i < arr.length - 1 && <div style={{ width: 28, height: 1, background: "#d3cfc6", margin: "0 8px", flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      {/* Dispositivo */}
      <Card style={{ marginBottom: 14 }}>
        <CardHeader icon="📱" iconBg="#dbeafe" iconColor="#2563eb" title="Información del dispositivo" sub="Marca, modelo y técnico" />
        <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Marca *", type: "select", opts: ["Samsung","Apple","Xiaomi","Oppo","Huawei","Motorola"] },
            { label: "Modelo *", type: "text", placeholder: "Ej: Galaxy S23…", value: "Galaxy A54" },
            { label: "Color del dispositivo", type: "text", placeholder: "Ej: Negro, Blanco…", value: "Awesome Violet" },
            { label: "Técnico asignado *", type: "select", opts: ["Carlos Ruiz","Ana García","Luis Pérez","María Soto"] },
          ].map((f, i) => (
            <div key={i}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: "#6b6860", display: "block", marginBottom: 4 }}>{f.label}</label>
              {f.type === "select" ? (
                <select style={{ width: "100%", background: "#fff", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 28px 7px 11px", fontSize: 13.5, fontFamily: "inherit", outline: "none" }}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type="text" defaultValue={f.value} placeholder={f.placeholder}
                  style={{ width: "100%", background: "#fff", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 11px", fontSize: 13.5, fontFamily: "inherit", outline: "none" }}
                />
              )}
            </div>
          ))}
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "#6b6860", display: "block", marginBottom: 4 }}>Observaciones del equipo</label>
            <textarea defaultValue="Pantalla rota en esquina superior derecha. Táctil funciona parcialmente."
              style={{ width: "100%", background: "#fff", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 11px", fontSize: 13.5, fontFamily: "inherit", outline: "none", resize: "vertical", minHeight: 70, lineHeight: 1.5 }}
            />
          </div>
        </div>
      </Card>

      {/* Repuestos */}
      <Card style={{ marginBottom: 14 }}>
        <CardHeader icon="🔧" iconBg="#fef3c7" iconColor="#d97706" title="Repuestos solicitados" sub="Agrega ítems con calidad y cantidad" />
        <div style={{ padding: "16px 18px" }}>
          {/* Búsqueda inteligente */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "#6b6860", display: "block", marginBottom: 4 }}>Buscar repuesto</label>
            <input type="text" value={searchVal} onChange={e => handleSearch(e.target.value)}
              placeholder="Escribe: pantalla, batería, flex de carga…"
              style={{ width: "100%", background: "#fff", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 11px", fontSize: 13.5, fontFamily: "inherit", outline: "none" }}
            />
            {showSug && (
              <div style={{ border: "1px solid #d3cfc6", borderRadius: 12, overflow: "hidden", marginTop: 6 }}>
                <div style={{ padding: "8px 12px", background: "#fffbeb", borderBottom: "1px solid #fef3c7", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#92400e", fontWeight: 600 }}>
                  ✨ Se encontraron variantes del mismo repuesto — evita duplicados
                </div>
                {SUGERENCIAS_FUZZY.map((s, i) => (
                  <div key={i} onClick={() => pickSug(s.name)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderBottom: i < SUGERENCIAS_FUZZY.length - 1 ? "1px solid #e2dfd8" : "none", cursor: "pointer", background: "#fff", transition: "background .1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafaf9"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: s.tipo === "ok" ? "#dcfce7" : "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                      {s.tipo === "ok" ? "✅" : "⚠️"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.name}</div>
                      <div style={{ fontSize: 11.5, color: "#9c9a92", marginTop: 1 }}>{s.veces} pedidos · Último: {fmtCOP(s.precio)}</div>
                    </div>
                    <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.tipo === "ok" ? "#dcfce7" : "#fef3c7", color: s.tipo === "ok" ? "#15803d" : "#92400e" }}>
                      {s.label}
                    </span>
                    <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 600, flexShrink: 0 }}>Usar →</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calidad */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "#6b6860", display: "block", marginBottom: 6 }}>Calidad del repuesto</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {QUALITIES.map(q => (
                <button key={q.id} onClick={() => setQuality(q.id)}
                  style={{
                    padding: "9px 11px", borderRadius: 8, textAlign: "left", fontFamily: "inherit", cursor: "pointer",
                    border: quality === q.id ? "1.5px solid #2563eb" : "1px solid #e2dfd8",
                    background: quality === q.id ? "#eff4ff" : "#fff",
                    transition: "all .15s",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: quality === q.id ? "#2563eb" : "#1a1916" }}>{q.label}</div>
                  <div style={{ fontSize: 11, color: "#9c9a92", marginTop: 2 }}>{q.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Items table */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 1fr 32px", gap: 9, padding: "6px 0", borderBottom: "1px solid #e2dfd8", marginBottom: 4 }}>
            {["REPUESTO", "CANT.", "V. UNITARIO", ""].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9c9a92", letterSpacing: ".3px" }}>{h}</span>
            ))}
          </div>
          {items.map((it, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 80px 1fr 32px", gap: 9, alignItems: "end", padding: "8px 0", borderBottom: "1px solid #f0eee9" }}>
              <input type="text" value={it.name} onChange={e => updateItem(i, "name", e.target.value)}
                placeholder="Nombre del repuesto"
                style={{ width: "100%", background: "#fff", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }}
              />
              <input type="number" value={it.cant} min="1" onChange={e => updateItem(i, "cant", Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: "100%", background: "#fff", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }}
              />
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#9c9a92", fontFamily: "monospace" }}>$</span>
                <input type="number" value={it.unit} readOnly
                  style={{ width: "100%", background: "#f0eee9", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 10px 7px 18px", fontSize: 13, fontFamily: "monospace", outline: "none", color: "#9c9a92", cursor: "not-allowed" }}
                  title="Asignado por suministro"
                />
              </div>
              <button onClick={() => delItem(i)}
                style={{ width: 32, height: 32, borderRadius: 7, border: "1px solid #e2dfd8", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9c9a92", transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "#fff1f1"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2dfd8"; e.currentTarget.style.color = "#9c9a92"; e.currentTarget.style.background = "transparent"; }}
              >
                🗑
              </button>
            </div>
          ))}

          <button onClick={addItem}
            style={{ width: "100%", marginTop: 10, padding: 9, borderRadius: 8, border: "1.5px dashed #d3cfc6", background: "transparent", color: "#6b6860", fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#1a1916"; e.currentTarget.style.color = "#1a1916"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#d3cfc6"; e.currentTarget.style.color = "#6b6860"; }}
          >
            + Agregar repuesto a la solicitud
          </button>

          {/* Total */}
          {items.length > 0 && (
            <div style={{ background: "#f0eee9", borderRadius: 12, padding: "13px 16px", marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b6860", marginBottom: 6 }}>
                <span>Subtotal</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{fmtCOP(total)}</span>
              </div>
              <div style={{ height: 1, background: "#e2dfd8", margin: "6px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13.5, fontWeight: 700 }}>Total del pedido</span>
                <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", letterSpacing: "-0.5px" }}>{fmtCOP(total)}</span>
              </div>
              <div style={{ marginTop: 8, padding: "7px 10px", background: "#e8e5de", borderRadius: 7, fontSize: 11.5, color: "#6b6860", display: "flex", alignItems: "center", gap: 7 }}>
                🔒 Los valores unitarios son asignados por el área de suministro.
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Prioridad */}
      <Card style={{ marginBottom: 14 }}>
        <CardHeader icon="⚠️" iconBg="#fee2e2" iconColor="#dc2626" title="Prioridad y urgencia" sub="Define el nivel de urgencia" />
        <div style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[["normal","⚪ Normal","pn"],["alta","🟡 Alta","pa"],["urgente","🔴 Urgente","pu"]].map(([id, label]) => (
              <button key={id} onClick={() => setPrio(id)}
                style={{
                  flex: 1, padding: "8px 10px", borderRadius: 8, fontFamily: "inherit", cursor: "pointer", fontSize: 13, fontWeight: 500,
                  border: prio === id ? (id === "urgente" ? "1.5px solid #dc2626" : id === "alta" ? "1.5px solid #d97706" : "1.5px solid #d3cfc6") : "1px solid #e2dfd8",
                  background: prio === id ? (id === "urgente" ? "#fff1f1" : id === "alta" ? "#fffbeb" : "#f0eee9") : "transparent",
                  color: prio === id ? (id === "urgente" ? "#dc2626" : id === "alta" ? "#d97706" : "#1a1916") : "#6b6860",
                  transition: "all .15s",
                }}
              >{label}</button>
            ))}
          </div>
          {prio === "urgente" && (
            <div style={{ marginTop: 10, padding: "9px 12px", background: "#fff1f1", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12.5, color: "#991b1b", display: "flex", alignItems: "center", gap: 8 }}>
              🔔 Suministro recibirá una notificación inmediata por este pedido urgente.
            </div>
          )}
        </div>
      </Card>

      {/* Adjuntos */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader icon="📎" iconBg="#f0eee9" iconColor="#6b6860" title="Fotos adjuntas" sub="Evidencia visual del daño" />
        <div style={{ padding: "14px 18px" }}>
          <div onClick={() => setFotos(f => [...f, `foto_${Date.now()}.jpg`])}
            style={{ border: "1.5px dashed #d3cfc6", borderRadius: 10, padding: 18, textAlign: "center", cursor: "pointer", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#1a1916"; e.currentTarget.style.background = "#f0eee9"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#d3cfc6"; e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>📸</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#6b6860" }}>Toca para adjuntar fotos</div>
            <div style={{ fontSize: 12, color: "#9c9a92", marginTop: 2 }}>JPG, PNG, WEBP · Máx. 10MB</div>
          </div>
          {fotos.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
              {fotos.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "#f0eee9", borderRadius: 6, fontSize: 12, color: "#6b6860" }}>
                  📷 {f}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Footer */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost">💾 Guardar borrador</Btn>
        <Btn onClick={() => alert("✅ Solicitud enviada a suministro.\nID: #0482 · Estado: Pendiente")}>
          Enviar solicitud →
        </Btn>
      </div>
    </div>
  );
}

// ─── COTIZACIONES ─────────────────────────────────────────────────────────────
function Cotizaciones() {
  const [heroVal, setHeroVal] = useState("");
  const [showSmart, setShowSmart] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [showReturn, setShowReturn] = useState(null);

  const heroSearch = (v) => {
    setHeroVal(v);
    const lv = v.toLowerCase();
    setShowSmart(v.length >= 3 && (lv.includes("oppo") || lv.includes("a79") || lv.includes("pant")));
  };

  const maxHist = Math.max(...HIST_PRECIOS.map(h => h.val));

  const COTS = [
    { id: "#COT-0241", name: "Pantalla Oppo A79 5G", meta: "Carlos Ruiz · 2 unidades · Original", estado: "pendiente", total: 240000, open: true },
    { id: "#COT-0240", name: "Batería iPhone 13", meta: "Ana García · 1 unidad · OEM", estado: "entregado", total: 92000, open: false },
    { id: "#COT-0239", name: "Pantalla Samsung A54", meta: "Luis Pérez · 1 unidad · Original", estado: "pedido", total: 145000, open: false },
    { id: "#COT-0238", name: "Conector USB-C Xiaomi 12T", meta: "María Soto · 2 unidades · Genérico", estado: "entregado", total: 48000, open: false },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px" }}>Cotizaciones</div>
          <div style={{ fontSize: 13, color: "#6b6860", marginTop: 3 }}>Gestiona precios, compara proveedores y controla el historial.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost">📥 Exportar</Btn>
          <Btn>+ Nueva cotización</Btn>
        </div>
      </div>

      {/* Search Hero */}
      <Card style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, fontWeight: 600, color: "#6b6860" }}>
          ✨ Búsqueda inteligente — detecta duplicados automáticamente
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#9c9a92" }}>🔍</span>
          <input value={heroVal} onChange={e => heroSearch(e.target.value)}
            placeholder="Busca cualquier repuesto: 'pantalla oppo a79', 'batería s23'…"
            style={{ width: "100%", background: "#fff", border: "1.5px solid #d3cfc6", borderRadius: 10, padding: "10px 14px 10px 42px", fontSize: 15, fontFamily: "inherit", outline: "none" }}
          />
        </div>
        {showSmart && (
          <div style={{ border: "1px solid #d3cfc6", borderRadius: 12, overflow: "hidden", marginTop: 8 }}>
            <div style={{ padding: "9px 14px", background: "#fffbeb", borderBottom: "1px solid #fef3c7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#92400e", fontWeight: 700 }}>
                ⚠️ 3 variantes del mismo repuesto — usa el nombre normalizado
              </div>
              <span onClick={() => setShowSmart(false)} style={{ fontSize: 11.5, color: "#a16207", cursor: "pointer" }}>Cerrar ×</span>
            </div>
            {SUGERENCIAS_FUZZY.map((s, i) => (
              <div key={i}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 14px", borderBottom: i < SUGERENCIAS_FUZZY.length - 1 ? "1px solid #e2dfd8" : "none", cursor: "pointer", background: "#fff" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafaf9"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                <div style={{ width: 34, height: 34, borderRadius: 8, background: s.tipo === "ok" ? "#dcfce7" : "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {s.tipo === "ok" ? "✅" : "⚠️"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#9c9a92", marginTop: 2 }}>Usado {s.veces} veces · Último: {fmtCOP(s.precio)}</div>
                </div>
                <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11.5, fontWeight: 700, background: s.tipo === "ok" ? "#dcfce7" : "#fef3c7", color: s.tipo === "ok" ? "#15803d" : "#92400e", flexShrink: 0 }}>
                  {s.label}
                </span>
                <span style={{ fontSize: 13.5, fontFamily: "monospace", fontWeight: 700, color: "#1a1916", textAlign: "right", flexShrink: 0 }}>
                  {fmtCOP(s.precio)}<br />
                  <span style={{ fontSize: 11, fontWeight: 400, color: "#9c9a92", fontFamily: "inherit" }}>Promedio</span>
                </span>
                <span style={{ fontSize: 12.5, color: "#2563eb", fontWeight: 700, flexShrink: 0 }}>Seleccionar →</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Estadísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "COTIZACIONES ACTIVAS", val: "24", ch: "+3 esta semana", up: true },
          { label: "TOTAL COTIZADO", val: "$6.4M", ch: "+12% vs anterior", up: true },
          { label: "APROBADAS", val: "18", ch: "75% tasa aprobación", up: null },
          { label: "PENDIENTES", val: "6", ch: "2 con +24h", up: false },
        ].map(s => (
          <Card key={s.label} style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9c9a92", letterSpacing: ".2px", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.8px", fontFamily: "monospace" }}>{s.val}</div>
            <div style={{ fontSize: 12, marginTop: 3, color: s.up === true ? "#15803d" : s.up === false ? "#dc2626" : "#9c9a92" }}>
              {s.up === true ? "↑" : s.up === false ? "↓" : "•"} {s.ch}
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: "#f0eee9", borderRadius: 9, padding: 3, marginBottom: 18, width: "fit-content" }}>
        {["Todas (24)","Pendientes (6)","Aprobadas (18)","Archivadas"].map((t, i) => (
          <div key={t} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer", background: i === 0 ? "#fff" : "transparent", color: i === 0 ? "#1a1916" : "#6b6860", transition: "all .15s", boxShadow: i === 0 ? "0 1px 3px rgba(0,0,0,.06)" : "none" }}>
            {t}
          </div>
        ))}
      </div>

      {/* Lista cotizaciones */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {COTS.map((cot, ci) => (
          <Card key={cot.id} style={{ border: expanded === ci ? "1.5px solid #1a1916" : "1px solid #e2dfd8" }}>
            {/* Header fila */}
            <div onClick={() => setExpanded(expanded === ci ? null : ci)}
              style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer" }}
            >
              <span style={{ fontFamily: "monospace", fontSize: 12, color: "#9c9a92", whiteSpace: "nowrap" }}>{cot.id}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{cot.name}</div>
                <div style={{ fontSize: 12, color: "#9c9a92", marginTop: 2 }}>{cot.meta}</div>
              </div>
              <Badge cfg={ESTADO_CFG[cot.estado]} />
              <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>{fmtCOP(cot.total)}</span>
              <span style={{ fontSize: 16, color: "#9c9a92", transition: "transform .2s", transform: expanded === ci ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
            </div>

            {/* Expandido */}
            {expanded === ci && (
              <div style={{ padding: "0 18px 18px", borderTop: "1px solid #e2dfd8" }}>
                {/* Comparar proveedores */}
                <div style={{ fontSize: 13, fontWeight: 700, color: "#6b6860", margin: "14px 0 10px", display: "flex", alignItems: "center", gap: 7 }}>
                  🏪 Comparar proveedores
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 16 }}>
                  {PROVEEDORES_COT.map((p, pi) => (
                    <div key={pi} style={{
                      border: p.best ? "1.5px solid #15803d" : "1px solid #e2dfd8",
                      background: p.best ? "#f0fdf4" : "#fff",
                      borderRadius: 10, padding: "12px 14px", position: "relative",
                    }}>
                      {p.best && (
                        <span style={{ position: "absolute", top: -1, right: 12, background: "#15803d", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: "0 0 6px 6px", letterSpacing: ".3px" }}>
                          MEJOR PRECIO
                        </span>
                      )}
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1a1916", marginBottom: 8 }}>🏪 {p.name}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", marginBottom: 4 }}>{fmtCOP(p.precio)}</div>
                      <div style={{ fontSize: 11.5, color: "#9c9a92", marginBottom: 10 }}>📦 {p.entrega} · ⭐ {p.rating}</div>
                      <button
                        style={{ width: "100%", padding: "6px", borderRadius: 7, border: p.best ? "none" : "1px solid #e2dfd8", background: p.best ? "#15803d" : "transparent", color: p.best ? "#fff" : "#6b6860", fontSize: 12, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}
                        onClick={() => alert(`Proveedor asignado: ${p.name}\nPrecio: ${fmtCOP(p.precio)}`)}
                      >
                        Asignar precio
                      </button>
                    </div>
                  ))}
                </div>

                {/* Historial de precios */}
                <div style={{ background: "#f0eee9", borderRadius: 10, padding: "13px 14px", marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#6b6860", marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
                    📈 Historial de precios — últimos 6 meses
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60, marginBottom: 6 }}>
                    {HIST_PRECIOS.map((h, hi) => {
                      const ht = Math.round((h.val / maxHist) * 56);
                      const bg = h.tipo === "high" ? "#fca5a5" : h.tipo === "low" ? "#86efac" : h.tipo === "cur" ? "#93c5fd" : "#d3cfc6";
                      return (
                        <div key={hi} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                          <div style={{ width: "100%", height: ht + "px", background: bg, borderRadius: "3px 3px 0 0", minWidth: 16 }} title={`${h.mes}: ${fmtCOP(h.val)}`} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {HIST_PRECIOS.map(h => (
                      <div key={h.mes} style={{ flex: 1, fontSize: 10.5, color: "#9c9a92", textAlign: "center" }}>{h.mes}</div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                    {[["#86efac","Mín: $108k"],["#fca5a5","Máx: $145k"],["#93c5fd","Actual: $115k"]].map(([c,l]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#6b6860" }}>
                        <div style={{ width: 9, height: 9, background: c, borderRadius: 2 }} />{l}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Btn variant="green" onClick={() => alert(`✅ Cotización ${cot.id} aprobada.\nNotificación enviada al técnico.`)}>
                    ✅ Aprobar cotización
                  </Btn>
                  <Btn variant="ghost">💬 Comentar</Btn>
                  <Btn variant="danger" onClick={() => setShowReturn(showReturn === ci ? null : ci)}>
                    ↩ Registrar devolución
                  </Btn>
                </div>

                {/* Form devolución */}
                {showReturn === ci && (
                  <div style={{ marginTop: 12, padding: "13px 14px", border: "1px solid #fecaca", background: "#fff1f1", borderRadius: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
                      ↩ Registrar devolución
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: "#6b6860", display: "block", marginBottom: 4 }}>Cantidad devuelta</label>
                        <input type="number" defaultValue="1" min="1"
                          style={{ width: "100%", background: "#fff", border: "1px solid #fecaca", borderRadius: 7, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: "#6b6860", display: "block", marginBottom: 4 }}>Motivo</label>
                        <select style={{ width: "100%", background: "#fff", border: "1px solid #fecaca", borderRadius: 7, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                          {["Defecto de fabricación","No compatible","Pedido equivocado","Daño en transporte"].map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ flex: 1, padding: "9px 12px", background: "#fff", borderRadius: 8, fontSize: 13, color: "#dc2626", fontFamily: "monospace", fontWeight: 700 }}>
                        − {fmtCOP(cot.total / 2)} del total
                      </div>
                      <Btn style={{ background: "#dc2626", border: "none", flexShrink: 0 }}
                        onClick={() => { alert(`↩ Devolución registrada.\n${fmtCOP(cot.total/2)} descontados con trazabilidad completa.`); setShowReturn(null); }}
                      >
                        Confirmar devolución
                      </Btn>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── PLACEHOLDER VIEWS ────────────────────────────────────────────────────────
function ComingSoon({ label }) {
  return (
    <div style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 48 }}>🚧</div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px" }}>{label}</div>
      <div style={{ fontSize: 14, color: "#9c9a92", textAlign: "center", maxWidth: 320 }}>
        Este módulo forma parte de la arquitectura completa de RepuestosPRO y está listo para ser desarrollado.
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [crearPedido, setCrearPedido] = useState(false);

  const handleNew = () => { setActive("pedidos"); setCrearPedido(true); };
  const handleBack = () => setCrearPedido(false);

  const renderView = () => {
    if (active === "pedidos" && crearPedido) return <CrearPedido onBack={handleBack} />;
    if (active === "dashboard") return <Dashboard setView={(v) => { setActive(v); if (v === "pedidos") setCrearPedido(false); }} />;
    if (active === "cotizaciones") return <Cotizaciones />;
    return <ComingSoon label={NAV.find(n => n.id === active)?.label || active} />;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F6F3", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d3cfc6; border-radius: 99px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
        }
      `}</style>

      <div className="sidebar-desktop">
        <Sidebar active={active} setActive={(id) => { setActive(id); setCrearPedido(false); }} open={sidebarOpen} setOpen={setSidebarOpen} />
      </div>

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <Topbar active={active} onNew={handleNew} />
        <div style={{ flex: 1, overflowY: "auto" }}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}
