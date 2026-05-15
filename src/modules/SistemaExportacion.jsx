import { useState } from "react";

// ─── DATOS DE EJEMPLO ─────────────────────────────────────────────────────────
const PEDIDOS_EXPORT = [
  { id:"#0481",repuesto:"Pantalla Oppo A79 5G",       marca:"Oppo",    tecnico:"Carlos Ruiz", estado:"pedido",    prioridad:"urgente",cant:2,unitario:120000,total:240000,fecha:"12/05/2026",proveedor:"TechParts Colombia" },
  { id:"#0480",repuesto:"Batería Samsung S23",         marca:"Samsung", tecnico:"Ana García",  estado:"pendiente", prioridad:"normal", cant:1,unitario:85000, total:85000, fecha:"12/05/2026",proveedor:"—"                  },
  { id:"#0479",repuesto:"Conector carga iPhone 14",    marca:"Apple",   tecnico:"Luis Pérez",  estado:"entregado", prioridad:"urgente",cant:3,unitario:65000, total:195000,fecha:"11/05/2026",proveedor:"DistriMovil SAS"    },
  { id:"#0478",repuesto:"Flex cámara Xiaomi 12T",      marca:"Xiaomi",  tecnico:"María Soto",  estado:"no_consigue",prioridad:"normal",cant:1,unitario:0,     total:0,     fecha:"11/05/2026",proveedor:"—"                  },
  { id:"#0477",repuesto:"Pantalla Huawei Y9s",         marca:"Huawei",  tecnico:"Carlos Ruiz", estado:"devuelto",  prioridad:"normal", cant:1,unitario:110000,total:110000,fecha:"11/05/2026",proveedor:"Repuestos Global"   },
  { id:"#0476",repuesto:"Batería iPhone 13",           marca:"Apple",   tecnico:"Ana García",  estado:"pedido",    prioridad:"alta",   cant:2,unitario:92000, total:184000,fecha:"10/05/2026",proveedor:"TechParts Colombia" },
  { id:"#0475",repuesto:"Pantalla Samsung A54",        marca:"Samsung", tecnico:"Luis Pérez",  estado:"entregado", prioridad:"normal", cant:1,unitario:145000,total:145000,fecha:"10/05/2026",proveedor:"TechParts Colombia" },
  { id:"#0474",repuesto:"Cámara trasera Xiaomi 12",   marca:"Xiaomi",  tecnico:"María Soto",  estado:"pendiente", prioridad:"alta",   cant:1,unitario:78000, total:78000, fecha:"09/05/2026",proveedor:"—"                  },
];

const fmtCOP  = (n) => n ? "$" + Math.round(n).toLocaleString("es-CO") : "—";
const fmtDate = ()  => new Date().toLocaleDateString("es-CO",{ day:"2-digit",month:"2-digit",year:"numeric" });

const ESTADO_CFG = {
  pendiente:   { label:"Pendiente",    color:"#d97706" },
  pedido:      { label:"Pedido",       color:"#2563eb" },
  entregado:   { label:"Entregado",    color:"#15803d" },
  devuelto:    { label:"Devuelto",     color:"#dc2626" },
  no_consigue: { label:"No consigue",  color:"#9c9a92" },
};

// ─── GENERADOR PDF (via print CSS) ───────────────────────────────────────────
function generarPDF(pedidos, config) {
  const totalGastado  = pedidos.filter(p=>p.estado!=="devuelto").reduce((a,b)=>a+b.total,0);
  const totalDevuelto = pedidos.filter(p=>p.estado==="devuelto").reduce((a,b)=>a+b.total,0);
  const neto          = totalGastado - totalDevuelto;

  const filas = pedidos.map(p => `
    <tr>
      <td style="font-family:monospace;font-size:11px;color:#666">${p.id}</td>
      <td><strong>${p.repuesto}</strong><br><small style="color:#888">${p.marca} · ${p.prioridad.toUpperCase()}</small></td>
      <td>${p.tecnico}</td>
      <td>${p.cant}</td>
      <td style="font-family:monospace">${fmtCOP(p.unitario)}</td>
      <td style="font-family:monospace;font-weight:700;color:${p.estado==="devuelto"?"#dc2626":"#111"};text-decoration:${p.estado==="devuelto"?"line-through":"none"}">${fmtCOP(p.total)}</td>
      <td><span style="padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;background:${ESTADO_CFG[p.estado]?.color}18;color:${ESTADO_CFG[p.estado]?.color}">${ESTADO_CFG[p.estado]?.label}</span></td>
      <td style="color:#888;font-size:11px">${p.proveedor}</td>
      <td style="color:#888;font-size:11px">${p.fecha}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>RepuestosPRO — ${config.titulo}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'DM Sans',sans-serif; font-size:13px; color:#111; background:#fff; padding:32px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; padding-bottom:20px; border-bottom:2px solid #1a1916; }
  .logo   { display:flex; align-items:center; gap:10px; }
  .logo-box { width:40px;height:40px;background:#1a1916;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px; }
  .logo-text { font-size:18px; font-weight:700; letter-spacing:-0.4px; }
  .logo-sub  { font-size:11px; color:#888; margin-top:2px; }
  .report-info { text-align:right; }
  .report-title { font-size:16px; font-weight:700; color:#1a1916; }
  .report-date  { font-size:11px; color:#888; margin-top:3px; }
  .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
  .kpi  { background:#f7f6f3; border-radius:10px; padding:12px 14px; }
  .kpi-label { font-size:10px; font-weight:700; color:#888; letter-spacing:.4px; text-transform:uppercase; margin-bottom:5px; }
  .kpi-value { font-size:20px; font-weight:700; font-family:monospace; letter-spacing:-0.5px; }
  table { width:100%; border-collapse:collapse; margin-bottom:24px; }
  th { background:#f7f6f3; font-size:10.5px; font-weight:700; color:#888; text-align:left; padding:9px 10px; border-bottom:1.5px solid #e2dfd8; letter-spacing:.3px; text-transform:uppercase; }
  td { padding:10px 10px; border-bottom:1px solid #f0eee9; font-size:12.5px; vertical-align:middle; }
  tr:last-child td { border-bottom:none; }
  tr:hover td { background:#fafaf9; }
  .totals { background:#1a1916; color:#fff; border-radius:10px; padding:14px 18px; display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
  .totals-label { font-size:12px; opacity:.7; margin-bottom:3px; }
  .totals-value { font-size:18px; font-weight:700; font-family:monospace; }
  .footer { text-align:center; font-size:11px; color:#aaa; padding-top:16px; border-top:1px solid #e2dfd8; }
  @media print {
    body { padding:16px; }
    .no-print { display:none !important; }
    @page { size:A4 landscape; margin:15mm; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="logo">
    <div class="logo-box">🔩</div>
    <div>
      <div class="logo-text">RepuestosPRO</div>
      <div class="logo-sub">Taller Técnico</div>
    </div>
  </div>
  <div class="report-info">
    <div class="report-title">${config.titulo}</div>
    <div class="report-date">Generado: ${fmtDate()} · ${pedidos.length} registros</div>
    ${config.periodo ? `<div style="font-size:11px;color:#888;margin-top:2px">Período: ${config.periodo}</div>` : ""}
  </div>
</div>

<div class="kpis">
  <div class="kpi">
    <div class="kpi-label">TOTAL PEDIDOS</div>
    <div class="kpi-value">${pedidos.length}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">TOTAL GASTADO</div>
    <div class="kpi-value" style="color:#15803d">${fmtCOP(totalGastado)}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">DEVUELTO</div>
    <div class="kpi-value" style="color:#dc2626">${fmtCOP(totalDevuelto)}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">NETO</div>
    <div class="kpi-value">${fmtCOP(neto)}</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>ID</th><th>REPUESTO</th><th>TÉCNICO</th><th>CANT.</th>
      <th>V. UNIT.</th><th>TOTAL</th><th>ESTADO</th><th>PROVEEDOR</th><th>FECHA</th>
    </tr>
  </thead>
  <tbody>${filas}</tbody>
</table>

<div class="totals">
  <div>
    <div class="totals-label">NETO TOTAL DEL PERÍODO</div>
    <div class="totals-value">${fmtCOP(neto)}</div>
  </div>
  <div style="text-align:right">
    <div class="totals-label">Gastado: ${fmtCOP(totalGastado)} · Devuelto: −${fmtCOP(totalDevuelto)}</div>
    <div style="font-size:12px;opacity:.6;margin-top:2px">${pedidos.filter(p=>p.estado==="entregado").length} entregados · ${pedidos.filter(p=>p.estado==="pendiente").length} pendientes · ${pedidos.filter(p=>p.estado==="devuelto").length} devueltos</div>
  </div>
</div>

<div class="footer">
  RepuestosPRO © 2026 — Este reporte es confidencial y de uso interno exclusivo del taller técnico.
</div>

<script>window.onload=()=>window.print();</script>
</body>
</html>`;

  const win = window.open("","_blank","width=1100,height=750");
  if (win) { win.document.write(html); win.document.close(); }
}

// ─── GENERADOR CSV/EXCEL ──────────────────────────────────────────────────────
function generarCSV(pedidos) {
  const headers = ["ID","Repuesto","Marca","Técnico","Estado","Prioridad","Cantidad","Valor Unitario","Total","Proveedor","Fecha"];
  const rows = pedidos.map(p => [
    p.id, `"${p.repuesto}"`, p.marca, `"${p.tecnico}"`,
    ESTADO_CFG[p.estado]?.label, p.prioridad, p.cant,
    p.unitario, p.total, `"${p.proveedor}"`, p.fecha,
  ].join(","));

  const totGastado  = pedidos.filter(p=>p.estado!=="devuelto").reduce((a,b)=>a+b.total,0);
  const totDevuelto = pedidos.filter(p=>p.estado==="devuelto").reduce((a,b)=>a+b.total,0);

  rows.push(""); // línea vacía
  rows.push(`"","","","","","","","Total Gastado",${totGastado},"",""`);
  rows.push(`"","","","","","","","Devuelto",${totDevuelto},"",""`);
  rows.push(`"","","","","","","","Neto",${totGastado-totDevuelto},"",""`);

  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n"); // BOM para Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `repuestospro_pedidos_${fmtDate().replace(/\//g,"-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── GENERADOR JSON (respaldo) ────────────────────────────────────────────────
function generarJSON(pedidos) {
  const data = {
    exportado: new Date().toISOString(),
    sistema: "RepuestosPRO v1.0",
    total_registros: pedidos.length,
    pedidos,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `repuestospro_backup_${fmtDate().replace(/\//g,"-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── MODAL DE EXPORTACIÓN ─────────────────────────────────────────────────────
export function ModalExportar({ datos = PEDIDOS_EXPORT, onClose, titulo = "Exportar pedidos" }) {
  const [formato,   setFormato]   = useState("pdf");
  const [filtroExp, setFiltroExp] = useState("todos");
  const [loading,   setLoading]   = useState(false);
  const [exportado, setExportado] = useState(false);

  const [opcionesPDF, setOpcionesPDF] = useState({
    incluirKPIs:      true,
    incluirProveedor: true,
    incluirFecha:     true,
    orientacion:      "landscape",
  });

  const datosFiltrados = datos.filter(p => {
    if (filtroExp === "todos")      return true;
    if (filtroExp === "activos")    return ["pedido","pendiente"].includes(p.estado);
    if (filtroExp === "entregados") return p.estado === "entregado";
    if (filtroExp === "devueltos")  return p.estado === "devuelto";
    return true;
  });

  const totalVal = datosFiltrados.filter(p=>p.estado!=="devuelto").reduce((a,b)=>a+b.total,0);

  const handleExportar = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    if (formato === "pdf") {
      generarPDF(datosFiltrados, { titulo: "Reporte de Pedidos", periodo: "Mayo 2026" });
    } else if (formato === "csv") {
      generarCSV(datosFiltrados);
    } else if (formato === "json") {
      generarJSON(datosFiltrados);
    }

    setLoading(false);
    setExportado(true);
    setTimeout(() => setExportado(false), 3000);
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        style={{ width:"100%",maxWidth:500,background:"#fff",borderRadius:18,overflow:"hidden",boxShadow:"0 24px 64px rgba(0,0,0,.15)" }}>

        {/* Header */}
        <div style={{ padding:"18px 22px",borderBottom:"1px solid #e2dfd8",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ fontSize:16,fontWeight:700,letterSpacing:"-0.3px" }}>📥 {titulo}</div>
          <button onClick={onClose} style={{ width:28,height:28,borderRadius:6,border:"1px solid #e2dfd8",background:"transparent",cursor:"pointer",fontSize:14,color:"#9c9a92" }}>×</button>
        </div>

        <div style={{ padding:"18px 22px" }}>
          {/* Selección de formato */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:12,fontWeight:700,color:"#9c9a92",letterSpacing:".3px",marginBottom:8 }}>FORMATO DE EXPORTACIÓN</div>
            <div style={{ display:"flex",gap:10 }}>
              {[
                { id:"pdf",  icon:"📄",label:"PDF",     desc:"Imprimible · Oficial" },
                { id:"csv",  icon:"📊",label:"Excel CSV",desc:"Editable en Excel" },
                { id:"json", icon:"🔧",label:"JSON",     desc:"Respaldo / API" },
              ].map(f=>(
                <button key={f.id} onClick={()=>setFormato(f.id)}
                  style={{ flex:1,padding:"12px 10px",borderRadius:10,border:formato===f.id?"1.5px solid #1a1916":"1px solid #e2dfd8",background:formato===f.id?"#f7f6f3":"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all .15s" }}>
                  <div style={{ fontSize:22,marginBottom:5 }}>{f.icon}</div>
                  <div style={{ fontSize:13,fontWeight:700,color:formato===f.id?"#1a1916":"#6b6860" }}>{f.label}</div>
                  <div style={{ fontSize:11,color:"#9c9a92",marginTop:2 }}>{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Filtro de datos */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12,fontWeight:700,color:"#9c9a92",letterSpacing:".3px",marginBottom:8 }}>REGISTROS A INCLUIR</div>
            <div style={{ display:"flex",gap:4,background:"#f0eee9",borderRadius:8,padding:3,flexWrap:"wrap" }}>
              {[["todos","Todos"],["activos","Activos"],["entregados","Entregados"],["devueltos","Devueltos"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFiltroExp(v)}
                  style={{ flex:1,padding:"5px 8px",borderRadius:6,border:"none",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",background:filtroExp===v?"#fff":"transparent",color:filtroExp===v?"#1a1916":"#6b6860",boxShadow:filtroExp===v?"0 1px 3px rgba(0,0,0,.06)":"none",transition:"all .15s",whiteSpace:"nowrap" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Opciones PDF */}
          {formato === "pdf" && (
            <div style={{ marginBottom:16,padding:"12px 14px",background:"#f7f6f3",borderRadius:10 }}>
              <div style={{ fontSize:12,fontWeight:700,color:"#9c9a92",letterSpacing:".3px",marginBottom:10 }}>OPCIONES DEL PDF</div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {[
                  { key:"incluirKPIs",      label:"Incluir métricas resumen (KPIs)"     },
                  { key:"incluirProveedor", label:"Mostrar columna de proveedor"         },
                  { key:"incluirFecha",     label:"Mostrar fecha de cada pedido"         },
                ].map(opt=>(
                  <label key={opt.key} style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:13.5 }}>
                    <div onClick={()=>setOpcionesPDF(prev=>({...prev,[opt.key]:!prev[opt.key]}))}
                      style={{ width:20,height:20,borderRadius:5,border:`1.5px solid ${opcionesPDF[opt.key]?"#1a1916":"#d3cfc6"}`,background:opcionesPDF[opt.key]?"#1a1916":"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all .15s" }}>
                      {opcionesPDF[opt.key] && <span style={{ color:"#fff",fontSize:12,lineHeight:1 }}>✓</span>}
                    </div>
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Preview datos */}
          <div style={{ padding:"11px 14px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:9,marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:13,fontWeight:600,color:"#15803d" }}>Vista previa de exportación</div>
              <div style={{ fontSize:12,color:"#166534",marginTop:1 }}>{datosFiltrados.length} registros · Total: {fmtCOP(totalVal)}</div>
            </div>
            <span style={{ fontSize:22 }}>{formato==="pdf"?"📄":formato==="csv"?"📊":"🔧"}</span>
          </div>

          {/* Botón exportar */}
          <button onClick={handleExportar} disabled={loading}
            style={{ width:"100%",padding:"12px",background:exportado?"#15803d":loading?"#9c9a92":"#1a1916",color:"#fff",border:"none",borderRadius:11,fontSize:14,fontWeight:700,fontFamily:"inherit",cursor:loading?"not-allowed":"pointer",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:10 }}>
            {loading  ? <><span style={{ display:"inline-block",width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite" }} />Generando…</>
            :exportado ? <>✅ ¡Exportado correctamente!</>
            : <>📥 Exportar {formato.toUpperCase()} · {datosFiltrados.length} registros</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BOTÓN DE EXPORTACIÓN RÁPIDA ─────────────────────────────────────────────
export function BtnExportar({ datos, label = "Exportar" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,fontSize:13,fontWeight:500,fontFamily:"inherit",background:"transparent",color:"#6b6860",border:"1px solid #e2dfd8",cursor:"pointer",transition:"all .15s" }}
        onMouseEnter={e=>{e.currentTarget.style.background="#f0eee9";e.currentTarget.style.color="#1a1916";}}
        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#6b6860";}}>
        📥 {label}
      </button>
      {open && <ModalExportar datos={datos} onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── DEMO COMPLETO ────────────────────────────────────────────────────────────
export default function SistemaExportacion() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoReporte, setTipoReporte] = useState("pedidos");

  const REPORTES = [
    { id:"pedidos",      icon:"🛒", label:"Pedidos",       desc:"Todos los pedidos con estados, valores y técnicos",         count:PEDIDOS_EXPORT.length,        total:PEDIDOS_EXPORT.reduce((a,b)=>a+b.total,0) },
    { id:"entregados",   icon:"📦", label:"Entregados",    desc:"Solo pedidos entregados del período",                       count:PEDIDOS_EXPORT.filter(p=>p.estado==="entregado").length,  total:PEDIDOS_EXPORT.filter(p=>p.estado==="entregado").reduce((a,b)=>a+b.total,0) },
    { id:"devoluciones", icon:"↩️", label:"Devoluciones",  desc:"Historial de devoluciones y montos descontados",            count:PEDIDOS_EXPORT.filter(p=>p.estado==="devuelto").length,   total:PEDIDOS_EXPORT.filter(p=>p.estado==="devuelto").reduce((a,b)=>a+b.total,0) },
    { id:"financiero",   icon:"💰", label:"Financiero",    desc:"Resumen financiero: gastado, devuelto y neto",              count:PEDIDOS_EXPORT.length,        total:PEDIDOS_EXPORT.filter(p=>p.estado!=="devuelto").reduce((a,b)=>a+b.total,0) },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif",background:"#f7f6f3",minHeight:"100vh",padding:24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12 }}>
        <div>
          <div style={{ fontSize:20,fontWeight:700,letterSpacing:"-0.4px" }}>Exportar reportes</div>
          <div style={{ fontSize:13,color:"#6b6860",marginTop:3 }}>Genera PDF, Excel o JSON de cualquier módulo</div>
        </div>
      </div>

      {/* Selección de reporte */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14,marginBottom:24 }}>
        {REPORTES.map(r=>(
          <div key={r.id} onClick={()=>setTipoReporte(r.id)}
            style={{ background:"#fff",border:tipoReporte===r.id?"1.5px solid #1a1916":"1px solid #e2dfd8",borderRadius:14,padding:"16px 18px",cursor:"pointer",transition:"all .15s",boxShadow:tipoReporte===r.id?"0 4px 12px rgba(0,0,0,.08)":"none" }}
            onMouseEnter={e=>{if(tipoReporte!==r.id){e.currentTarget.style.borderColor="#d3cfc6";}}}
            onMouseLeave={e=>{if(tipoReporte!==r.id){e.currentTarget.style.borderColor="#e2dfd8";}}}>
            <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10 }}>
              <div style={{ width:38,height:38,borderRadius:9,background:"#f0eee9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>{r.icon}</div>
              {tipoReporte===r.id && <span style={{ padding:"2px 8px",borderRadius:99,background:"#1a1916",color:"#fff",fontSize:11,fontWeight:700 }}>Seleccionado</span>}
            </div>
            <div style={{ fontSize:15,fontWeight:700,marginBottom:3 }}>{r.label}</div>
            <div style={{ fontSize:12.5,color:"#6b6860",marginBottom:10,lineHeight:1.4 }}>{r.desc}</div>
            <div style={{ display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid #f0eee9",fontSize:12.5 }}>
              <span style={{ color:"#9c9a92" }}>{r.count} registros</span>
              <span style={{ fontFamily:"monospace",fontWeight:700,color:"#15803d" }}>{fmtCOP(r.total)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Exportar seleccionado */}
      <div style={{ background:"#fff",border:"1px solid #e2dfd8",borderRadius:14,padding:"20px 22px",marginBottom:20 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12 }}>
          <div>
            <div style={{ fontSize:15,fontWeight:700 }}>{REPORTES.find(r=>r.id===tipoReporte)?.label}</div>
            <div style={{ fontSize:13,color:"#6b6860",marginTop:2 }}>{REPORTES.find(r=>r.id===tipoReporte)?.desc}</div>
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={()=>generarCSV(PEDIDOS_EXPORT)}
              style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:9,fontSize:13,fontWeight:500,fontFamily:"inherit",background:"transparent",color:"#6b6860",border:"1px solid #e2dfd8",cursor:"pointer",transition:"all .15s" }}
              onMouseEnter={e=>{e.currentTarget.style.background="#f0eee9";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
              📊 Descargar CSV
            </button>
            <button onClick={()=>setModalOpen(true)}
              style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:9,fontSize:13,fontWeight:700,fontFamily:"inherit",background:"#1a1916",color:"#fff",border:"none",cursor:"pointer",transition:"all .15s" }}
              onMouseEnter={e=>{e.currentTarget.style.background="#2d2b26";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#1a1916";}}>
              📄 Exportar PDF completo
            </button>
          </div>
        </div>
      </div>

      {/* Historial de exportaciones */}
      <div style={{ background:"#fff",border:"1px solid #e2dfd8",borderRadius:14,overflow:"hidden" }}>
        <div style={{ padding:"13px 18px",borderBottom:"1px solid #e2dfd8" }}>
          <div style={{ fontSize:14,fontWeight:700 }}>Historial de exportaciones</div>
          <div style={{ fontSize:12,color:"#9c9a92",marginTop:1 }}>Últimas generaciones de reportes</div>
        </div>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#fafaf9" }}>
              {["REPORTE","FORMATO","USUARIO","REGISTROS","FECHA"].map(h=>(
                <th key={h} style={{ fontSize:11,fontWeight:700,color:"#9c9a92",textAlign:"left",padding:"9px 16px",borderBottom:"1px solid #e2dfd8",letterSpacing:".3px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { rep:"Pedidos completos",  fmt:"PDF",  user:"Ana García",    n:42, fecha:"12/05/2026 10:30" },
              { rep:"Reporte financiero", fmt:"Excel", user:"Juan Martínez",n:38, fecha:"11/05/2026 17:00" },
              { rep:"Devoluciones mayo",  fmt:"PDF",  user:"Juan Martínez",n:5,  fecha:"10/05/2026 09:15" },
              { rep:"Backup completo",    fmt:"JSON", user:"Sistema",       n:187,fecha:"09/05/2026 03:00" },
              { rep:"Pedidos entregados", fmt:"Excel", user:"Ana García",   n:21, fecha:"08/05/2026 16:45" },
            ].map((row,i)=>(
              <tr key={i} style={{ borderBottom:"1px solid #f0eee9" }}
                onMouseEnter={e=>e.currentTarget.style.background="#fafaf9"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"11px 16px",fontSize:13.5,fontWeight:500 }}>{row.rep}</td>
                <td style={{ padding:"11px 16px" }}>
                  <span style={{ padding:"2px 9px",borderRadius:99,fontSize:11.5,fontWeight:600,background:row.fmt==="PDF"?"#fee2e2":row.fmt==="Excel"?"#dcfce7":"#dbeafe",color:row.fmt==="PDF"?"#dc2626":row.fmt==="Excel"?"#15803d":"#2563eb" }}>{row.fmt}</span>
                </td>
                <td style={{ padding:"11px 16px",fontSize:13,color:"#6b6860" }}>{row.user}</td>
                <td style={{ padding:"11px 16px",fontSize:13,fontFamily:"monospace",fontWeight:600 }}>{row.n}</td>
                <td style={{ padding:"11px 16px",fontSize:12.5,color:"#9c9a92" }}>{row.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && <ModalExportar datos={PEDIDOS_EXPORT} onClose={()=>setModalOpen(false)} titulo="Exportar reporte completo" />}
    </div>
  );
}
