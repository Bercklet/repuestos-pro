import { useState, useMemo } from "react";

// ─── DATOS ────────────────────────────────────────────────────────────────────
const REPUESTOS_DATA = [
  {
    id: "R001", nombre: "Pantalla Samsung A54", marca: "Samsung", modelo: "Galaxy A54",
    categoria: "Display", calidad: "Original", precioActual: 145000, precioMin: 108000, precioMax: 158000,
    solicitudes: 18, proveedor: "TechParts Colombia", stock: "disponible",
    historial: [
      { mes: "Dic", precio: 158000 }, { mes: "Ene", precio: 150000 }, { mes: "Feb", precio: 108000 },
      { mes: "Mar", precio: 140000 }, { mes: "Abr", precio: 142000 }, { mes: "May", precio: 145000 },
    ],
    tags: ["display", "amoled", "original", "a54"],
    aliases: ["Pantalla Galaxy A54", "Display Samsung A54", "Módulo pantalla A54"],
  },
  {
    id: "R002", nombre: "Batería iPhone 13", marca: "Apple", modelo: "iPhone 13",
    categoria: "Batería", calidad: "OEM", precioActual: 92000, precioMin: 82000, precioMax: 105000,
    solicitudes: 14, proveedor: "DistriMovil SAS", stock: "disponible",
    historial: [
      { mes: "Dic", precio: 105000 }, { mes: "Ene", precio: 98000 }, { mes: "Feb", precio: 82000 },
      { mes: "Mar", precio: 88000 }, { mes: "Abr", precio: 90000 }, { mes: "May", precio: 92000 },
    ],
    tags: ["bateria", "apple", "iphone13", "oem"],
    aliases: ["Battery iPhone 13", "Pila iPhone 13"],
  },
  {
    id: "R003", nombre: "Pantalla Oppo A79 5G", marca: "Oppo", modelo: "A79 5G",
    categoria: "Display", calidad: "Genérico", precioActual: 115000, precioMin: 100000, precioMax: 130000,
    solicitudes: 11, proveedor: "Repuestos Global", stock: "disponible",
    historial: [
      { mes: "Dic", precio: 130000 }, { mes: "Ene", precio: 125000 }, { mes: "Feb", precio: 100000 },
      { mes: "Mar", precio: 118000 }, { mes: "Abr", precio: 120000 }, { mes: "May", precio: 115000 },
    ],
    tags: ["display", "oppo", "a79", "generico"],
    aliases: ["Oppo A79 pantalla", "Display A79", "Pantalla Oppo A79"],
  },
  {
    id: "R004", nombre: "Flex carga USB-C universal", marca: "Genérico", modelo: "Universal",
    categoria: "Conector", calidad: "Genérico", precioActual: 18000, precioMin: 12000, precioMax: 22000,
    solicitudes: 9, proveedor: "DistriMovil SAS", stock: "disponible",
    historial: [
      { mes: "Dic", precio: 22000 }, { mes: "Ene", precio: 20000 }, { mes: "Feb", precio: 12000 },
      { mes: "Mar", precio: 16000 }, { mes: "Abr", precio: 18000 }, { mes: "May", precio: 18000 },
    ],
    tags: ["flex", "usbc", "carga", "conector"],
    aliases: ["Conector USB-C", "Puerto carga USB"],
  },
  {
    id: "R005", nombre: "Cámara trasera Xiaomi 12T", marca: "Xiaomi", modelo: "12T",
    categoria: "Cámara", calidad: "OEM", precioActual: 78000, precioMin: 65000, precioMax: 92000,
    solicitudes: 7, proveedor: "TechParts Colombia", stock: "agotado",
    historial: [
      { mes: "Dic", precio: 92000 }, { mes: "Ene", precio: 88000 }, { mes: "Feb", precio: 65000 },
      { mes: "Mar", precio: 75000 }, { mes: "Abr", precio: 78000 }, { mes: "May", precio: 78000 },
    ],
    tags: ["camara", "xiaomi", "12t", "oem"],
    aliases: ["Camera Xiaomi 12T", "Módulo cámara 12T"],
  },
  {
    id: "R006", nombre: "Batería Samsung Galaxy S23", marca: "Samsung", modelo: "Galaxy S23",
    categoria: "Batería", calidad: "Original", precioActual: 85000, precioMin: 75000, precioMax: 98000,
    solicitudes: 6, proveedor: "TechParts Colombia", stock: "disponible",
    historial: [
      { mes: "Dic", precio: 98000 }, { mes: "Ene", precio: 92000 }, { mes: "Feb", precio: 75000 },
      { mes: "Mar", precio: 80000 }, { mes: "Abr", precio: 83000 }, { mes: "May", precio: 85000 },
    ],
    tags: ["bateria", "samsung", "s23", "original"],
    aliases: ["Batería S23", "Pila Samsung S23"],
  },
  {
    id: "R007", nombre: "Conector carga iPhone 14", marca: "Apple", modelo: "iPhone 14",
    categoria: "Conector", calidad: "OEM", precioActual: 65000, precioMin: 52000, precioMax: 75000,
    solicitudes: 5, proveedor: "DistriMovil SAS", stock: "disponible",
    historial: [
      { mes: "Dic", precio: 75000 }, { mes: "Ene", precio: 70000 }, { mes: "Feb", precio: 52000 },
      { mes: "Mar", precio: 60000 }, { mes: "Abr", precio: 63000 }, { mes: "May", precio: 65000 },
    ],
    tags: ["conector", "apple", "iphone14", "oem"],
    aliases: ["Puerto carga iPhone 14", "Lightning iPhone 14"],
  },
  {
    id: "R008", nombre: "Pantalla Huawei Y9s", marca: "Huawei", modelo: "Y9s",
    categoria: "Display", calidad: "OEM", precioActual: 110000, precioMin: 95000, precioMax: 125000,
    solicitudes: 4, proveedor: "Repuestos Global", stock: "bajo",
    historial: [
      { mes: "Dic", precio: 125000 }, { mes: "Ene", precio: 118000 }, { mes: "Feb", precio: 95000 },
      { mes: "Mar", precio: 105000 }, { mes: "Abr", precio: 108000 }, { mes: "May", precio: 110000 },
    ],
    tags: ["display", "huawei", "y9s", "oem"],
    aliases: ["Display Huawei Y9s", "Módulo pantalla Y9s"],
  },
];

const CATEGORIAS = ["Todas", "Display", "Batería", "Conector", "Cámara", "Flex", "Tapa trasera"];
const CALIDADES  = ["Todas", "Original", "OEM", "Genérico", "Recuperado"];
const MARCAS     = ["Todas", "Samsung", "Apple", "Xiaomi", "Oppo", "Huawei", "Motorola"];

const fmtCOP = (n) => n ? "$" + Math.round(n).toLocaleString("es-CO") : "—";

const STOCK_CFG = {
  disponible: { label: "Disponible", bg: "#dcfce7", color: "#15803d" },
  bajo:       { label: "Stock bajo", bg: "#fef3c7", color: "#d97706" },
  agotado:    { label: "Agotado",    bg: "#fee2e2", color: "#dc2626" },
};

const CALIDAD_CFG = {
  "Original":   { bg: "#dcfce7", color: "#15803d" },
  "OEM":        { bg: "#dbeafe", color: "#2563eb" },
  "Genérico":   { bg: "#f0eee9", color: "#6b6860" },
  "Recuperado": { bg: "#fef3c7", color: "#d97706" },
};

// ─── MINI SPARKLINE ───────────────────────────────────────────────────────────
function Sparkline({ data, color = "#1a1916", height = 32 }) {
  const vals = data.map(d => d.precio);
  const min  = Math.min(...vals);
  const max  = Math.max(...vals);
  const range = max - min || 1;
  const w = 80;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  const lastTrend = vals[vals.length - 1] >= vals[vals.length - 2] ? "up" : "down";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={points.split(" ").at(-1).split(",")[0]} cy={points.split(" ").at(-1).split(",")[1]} r="2.5" fill={color} />
      </svg>
      <span style={{ fontSize: 11, color: lastTrend === "up" ? "#15803d" : "#dc2626", fontWeight: 700 }}>
        {lastTrend === "up" ? "↑" : "↓"}
      </span>
    </div>
  );
}

// ─── DETALLE REPUESTO ────────────────────────────────────────────────────────
function DetalleRepuesto({ rep, onClose }) {
  const [tab, setTab] = useState("info");
  const maxHist = Math.max(...rep.historial.map(h => h.precio));
  const variacion = ((rep.precioActual - rep.historial[0].precio) / rep.historial[0].precio * 100).toFixed(1);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: "min(480px,100%)", height: "100%", background: "#fff", borderLeft: "1px solid #e2dfd8", overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2dfd8", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 4 }}>{rep.nombre}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: CALIDAD_CFG[rep.calidad]?.bg, color: CALIDAD_CFG[rep.calidad]?.color }}>{rep.calidad}</span>
                <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: STOCK_CFG[rep.stock]?.bg, color: STOCK_CFG[rep.stock]?.color }}>{STOCK_CFG[rep.stock]?.label}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #e2dfd8", background: "transparent", cursor: "pointer", fontSize: 16, color: "#9c9a92", flexShrink: 0 }}>×</button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, marginTop: 12, background: "#f0eee9", borderRadius: 8, padding: 3 }}>
            {[["info","📋 Info"],["historial","📈 Precios"],["aliases","🔗 Variantes"]].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ flex: 1, padding: "5px 10px", borderRadius: 6, border: "none", fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: tab === id ? "#fff" : "transparent", color: tab === id ? "#1a1916" : "#6b6860", boxShadow: tab === id ? "0 1px 3px rgba(0,0,0,.06)" : "none", transition: "all .15s" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, padding: "16px 20px" }}>
          {tab === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Precio */}
              <div style={{ background: "#f7f6f3", borderRadius: 12, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9c9a92", letterSpacing: ".3px", marginBottom: 4 }}>PRECIO ACTUAL</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", letterSpacing: "-0.5px" }}>{fmtCOP(rep.precioActual)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9c9a92", letterSpacing: ".3px", marginBottom: 4 }}>MÍNIMO</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "#15803d" }}>{fmtCOP(rep.precioMin)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9c9a92", letterSpacing: ".3px", marginBottom: 4 }}>MÁXIMO</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "#dc2626" }}>{fmtCOP(rep.precioMax)}</div>
                </div>
              </div>

              {/* Variación */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: parseFloat(variacion) <= 0 ? "#f0fdf4" : "#fff1f1", borderRadius: 9, border: `1px solid ${parseFloat(variacion) <= 0 ? "#bbf7d0" : "#fecaca"}` }}>
                <span style={{ fontSize: 18 }}>{parseFloat(variacion) <= 0 ? "📉" : "📈"}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: parseFloat(variacion) <= 0 ? "#15803d" : "#dc2626" }}>
                    {variacion}% vs Diciembre
                  </div>
                  <div style={{ fontSize: 11.5, color: "#6b6860" }}>Variación de precio en los últimos 6 meses</div>
                </div>
              </div>

              {/* Info general */}
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9c9a92", letterSpacing: ".3px", marginBottom: 8 }}>INFORMACIÓN GENERAL</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {[
                    ["Marca",         rep.marca],
                    ["Modelo",        rep.modelo],
                    ["Categoría",     rep.categoria],
                    ["Proveedor",     rep.proveedor],
                    ["Solicitudes",   rep.solicitudes + " pedidos históricos"],
                    ["ID interno",    rep.id],
                  ].map(([l, v], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f0eee9", fontSize: 13 }}>
                      <span style={{ color: "#6b6860" }}>{l}</span>
                      <span style={{ fontWeight: 500, textAlign: "right" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9c9a92", letterSpacing: ".3px", marginBottom: 8 }}>TAGS DE BÚSQUEDA</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {rep.tags.map(t => (
                    <span key={t} style={{ padding: "3px 9px", borderRadius: 99, background: "#f0eee9", fontSize: 12, color: "#6b6860", fontFamily: "monospace" }}>#{t}</span>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={{ flex: 1, padding: "8px", background: "#1a1916", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                  + Crear pedido con este repuesto
                </button>
                <button style={{ padding: "8px 12px", background: "transparent", color: "#6b6860", border: "1px solid #e2dfd8", borderRadius: 9, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                  ✏️ Editar
                </button>
              </div>
            </div>
          )}

          {tab === "historial" && (
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>Historial de precios — últimos 6 meses</div>
              {/* Gráfico */}
              <div style={{ background: "#f7f6f3", borderRadius: 12, padding: "16px 14px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
                  {rep.historial.map((h, i) => {
                    const ht = Math.round((h.precio / maxHist) * 100);
                    const isMin = h.precio === rep.precioMin;
                    const isMax = h.precio === rep.precioMax;
                    const isCur = i === rep.historial.length - 1;
                    const bg = isMin ? "#86efac" : isMax ? "#fca5a5" : isCur ? "#93c5fd" : "#d3cfc6";
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, height: "100%", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#6b6860" }}>
                          ${Math.round(h.precio / 1000)}k
                        </span>
                        <div style={{ width: "100%", height: ht + "px", background: bg, borderRadius: "4px 4px 0 0", minWidth: 20, transition: "all .3s" }} title={`${h.mes}: ${fmtCOP(h.precio)}`} />
                        <span style={{ fontSize: 11, color: "#9c9a92" }}>{h.mes}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                  {[["#86efac","Mínimo"],["#fca5a5","Máximo"],["#93c5fd","Actual"],["#d3cfc6","Histórico"]].map(([c,l]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#6b6860" }}>
                      <div style={{ width: 9, height: 9, background: c, borderRadius: 2 }} />{l}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabla historial */}
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f7f6f3" }}>
                    {["MES","PRECIO","VARIACIÓN","ESTADO"].map(h => (
                      <th key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9c9a92", textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #e2dfd8", letterSpacing: ".3px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rep.historial.map((h, i) => {
                    const prev = i > 0 ? rep.historial[i - 1].precio : h.precio;
                    const diff = ((h.precio - prev) / prev * 100).toFixed(1);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f0eee9" }}>
                        <td style={{ padding: "9px 10px", fontSize: 13, fontWeight: 500 }}>{h.mes}</td>
                        <td style={{ padding: "9px 10px", fontSize: 13, fontFamily: "monospace", fontWeight: 600 }}>{fmtCOP(h.precio)}</td>
                        <td style={{ padding: "9px 10px", fontSize: 13, color: i === 0 ? "#9c9a92" : parseFloat(diff) > 0 ? "#dc2626" : parseFloat(diff) < 0 ? "#15803d" : "#9c9a92" }}>
                          {i === 0 ? "—" : (parseFloat(diff) > 0 ? "+" : "") + diff + "%"}
                        </td>
                        <td style={{ padding: "9px 10px" }}>
                          {h.precio === rep.precioMin && <span style={{ padding: "1px 7px", borderRadius: 99, background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 600 }}>Mínimo</span>}
                          {h.precio === rep.precioMax && <span style={{ padding: "1px 7px", borderRadius: 99, background: "#fee2e2", color: "#dc2626", fontSize: 11, fontWeight: 600 }}>Máximo</span>}
                          {i === rep.historial.length - 1 && <span style={{ padding: "1px 7px", borderRadius: 99, background: "#dbeafe", color: "#2563eb", fontSize: 11, fontWeight: 600 }}>Actual</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === "aliases" && (
            <div>
              <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: 9, fontSize: 13, color: "#92400e" }}>
                ⚠️ Estas son variantes detectadas del mismo repuesto. El sistema sugiere unificarlas bajo el nombre normalizado para evitar duplicados.
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8, color: "#15803d" }}>
                ✅ Nombre normalizado
              </div>
              <div style={{ padding: "11px 14px", background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 9, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                {rep.nombre}
              </div>

              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8, color: "#d97706" }}>
                ⚠️ Variantes detectadas ({rep.aliases.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {rep.aliases.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fafaf9", border: "1px solid #e2dfd8", borderRadius: 9 }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{a}</div>
                      <div style={{ fontSize: 11.5, color: "#9c9a92", marginTop: 1 }}>Alias detectado — se redirige al nombre normalizado</div>
                    </div>
                    <button onClick={() => alert(`"${a}" unificado con "${rep.nombre}"\n\nTodos los pedidos futuros con este nombre usarán el nombre normalizado.`)}
                      style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #e2dfd8", background: "transparent", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "#6b6860", whiteSpace: "nowrap" }}>
                      Unificar
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>Agregar nuevo alias</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="Nombre alternativo…" style={{ flex: 1, border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                  <button style={{ padding: "7px 12px", background: "#1a1916", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>+ Agregar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MÓDULO PRINCIPAL ─────────────────────────────────────────────────────────
export default function ModuloRepuestos() {
  const [repuestos, setRepuestos] = useState(REPUESTOS_DATA);
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroCalidad, setFiltroCalidad] = useState("Todas");
  const [filtroMarca, setFiltroMarca] = useState("Todas");
  const [filtroStock, setFiltroStock] = useState("todos");
  const [vista, setVista] = useState("grid"); // grid | tabla
  const [selected, setSelected] = useState(null);
  const [showNuevo, setShowNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [showSugNuevo, setShowSugNuevo] = useState(false);

  const filtered = useMemo(() => {
    return repuestos.filter(r => {
      const s = search.toLowerCase();
      const matchSearch = !search || r.nombre.toLowerCase().includes(s) || r.marca.toLowerCase().includes(s) || r.modelo.toLowerCase().includes(s) || r.categoria.toLowerCase().includes(s) || r.tags.some(t => t.includes(s)) || r.aliases.some(a => a.toLowerCase().includes(s));
      const matchCat   = filtroCategoria === "Todas" || r.categoria === filtroCategoria;
      const matchCal   = filtroCalidad === "Todas"   || r.calidad === filtroCalidad;
      const matchMarca = filtroMarca === "Todas"     || r.marca === filtroMarca;
      const matchStock = filtroStock === "todos"     || r.stock === filtroStock;
      return matchSearch && matchCat && matchCal && matchMarca && matchStock;
    });
  }, [repuestos, search, filtroCategoria, filtroCalidad, filtroMarca, filtroStock]);

  const handleNuevoSearch = (v) => {
    setNuevoNombre(v);
    const lv = v.toLowerCase();
    setShowSugNuevo(v.length >= 3 && repuestos.some(r =>
      r.nombre.toLowerCase().includes(lv) || r.aliases.some(a => a.toLowerCase().includes(lv))
    ));
  };

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", background: "#f7f6f3", minHeight: "100vh", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px" }}>Catálogo de repuestos</div>
          <div style={{ fontSize: 13, color: "#6b6860", marginTop: 3 }}>{repuestos.length} repuestos registrados · {repuestos.filter(r => r.stock === "agotado").length} agotados</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={{ padding: "7px 12px", background: "transparent", border: "1px solid #e2dfd8", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer", color: "#6b6860" }}>📥 Exportar</button>
          <button onClick={() => setShowNuevo(!showNuevo)}
            style={{ padding: "7px 14px", background: "#1a1916", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
            + Nuevo repuesto
          </button>
        </div>
      </div>

      {/* Formulario nuevo repuesto */}
      {showNuevo && (
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "16px 18px", marginBottom: 18 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: "#0369a1" }}>➕ Registrar nuevo repuesto</div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6860", display: "block", marginBottom: 4 }}>Nombre del repuesto *</label>
            <input value={nuevoNombre} onChange={e => handleNuevoSearch(e.target.value)}
              placeholder="Ej: Pantalla Samsung Galaxy A55…"
              style={{ width: "100%", border: "1px solid #e2dfd8", borderRadius: 8, padding: "8px 11px", fontSize: 13.5, fontFamily: "inherit", outline: "none" }} />
          </div>

          {showSugNuevo && (
            <div style={{ border: "1px solid #fef3c7", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ padding: "8px 12px", background: "#fffbeb", fontSize: 12.5, color: "#92400e", fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                ⚠️ Repuestos similares encontrados — verifica si ya existe antes de crear uno nuevo
              </div>
              {repuestos.filter(r => r.nombre.toLowerCase().includes(nuevoNombre.toLowerCase().slice(0, 5)) || r.aliases.some(a => a.toLowerCase().includes(nuevoNombre.toLowerCase().slice(0, 5)))).slice(0, 3).map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderTop: "1px solid #f0eee9", cursor: "pointer", background: "#fff" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafaf9"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                  onClick={() => { setSelected(r); setShowNuevo(false); setShowSugNuevo(false); setNuevoNombre(""); }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.nombre}</div>
                    <div style={{ fontSize: 11.5, color: "#9c9a92" }}>{r.marca} · {fmtCOP(r.precioActual)} · {r.solicitudes} pedidos</div>
                  </div>
                  <span style={{ fontSize: 12.5, color: "#2563eb", fontWeight: 600 }}>Usar este →</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[["Marca","select",MARCAS.slice(1)],["Categoría","select",CATEGORIAS.slice(1)],["Calidad","select",CALIDADES.slice(1)],["Precio inicial","number",""]].map(([l,t,opts]) => (
              <div key={l}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6860", display: "block", marginBottom: 4 }}>{l}</label>
                {t === "select"
                  ? <select style={{ width: "100%", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  : <input type={t} placeholder="$0" style={{ width: "100%", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                }
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { alert("✅ Repuesto registrado correctamente en el catálogo."); setShowNuevo(false); setNuevoNombre(""); setShowSugNuevo(false); }}
              style={{ padding: "7px 14px", background: "#1a1916", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
              Guardar repuesto
            </button>
            <button onClick={() => { setShowNuevo(false); setNuevoNombre(""); setShowSugNuevo(false); }}
              style={{ padding: "7px 14px", background: "transparent", color: "#6b6860", border: "1px solid #e2dfd8", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ background: "#fff", border: "1px solid #e2dfd8", borderRadius: 12, padding: "13px 16px", marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9c9a92" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, marca, modelo, alias…"
            style={{ width: "100%", background: "#f7f6f3", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 12px 7px 28px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
        </div>
        {[
          { label: "Categoría", val: filtroCategoria, set: setFiltroCategoria, opts: CATEGORIAS },
          { label: "Calidad",   val: filtroCalidad,   set: setFiltroCalidad,   opts: CALIDADES },
          { label: "Marca",     val: filtroMarca,     set: setFiltroMarca,     opts: MARCAS },
        ].map(f => (
          <select key={f.label} value={f.val} onChange={e => f.set(e.target.value)}
            style={{ background: "#f7f6f3", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 28px 7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
            {f.opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <select value={filtroStock} onChange={e => setFiltroStock(e.target.value)}
          style={{ background: "#f7f6f3", border: "1px solid #e2dfd8", borderRadius: 8, padding: "7px 28px 7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
          <option value="todos">Todo el stock</option>
          <option value="disponible">Disponible</option>
          <option value="bajo">Stock bajo</option>
          <option value="agotado">Agotado</option>
        </select>
        {/* Toggle vista */}
        <div style={{ display: "flex", gap: 2, background: "#f0eee9", borderRadius: 7, padding: 2, marginLeft: "auto" }}>
          {[["grid","▦ Grid"],["tabla","☰ Tabla"]].map(([id,label]) => (
            <button key={id} onClick={() => setVista(id)}
              style={{ padding: "5px 10px", borderRadius: 5, border: "none", fontSize: 12, cursor: "pointer", fontFamily: "inherit", background: vista === id ? "#fff" : "transparent", color: vista === id ? "#1a1916" : "#6b6860", fontWeight: vista === id ? 600 : 400, boxShadow: vista === id ? "0 1px 2px rgba(0,0,0,.06)" : "none" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* VISTA GRID */}
      {vista === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {filtered.map(r => (
            <div key={r.id} onClick={() => setSelected(r)}
              style={{ background: "#fff", border: "1px solid #e2dfd8", borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#1a1916"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2dfd8"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Top */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: "#f0eee9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  {r.categoria === "Display" ? "📱" : r.categoria === "Batería" ? "🔋" : r.categoria === "Cámara" ? "📷" : "🔌"}
                </div>
                <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: STOCK_CFG[r.stock].bg, color: STOCK_CFG[r.stock].color }}>
                  {STOCK_CFG[r.stock].label}
                </span>
              </div>

              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.2px", marginBottom: 3, lineHeight: 1.3 }}>{r.nombre}</div>
              <div style={{ fontSize: 12, color: "#9c9a92", marginBottom: 12 }}>{r.marca} · {r.categoria}</div>

              {/* Precio y sparkline */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", letterSpacing: "-0.5px" }}>{fmtCOP(r.precioActual)}</div>
                  <div style={{ fontSize: 11, color: "#9c9a92" }}>Mín: {fmtCOP(r.precioMin)} · Máx: {fmtCOP(r.precioMax)}</div>
                </div>
                <Sparkline data={r.historial} />
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #f0eee9" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ padding: "2px 7px", borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: CALIDAD_CFG[r.calidad]?.bg, color: CALIDAD_CFG[r.calidad]?.color }}>{r.calidad}</span>
                </div>
                <span style={{ fontSize: 12, color: "#9c9a92" }}>📋 {r.solicitudes} pedidos</span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 24px", color: "#9c9a92", fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
              No se encontraron repuestos con los filtros actuales.
            </div>
          )}
        </div>
      )}

      {/* VISTA TABLA */}
      {vista === "tabla" && (
        <div style={{ background: "#fff", border: "1px solid #e2dfd8", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ background: "#fafaf9" }}>
                  {["REPUESTO","MARCA","CATEGORÍA","CALIDAD","PRECIO ACTUAL","MÍN","MÁX","TENDENCIA","SOLICITUDES","STOCK",""].map(h => (
                    <th key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9c9a92", textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #e2dfd8", letterSpacing: ".3px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} onClick={() => setSelected(r)}
                    style={{ borderBottom: "1px solid #f0eee9", cursor: "pointer", transition: "background .1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafaf9"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.nombre}</div>
                      <div style={{ fontSize: 11.5, color: "#9c9a92" }}>{r.modelo}</div>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 13, color: "#6b6860" }}>{r.marca}</td>
                    <td style={{ padding: "11px 14px", fontSize: 13, color: "#6b6860" }}>{r.categoria}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: CALIDAD_CFG[r.calidad]?.bg, color: CALIDAD_CFG[r.calidad]?.color }}>{r.calidad}</span>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 13.5, fontFamily: "monospace", fontWeight: 700 }}>{fmtCOP(r.precioActual)}</td>
                    <td style={{ padding: "11px 14px", fontSize: 13, fontFamily: "monospace", color: "#15803d" }}>{fmtCOP(r.precioMin)}</td>
                    <td style={{ padding: "11px 14px", fontSize: 13, fontFamily: "monospace", color: "#dc2626" }}>{fmtCOP(r.precioMax)}</td>
                    <td style={{ padding: "11px 14px" }}><Sparkline data={r.historial} height={28} /></td>
                    <td style={{ padding: "11px 14px", fontSize: 13, textAlign: "center", fontFamily: "monospace", fontWeight: 600 }}>{r.solicitudes}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: STOCK_CFG[r.stock].bg, color: STOCK_CFG[r.stock].color }}>{STOCK_CFG[r.stock].label}</span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <button onClick={e => { e.stopPropagation(); setSelected(r); }}
                        style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #e2dfd8", background: "transparent", fontSize: 12, fontFamily: "inherit", cursor: "pointer", color: "#6b6860" }}>
                        Ver →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "11px 14px", borderTop: "1px solid #e2dfd8", background: "#fafaf9", fontSize: 12.5, color: "#9c9a92" }}>
            {filtered.length} de {repuestos.length} repuestos
          </div>
        </div>
      )}

      {/* Panel detalle */}
      {selected && <DetalleRepuesto rep={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
