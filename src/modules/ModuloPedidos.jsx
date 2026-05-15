import { useState, useMemo } from "react";

// ─── DATOS ────────────────────────────────────────────────────────────────────
const PEDIDOS_DATA = [
  { id: "#0481", repuesto: "Pantalla Oppo A79 5G",       marca: "Oppo",     modelo: "A79 5G",   tipo: "Genérico",   cant: 2,  unitario: 120000, tecnico: "Carlos Ruiz",  prioridad: "urgente", estado: "pedido",      fecha: "12/05/2026 09:14", proveedor: "TechParts Colombia",  observaciones: "Pantalla rota en esquina. Cliente lo necesita urgente.", devueltos: 0 },
  { id: "#0480", repuesto: "Batería Samsung S23",        marca: "Samsung",  modelo: "S23",       tipo: "Original",   cant: 1,  unitario: 85000,  tecnico: "Ana García",   prioridad: "normal",  estado: "pendiente",   fecha: "12/05/2026 08:32", proveedor: "",                    observaciones: "Batería inflamada, revisar con cuidado.",               devueltos: 0 },
  { id: "#0479", repuesto: "Conector carga iPhone 14",   marca: "Apple",    modelo: "iPhone 14", tipo: "OEM",        cant: 3,  unitario: 65000,  tecnico: "Luis Pérez",   prioridad: "urgente", estado: "entregado",   fecha: "11/05/2026 16:20", proveedor: "DistriMovil SAS",     observaciones: "",                                                       devueltos: 0 },
  { id: "#0478", repuesto: "Flex cámara Xiaomi 12T",     marca: "Xiaomi",   modelo: "12T",       tipo: "Recuperado", cant: 1,  unitario: 0,      tecnico: "María Soto",   prioridad: "normal",  estado: "no_consigue", fecha: "11/05/2026 14:05", proveedor: "",                    observaciones: "Dos proveedores no tienen stock.",                       devueltos: 0 },
  { id: "#0477", repuesto: "Pantalla Huawei Y9s",        marca: "Huawei",   modelo: "Y9s",       tipo: "OEM",        cant: 1,  unitario: 110000, tecnico: "Carlos Ruiz",  prioridad: "normal",  estado: "devuelto",    fecha: "11/05/2026 11:48", proveedor: "Repuestos Global",    observaciones: "Defecto de fabricación. Pantalla con líneas.",          devueltos: 1 },
  { id: "#0476", repuesto: "Batería iPhone 13",          marca: "Apple",    modelo: "iPhone 13", tipo: "Original",   cant: 2,  unitario: 92000,  tecnico: "Ana García",   prioridad: "alta",    estado: "pedido",      fecha: "10/05/2026 15:00", proveedor: "TechParts Colombia",  observaciones: "",                                                       devueltos: 0 },
  { id: "#0475", repuesto: "Pantalla Samsung A54",       marca: "Samsung",  modelo: "A54",       tipo: "Original",   cant: 1,  unitario: 145000, tecnico: "Luis Pérez",   prioridad: "normal",  estado: "entregado",   fecha: "10/05/2026 10:30", proveedor: "TechParts Colombia",  observaciones: "",                                                       devueltos: 0 },
  { id: "#0474", repuesto: "Cámara trasera Xiaomi 12",   marca: "Xiaomi",   modelo: "12",        tipo: "OEM",        cant: 1,  unitario: 78000,  tecnico: "María Soto",   prioridad: "alta",    estado: "pendiente",   fecha: "09/05/2026 17:45", proveedor: "",                    observaciones: "Cámara principal no enfoca.",                            devueltos: 0 },
  { id: "#0473", repuesto: "Flex USB Motorola G73",      marca: "Motorola", modelo: "G73",       tipo: "Genérico",   cant: 2,  unitario: 18000,  tecnico: "Carlos Ruiz",  prioridad: "normal",  estado: "entregado",   fecha: "09/05/2026 09:10", proveedor: "DistriMovil SAS",     observaciones: "",                                                       devueltos: 0 },
  { id: "#0472", repuesto: "Pantalla Realme C55",        marca: "Realme",   modelo: "C55",       tipo: "Genérico",   cant: 1,  unitario: 95000,  tecnico: "Ana García",   prioridad: "urgente", estado: "pedido",      fecha: "08/05/2026 14:22", proveedor: "Repuestos Global",    observaciones: "Cliente pagó por adelantado.",                           devueltos: 0 },
];

const ESTADOS = {
  pendiente:   { label: "Pendiente",    bg: "#fef3c7", color: "#d97706", dot: "#d97706" },
  pedido:      { label: "Pedido",       bg: "#dbeafe", color: "#2563eb", dot: "#2563eb" },
  entregado:   { label: "Entregado",    bg: "#dcfce7", color: "#15803d", dot: "#15803d" },
  devuelto:    { label: "Devuelto",     bg: "#fee2e2", color: "#dc2626", dot: "#dc2626" },
  no_consigue: { label: "No consigue",  bg: "#f4f3f0", color: "#9c9a92", dot: "#9c9a92" },
};

const PRIORIDADES = {
  urgente: { label: "Urgente", bg: "#fee2e2", color: "#dc2626" },
  alta:    { label: "Alta",    bg: "#fef3c7", color: "#d97706" },
  normal:  { label: "Normal",  bg: "#f4f3f0", color: "#9c9a92" },
};

const fmtCOP = (n) => n ? "$" + Math.round(n).toLocaleString("es-CO") : "—";

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ cfg }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap" }}>
      {cfg.dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />}
      {cfg.label}
    </span>
  );
}

// ─── ESTADO SELECTOR (rol suministro) ────────────────────────────────────────
function EstadoSelector({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const cfg = ESTADOS[current];
  return (
    <div style={{ position: "relative" }}>
      <div onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: cfg.bg, color: cfg.color, cursor: "pointer", userSelect: "none" }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot }} />
        {cfg.label}
        <span style={{ fontSize: 10, marginLeft: 2 }}>▾</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: "1px solid #e2dfd8", borderRadius: 10, overflow: "hidden", zIndex: 100, minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,.1)" }}>
          {Object.entries(ESTADOS).map(([key, val]) => (
            <div key={key} onClick={(e) => { e.stopPropagation(); onChange(key); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", cursor: "pointer", background: current === key ? "#f0eee9" : "#fff", fontSize: 13, fontWeight: current === key ? 600 : 400 }}
              onMouseEnter={e => e.currentTarget.style.background = "#f7f6f3"}
              onMouseLeave={e => e.currentTarget.style.background = current === key ? "#f0eee9" : "#fff"}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: val.dot, flexShrink: 0 }} />
              {val.label}
              {current === key && <span style={{ marginLeft: "auto", fontSize: 12 }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DETALLE PANEL ────────────────────────────────────────────────────────────
function DetallePedido({ pedido, onClose, onUpdate, rolSuministro }) {
  const [precio, setPrecio] = useState(pedido.unitario);
  const [proveedor, setProveedor] = useState(pedido.proveedor);
  const [estado, setEstado] = useState(pedido.estado);
  const [comentario, setComentario] = useState("");
  const [comentarios, setComentarios] = useState([
    { user: "Ana García", rol: "Suministro", texto: "Consultando precio con proveedor.", time: "Hace 2h" },
  ]);
  const [showDev, setShowDev] = useState(false);
  const [devMotivo, setDevMotivo] = useState("Defecto de fabricación");

  const total = (pedido.cant - pedido.devueltos) * precio;

  const addComentario = () => {
    if (!comentario.trim()) return;
    setComentarios(prev => [...prev, { user: "Juan Martínez", rol: "Administrador", texto: comentario, time: "Ahora" }]);
    setComentario("");
  };

  const guardar = () => {
    onUpdate({ ...pedido, unitario: precio, proveedor, estado });
    alert("✅ Pedido actualizado correctamente.");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: "min(500px, 100%)", height: "100%", background: "#fff", borderLeft: "1px solid #e2dfd8", overflowY: "auto", display: "flex", flexDirection: "column", animation: "slideIn .2s ease" }}>
        <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2dfd8", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px" }}>{pedido.id}</div>
            <div style={{ fontSize: 12, color: "#9c9a92", marginTop: 1 }}>{pedido.fecha}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge cfg={PRIORIDADES[pedido.prioridad]} />
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #e2dfd8", background: "transparent", cursor: "pointer", fontSize: 16, color: "#9c9a92" }}>×</button>
          </div>
        </div>

        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Info dispositivo */}
          <div style={{ background: "#f7f6f3", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9c9a92", letterSpacing: ".3px", marginBottom: 8 }}>DISPOSITIVO</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{pedido.marca} {pedido.modelo}</div>
            <div style={{ fontSize: 13, color: "#6b6860", marginTop: 2 }}>{pedido.repuesto}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ padding: "2px 8px", borderRadius: 99, background: "#e8e5de", fontSize: 11.5, fontWeight: 500, color: "#6b6860" }}>{pedido.tipo}</span>
              <span style={{ padding: "2px 8px", borderRadius: 99, background: "#e8e5de", fontSize: 11.5, fontWeight: 500, color: "#6b6860" }}>{pedido.cant} unidades</span>
              <span style={{ padding: "2px 8px", borderRadius: 99, background: "#e8e5de", fontSize: 11.5, fontWeight: 500, color: "#6b6860" }}>Tec: {pedido.tecnico}</span>
            </div>
            {pedido.observaciones && (
              <div style={{ marginTop: 10, padding: "8px 10px", background: "#fef3c7", borderRadius: 7, fontSize: 12, color: "#92400e" }}>
                💬 {pedido.observaciones}
              </div>
            )}
          </div>

          {/* Estado */}
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9c9a92", letterSpacing: ".3px", marginBottom: 6 }}>ESTADO DEL PEDIDO</div>
            <EstadoSelector current={estado} onChange={setEstado} />
          </div>

          {/* Precio — solo suministro */}
          <div style={{ border: "1px solid #e2dfd8", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9c9a92", letterSpacing: ".3px", marginBottom: 10 }}>
              PRECIO Y PROVEEDOR {!rolSuministro && <span style={{ color: "#dc2626", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>— Solo editable por Suministro</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6860", display: "block", marginBottom: 4 }}>Valor unitario</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#9c9a92", fontFamily: "monospace" }}>$</span>
                  <input type="number" value={precio} disabled={!rolSuministro}
                    onChange={e => setPrecio(parseInt(e.target.value) || 0)}
                    style={{ width: "100%", background: rolSuministro ? "#fff" : "#f7f6f3", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 10px 7px 18px", fontSize: 13, fontFamily: "monospace", outline: "none", cursor: rolSuministro ? "text" : "not-allowed", color: rolSuministro ? "#1a1916" : "#9c9a92" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6860", display: "block", marginBottom: 4 }}>Proveedor</label>
                <select value={proveedor} disabled={!rolSuministro} onChange={e => setProveedor(e.target.value)}
                  style={{ width: "100%", background: rolSuministro ? "#fff" : "#f7f6f3", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: rolSuministro ? "pointer" : "not-allowed", color: rolSuministro ? "#1a1916" : "#9c9a92" }}>
                  <option value="">Sin asignar</option>
                  <option>TechParts Colombia</option>
                  <option>Repuestos Global</option>
                  <option>DistriMovil SAS</option>
                </select>
              </div>
            </div>
            {/* Resumen financiero */}
            <div style={{ background: "#f7f6f3", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#6b6860", marginBottom: 4 }}>
                <span>{pedido.cant} × {fmtCOP(precio)}</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{fmtCOP(pedido.cant * precio)}</span>
              </div>
              {pedido.devueltos > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#dc2626", marginBottom: 4 }}>
                  <span>↩ {pedido.devueltos} devuelto(s)</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>− {fmtCOP(pedido.devueltos * precio)}</span>
                </div>
              )}
              <div style={{ height: 1, background: "#e2dfd8", margin: "6px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ fontFamily: "monospace", color: "#1a1916" }}>{fmtCOP(total)}</span>
              </div>
            </div>
          </div>

          {/* Devolución */}
          {rolSuministro && (
            <div>
              <button onClick={() => setShowDev(!showDev)}
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#dc2626", background: "transparent", border: "1px solid #fecaca", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                ↩ {showDev ? "Cancelar devolución" : "Registrar devolución"}
              </button>
              {showDev && (
                <div style={{ marginTop: 10, padding: "12px 14px", background: "#fff1f1", border: "1px solid #fecaca", borderRadius: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6860", display: "block", marginBottom: 4 }}>Cantidad</label>
                      <input type="number" defaultValue="1" min="1" max={pedido.cant}
                        style={{ width: "100%", border: "1px solid #fecaca", borderRadius: 7, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", background: "#fff", outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6860", display: "block", marginBottom: 4 }}>Motivo</label>
                      <select value={devMotivo} onChange={e => setDevMotivo(e.target.value)}
                        style={{ width: "100%", border: "1px solid #fecaca", borderRadius: 7, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", background: "#fff", outline: "none" }}>
                        {["Defecto de fabricación","No compatible","Pedido equivocado","Daño en transporte","Cambio de cliente"].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ padding: "8px 10px", background: "#fff", borderRadius: 7, fontSize: 12.5, color: "#dc2626", fontFamily: "monospace", fontWeight: 600, marginBottom: 10 }}>
                    Descuento automático: − {fmtCOP(precio)}
                  </div>
                  <button onClick={() => { alert(`↩ Devolución confirmada.\nMotivo: ${devMotivo}\n− ${fmtCOP(precio)} del total\nTrazabilidad registrada.`); setShowDev(false); }}
                    style={{ width: "100%", padding: "8px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                    Confirmar devolución
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Comentarios */}
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9c9a92", letterSpacing: ".3px", marginBottom: 8 }}>COMENTARIOS INTERNOS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              {comentarios.map((c, i) => (
                <div key={i} style={{ background: "#f7f6f3", borderRadius: 9, padding: "9px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{c.user}</span>
                    <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 99, background: "#e8e5de", color: "#6b6860" }}>{c.rol}</span>
                    <span style={{ fontSize: 11, color: "#9c9a92", marginLeft: "auto" }}>{c.time}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#1a1916", lineHeight: 1.5 }}>{c.texto}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={comentario} onChange={e => setComentario(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addComentario()}
                placeholder="Escribe un comentario interno…"
                style={{ flex: 1, background: "#fff", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 11px", fontSize: 13, fontFamily: "inherit", outline: "none" }}
              />
              <button onClick={addComentario}
                style={{ padding: "7px 12px", background: "#1a1916", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
                Enviar
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        {rolSuministro && (
          <div style={{ padding: "14px 20px", borderTop: "1px solid #e2dfd8", display: "flex", gap: 10, position: "sticky", bottom: 0, background: "#fff" }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: "8px", background: "transparent", border: "1px solid #e2dfd8", borderRadius: 9, fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", color: "#6b6860" }}>
              Cancelar
            </button>
            <button onClick={guardar}
              style={{ flex: 2, padding: "8px", background: "#1a1916", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: "#fff" }}>
              Guardar cambios
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MÓDULO PEDIDOS ───────────────────────────────────────────────────────────
export default function ModuloPedidos() {
  const [pedidos, setPedidos] = useState(PEDIDOS_DATA);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPrio, setFiltroPrio] = useState("todas");
  const [filtroTecnico, setFiltroTecnico] = useState("todos");
  const [selected, setSelected] = useState(null);
  const [rolSuministro, setRolSuministro] = useState(true);
  const [sortField, setSortField] = useState("fecha");
  const [sortDir, setSortDir] = useState("desc");

  const tecnicos = [...new Set(PEDIDOS_DATA.map(p => p.tecnico))];

  const filtered = useMemo(() => {
    return pedidos
      .filter(p => {
        const matchSearch = !search || p.repuesto.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search) || p.tecnico.toLowerCase().includes(search.toLowerCase()) || p.marca.toLowerCase().includes(search.toLowerCase());
        const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado;
        const matchPrio = filtroPrio === "todas" || p.prioridad === filtroPrio;
        const matchTec = filtroTecnico === "todos" || p.tecnico === filtroTecnico;
        return matchSearch && matchEstado && matchPrio && matchTec;
      });
  }, [pedidos, search, filtroEstado, filtroPrio, filtroTecnico]);

  const totalGastado = filtered.filter(p => p.estado !== "devuelto").reduce((a, b) => a + b.cant * b.unitario, 0);
  const totalDevuelto = filtered.filter(p => p.estado === "devuelto").reduce((a, b) => a + b.devueltos * b.unitario, 0);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const updatePedido = (updated) => {
    setPedidos(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelected(updated);
  };

  const SortIcon = ({ field }) => (
    <span style={{ fontSize: 10, marginLeft: 4, color: sortField === field ? "#1a1916" : "#d3cfc6" }}>
      {sortField === field ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
    </span>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f7f6f3", minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      <div style={{ padding: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px" }}>Pedidos</div>
            <div style={{ fontSize: 13, color: "#6b6860", marginTop: 3 }}>{filtered.length} pedidos · {filtered.filter(p => p.estado === "pendiente").length} pendientes de atención</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* Simulador de rol */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "#fff", border: "1px solid #e2dfd8", borderRadius: 8, fontSize: 12.5 }}>
              <span style={{ color: "#6b6860" }}>Rol:</span>
              <button onClick={() => setRolSuministro(false)} style={{ padding: "3px 8px", borderRadius: 6, border: "none", background: !rolSuministro ? "#1a1916" : "#f0eee9", color: !rolSuministro ? "#fff" : "#6b6860", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Técnico</button>
              <button onClick={() => setRolSuministro(true)} style={{ padding: "3px 8px", borderRadius: 6, border: "none", background: rolSuministro ? "#1a1916" : "#f0eee9", color: rolSuministro ? "#fff" : "#6b6860", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Suministro</button>
            </div>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: "inherit", background: "transparent", color: "#6b6860", border: "1px solid #e2dfd8", cursor: "pointer" }}>
              📥 Exportar Excel
            </button>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit", background: "#1a1916", color: "#fff", border: "none", cursor: "pointer" }}>
              + Nuevo pedido
            </button>
          </div>
        </div>

        {/* Métricas rápidas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 20 }}>
          {[
            { label: "TOTAL",      val: filtered.length,                                         icon: "📋", bg: "#dbeafe", c: "#2563eb" },
            { label: "PENDIENTES", val: filtered.filter(p=>p.estado==="pendiente").length,        icon: "⏳", bg: "#fef3c7", c: "#d97706" },
            { label: "PEDIDOS",    val: filtered.filter(p=>p.estado==="pedido").length,           icon: "🛒", bg: "#ede9fe", c: "#7c3aed" },
            { label: "ENTREGADOS", val: filtered.filter(p=>p.estado==="entregado").length,        icon: "📦", bg: "#dcfce7", c: "#15803d" },
            { label: "GASTADO",    val: fmtCOP(totalGastado),                                     icon: "💰", bg: "#dcfce7", c: "#15803d" },
            { label: "DEVUELTO",   val: fmtCOP(totalDevuelto),                                    icon: "↩️", bg: "#fee2e2", c: "#dc2626" },
          ].map(m => (
            <div key={m.label} style={{ background: "#fff", border: "1px solid #e2dfd8", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9c9a92", letterSpacing: ".3px" }}>{m.label}</span>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{m.icon}</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px", fontFamily: "monospace", color: "#1a1916" }}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ background: "#fff", border: "1px solid #e2dfd8", borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9c9a92" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por repuesto, ID, técnico…"
              style={{ width: "100%", background: "#f7f6f3", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 12px 7px 30px", fontSize: 13, fontFamily: "inherit", outline: "none" }}
            />
          </div>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            style={{ background: "#f7f6f3", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 28px 7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
            <option value="todos">Todos los estados</option>
            {Object.entries(ESTADOS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filtroPrio} onChange={e => setFiltroPrio(e.target.value)}
            style={{ background: "#f7f6f3", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 28px 7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
            <option value="todas">Todas las prioridades</option>
            {Object.entries(PRIORIDADES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filtroTecnico} onChange={e => setFiltroTecnico(e.target.value)}
            style={{ background: "#f7f6f3", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 28px 7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
            <option value="todos">Todos los técnicos</option>
            {tecnicos.map(t => <option key={t}>{t}</option>)}
          </select>
          {(search || filtroEstado !== "todos" || filtroPrio !== "todas" || filtroTecnico !== "todos") && (
            <button onClick={() => { setSearch(""); setFiltroEstado("todos"); setFiltroPrio("todas"); setFiltroTecnico("todos"); }}
              style={{ fontSize: 12.5, color: "#dc2626", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              × Limpiar filtros
            </button>
          )}
        </div>

        {/* Tabla */}
        <div style={{ background: "#fff", border: "1px solid #e2dfd8", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: "#fafaf9" }}>
                  {[
                    { label: "ID",         field: "id" },
                    { label: "REPUESTO",   field: "repuesto" },
                    { label: "MARCA",      field: "marca" },
                    { label: "TÉCNICO",    field: "tecnico" },
                    { label: "PRIORIDAD",  field: "prioridad" },
                    { label: "ESTADO",     field: "estado" },
                    { label: "CANT.",      field: "cant" },
                    { label: "V. UNIT.",   field: "unitario" },
                    { label: "TOTAL",      field: "total" },
                    { label: "FECHA",      field: "fecha" },
                  ].map(h => (
                    <th key={h.field} onClick={() => handleSort(h.field)}
                      style={{ fontSize: 11, fontWeight: 700, color: "#9c9a92", textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #e2dfd8", letterSpacing: ".3px", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none" }}>
                      {h.label}<SortIcon field={h.field} />
                    </th>
                  ))}
                  <th style={{ fontSize: 11, fontWeight: 700, color: "#9c9a92", padding: "10px 14px", borderBottom: "1px solid #e2dfd8" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: "center", padding: "48px 24px", color: "#9c9a92", fontSize: 14 }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                      No se encontraron pedidos con los filtros actuales.
                    </td>
                  </tr>
                ) : filtered.map((p, i) => {
                  const total = (p.cant - p.devueltos) * p.unitario;
                  const isDevuelto = p.estado === "devuelto";
                  return (
                    <tr key={p.id}
                      onClick={() => setSelected(p)}
                      style={{ cursor: "pointer", borderBottom: "1px solid #f0eee9", transition: "background .1s", background: selected?.id === p.id ? "#f7f6f3" : "transparent" }}
                      onMouseEnter={e => { if (selected?.id !== p.id) e.currentTarget.style.background = "#fafaf9"; }}
                      onMouseLeave={e => { if (selected?.id !== p.id) e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#9c9a92" }}>{p.id}</span>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, maxWidth: 200 }}>{p.repuesto}</div>
                        <div style={{ fontSize: 11.5, color: "#9c9a92", marginTop: 1 }}>{p.tipo}</div>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#6b6860" }}>{p.marca}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#6b6860", whiteSpace: "nowrap" }}>{p.tecnico}</td>
                      <td style={{ padding: "11px 14px" }}><Badge cfg={PRIORIDADES[p.prioridad]} /></td>
                      <td style={{ padding: "11px 14px" }}>
                        {rolSuministro
                          ? <EstadoSelector current={p.estado} onChange={val => updatePedido({ ...p, estado: val })} />
                          : <Badge cfg={ESTADOS[p.estado]} />
                        }
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 13, textAlign: "center", fontFamily: "monospace", fontWeight: 600 }}>{p.cant}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, fontFamily: "monospace", color: rolSuministro ? "#1a1916" : "#9c9a92" }}>
                        {p.unitario ? fmtCOP(p.unitario) : <span style={{ color: "#d97706", fontSize: 12 }}>⏳ Pendiente</span>}
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: isDevuelto ? "#9c9a92" : "#1a1916", textDecoration: isDevuelto ? "line-through" : "none" }}>
                        {total ? fmtCOP(total) : "—"}
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#9c9a92", whiteSpace: "nowrap" }}>{p.fecha.split(" ")[0]}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <button onClick={(e) => { e.stopPropagation(); setSelected(p); }}
                          style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #e2dfd8", background: "transparent", fontSize: 12, fontFamily: "inherit", cursor: "pointer", color: "#6b6860" }}>
                          Ver →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer tabla */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #e2dfd8", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafaf9", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 12.5, color: "#9c9a92" }}>{filtered.length} de {pedidos.length} pedidos</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12.5, color: "#6b6860", fontFamily: "monospace" }}>
                Total visible: <strong>{fmtCOP(totalGastado)}</strong>
                {totalDevuelto > 0 && <span style={{ color: "#dc2626", marginLeft: 8 }}>↩ − {fmtCOP(totalDevuelto)}</span>}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel detalle */}
      {selected && (
        <DetallePedido
          pedido={selected}
          onClose={() => setSelected(null)}
          onUpdate={updatePedido}
          rolSuministro={rolSuministro}
        />
      )}
    </div>
  );
}
