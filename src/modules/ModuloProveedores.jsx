import { useState, useMemo } from "react";

const fmtCOP = (n) => n ? "$" + Math.round(n).toLocaleString("es-CO") : "—";

const PROVEEDORES_DATA = [
  {
    id: "P001", nombre: "TechParts Colombia", tipo: "Mayorista", ciudad: "Bogotá",
    contacto: "Roberto Gómez", telefono: "+57 310 234 5678", email: "ventas@techparts.co",
    rating: 4.8, pedidosTotales: 42, montoTotal: 8200000, devueltos: 2,
    tiempoEntrega: "1–2 días", estado: "activo",
    categorias: ["Display","Batería","Conector","Cámara"],
    comentario: "Proveedor principal. Excelente calidad y tiempos.",
    historialPagos: "Al día",
    preciosCompetitivos: true,
    ultimoPedido: "12/05/2026",
    productos: [
      { nombre: "Pantalla Samsung A54",    precio: 145000, stock: "disponible", solicitudes: 18 },
      { nombre: "Batería iPhone 13",       precio: 92000,  stock: "disponible", solicitudes: 14 },
      { nombre: "Cámara Xiaomi 12T",       precio: 78000,  stock: "bajo",       solicitudes: 7  },
      { nombre: "Conector iPhone 14",      precio: 65000,  stock: "disponible", solicitudes: 5  },
    ],
  },
  {
    id: "P002", nombre: "Repuestos Global SAS", tipo: "Distribuidor", ciudad: "Medellín",
    contacto: "Sandra Ríos", telefono: "+57 314 876 5432", email: "info@repuestosglobal.co",
    rating: 4.5, pedidosTotales: 28, montoTotal: 4900000, devueltos: 5,
    tiempoEntrega: "2–3 días", estado: "activo",
    categorias: ["Display","Flex","Tapa trasera"],
    comentario: "Buenos precios pero tiempos variables.",
    historialPagos: "Al día",
    preciosCompetitivos: true,
    ultimoPedido: "11/05/2026",
    productos: [
      { nombre: "Pantalla Oppo A79 5G",   precio: 124000, stock: "disponible", solicitudes: 11 },
      { nombre: "Pantalla Huawei Y9s",    precio: 118000, stock: "bajo",       solicitudes: 4  },
      { nombre: "Pantalla Realme C55",    precio: 95000,  stock: "disponible", solicitudes: 3  },
    ],
  },
  {
    id: "P003", nombre: "DistriMovil SAS", tipo: "Minorista", ciudad: "Medellín",
    contacto: "Camilo Torres", telefono: "+57 300 123 4567", email: "camilo@distrimovil.co",
    rating: 4.2, pedidosTotales: 19, montoTotal: 2100000, devueltos: 1,
    tiempoEntrega: "3 días", estado: "activo",
    categorias: ["Conector","Flex","Batería"],
    comentario: "Bueno para piezas pequeñas y económicas.",
    historialPagos: "Al día",
    preciosCompetitivos: false,
    ultimoPedido: "10/05/2026",
    productos: [
      { nombre: "Flex USB-C Motorola G73", precio: 18000, stock: "disponible", solicitudes: 6  },
      { nombre: "Conector carga Samsung",  precio: 22000, stock: "disponible", solicitudes: 4  },
      { nombre: "Batería Huawei Y9s",      precio: 72000, stock: "agotado",    solicitudes: 2  },
    ],
  },
  {
    id: "P004", nombre: "CelPartes Express", tipo: "Mayorista", ciudad: "Cali",
    contacto: "Lucía Bermúdez", telefono: "+57 315 999 8877", email: "lucia@celpartes.co",
    rating: 3.9, pedidosTotales: 8, montoTotal: 980000, devueltos: 3,
    tiempoEntrega: "4–5 días", estado: "pausado",
    categorias: ["Display","Batería"],
    comentario: "Tiempos de entrega irregulares. En evaluación.",
    historialPagos: "Pendiente verificación",
    preciosCompetitivos: true,
    ultimoPedido: "02/05/2026",
    productos: [
      { nombre: "Pantalla iPhone 12",      precio: 180000, stock: "disponible", solicitudes: 2 },
      { nombre: "Batería Oppo A74",        precio: 68000,  stock: "bajo",       solicitudes: 1 },
    ],
  },
];

const COMPARADOR_DATA = [
  {
    repuesto: "Pantalla Samsung A54",
    proveedores: [
      { nombre: "TechParts Colombia",    precio: 145000, entrega: "1–2 días", calidad: "Original", rating: 4.8, stock: "disponible" },
      { nombre: "Repuestos Global SAS",  precio: 138000, entrega: "2–3 días", calidad: "OEM",      rating: 4.5, stock: "disponible" },
      { nombre: "CelPartes Express",     precio: 132000, entrega: "4–5 días", calidad: "Genérico", rating: 3.9, stock: "bajo"       },
    ],
  },
  {
    repuesto: "Batería iPhone 13",
    proveedores: [
      { nombre: "TechParts Colombia",    precio: 92000,  entrega: "1–2 días", calidad: "OEM",      rating: 4.8, stock: "disponible" },
      { nombre: "DistriMovil SAS",       precio: 88000,  entrega: "3 días",   calidad: "Genérico", rating: 4.2, stock: "disponible" },
      { nombre: "CelPartes Express",     precio: 85000,  entrega: "4–5 días", calidad: "Genérico", rating: 3.9, stock: "disponible" },
    ],
  },
];

const TIPO_CFG = {
  activo:  { label: "Activo",   bg: "#dcfce7", color: "#15803d" },
  pausado: { label: "Pausado",  bg: "#fef3c7", color: "#d97706" },
  inactivo:{ label: "Inactivo", bg: "#fee2e2", color: "#dc2626" },
};

const STOCK_CFG = {
  disponible: { label: "Disponible", color: "#15803d" },
  bajo:       { label: "Stock bajo", color: "#d97706" },
  agotado:    { label: "Agotado",    color: "#dc2626" },
};

function Stars({ rating }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 12, color: i <= Math.round(rating) ? "#f59e0b" : "#e2dfd8" }}>★</span>
      ))}
      <span style={{ fontSize: 12, fontWeight: 600, color: "#6b6860", marginLeft: 3 }}>{rating}</span>
    </div>
  );
}

function DetalleProveedor({ prov, onClose }) {
  const [tab, setTab] = useState("info");
  const [nota, setNota] = useState(prov.comentario);

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"flex-end" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        style={{ width:"min(500px,100%)",height:"100%",background:"#fff",borderLeft:"1px solid #e2dfd8",overflowY:"auto",display:"flex",flexDirection:"column" }}>

        {/* Header */}
        <div style={{ padding:"16px 20px",borderBottom:"1px solid #e2dfd8",position:"sticky",top:0,background:"#fff",zIndex:10 }}>
          <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10 }}>
            <div>
              <div style={{ fontSize:16,fontWeight:700,letterSpacing:"-0.3px",marginBottom:4 }}>{prov.nombre}</div>
              <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
                <span style={{ padding:"2px 8px",borderRadius:99,fontSize:11.5,fontWeight:600,background:TIPO_CFG[prov.estado].bg,color:TIPO_CFG[prov.estado].color }}>{TIPO_CFG[prov.estado].label}</span>
                <span style={{ fontSize:12,color:"#9c9a92" }}>{prov.tipo} · {prov.ciudad}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ width:30,height:30,borderRadius:7,border:"1px solid #e2dfd8",background:"transparent",cursor:"pointer",fontSize:16,color:"#9c9a92",flexShrink:0 }}>×</button>
          </div>
          <div style={{ display:"flex",gap:2,background:"#f0eee9",borderRadius:8,padding:3 }}>
            {[["info","📋 Info"],["productos","📦 Productos"],["historial","📊 Historial"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setTab(id)}
                style={{ flex:1,padding:"5px 8px",borderRadius:6,border:"none",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",background:tab===id?"#fff":"transparent",color:tab===id?"#1a1916":"#6b6860",boxShadow:tab===id?"0 1px 3px rgba(0,0,0,.06)":"none",transition:"all .15s" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex:1,padding:"16px 20px" }}>
          {tab==="info" && (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              {/* Stats */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
                {[
                  { label:"PEDIDOS",    val:prov.pedidosTotales, icon:"📋" },
                  { label:"MONTO",      val:fmtCOP(prov.montoTotal), icon:"💰" },
                  { label:"DEVUELTOS",  val:prov.devueltos, icon:"↩️" },
                ].map(s=>(
                  <div key={s.label} style={{ background:"#f7f6f3",borderRadius:9,padding:"10px 12px",textAlign:"center" }}>
                    <div style={{ fontSize:16,marginBottom:4 }}>{s.icon}</div>
                    <div style={{ fontSize:17,fontWeight:700,fontFamily:"monospace" }}>{s.val}</div>
                    <div style={{ fontSize:11,color:"#9c9a92",fontWeight:700,letterSpacing:".3px",marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Rating */}
              <div style={{ background:"#f7f6f3",borderRadius:10,padding:"12px 14px" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                  <span style={{ fontSize:13.5,fontWeight:600 }}>Calificación general</span>
                  <Stars rating={prov.rating} />
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  {[["Calidad del producto",4.9],["Tiempo de entrega",prov.rating-0.3],["Comunicación",prov.rating+0.1>5?5:prov.rating+0.1],["Precio/Calidad",prov.rating-0.1]].map(([l,v])=>(
                    <div key={l} style={{ display:"flex",alignItems:"center",gap:10 }}>
                      <span style={{ fontSize:12,color:"#6b6860",width:150,flexShrink:0 }}>{l}</span>
                      <div style={{ flex:1,height:5,background:"#e2dfd8",borderRadius:99,overflow:"hidden" }}>
                        <div style={{ height:"100%",width:(v/5*100)+"%",background:"#f59e0b",borderRadius:99 }} />
                      </div>
                      <span style={{ fontSize:12,fontWeight:600,width:28,textAlign:"right",flexShrink:0 }}>{Math.min(v,5).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contacto */}
              <div>
                <div style={{ fontSize:11.5,fontWeight:700,color:"#9c9a92",letterSpacing:".3px",marginBottom:8 }}>INFORMACIÓN DE CONTACTO</div>
                <div style={{ display:"flex",flexDirection:"column",gap:0 }}>
                  {[
                    ["👤 Contacto",   prov.contacto],
                    ["📞 Teléfono",   prov.telefono],
                    ["📧 Email",      prov.email],
                    ["📍 Ciudad",     prov.ciudad],
                    ["🚚 Entrega",    prov.tiempoEntrega],
                    ["💳 Pagos",      prov.historialPagos],
                    ["📅 Últ. pedido",prov.ultimoPedido],
                  ].map(([l,v],i)=>(
                    <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #f0eee9",fontSize:13 }}>
                      <span style={{ color:"#6b6860" }}>{l}</span>
                      <span style={{ fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categorías */}
              <div>
                <div style={{ fontSize:11.5,fontWeight:700,color:"#9c9a92",letterSpacing:".3px",marginBottom:8 }}>CATEGORÍAS QUE MANEJA</div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                  {prov.categorias.map(c=>(
                    <span key={c} style={{ padding:"3px 10px",borderRadius:99,background:"#f0eee9",fontSize:12.5,fontWeight:500,color:"#6b6860" }}>{c}</span>
                  ))}
                </div>
              </div>

              {/* Nota */}
              <div>
                <div style={{ fontSize:11.5,fontWeight:700,color:"#9c9a92",letterSpacing:".3px",marginBottom:6 }}>NOTA INTERNA</div>
                <textarea value={nota} onChange={e=>setNota(e.target.value)}
                  style={{ width:"100%",border:"1px solid #e2dfd8",borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",minHeight:72,lineHeight:1.5 }} />
              </div>

              {/* Acciones */}
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={()=>alert("✅ Cambios del proveedor guardados.")}
                  style={{ flex:1,padding:"8px",background:"#1a1916",color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,fontFamily:"inherit",cursor:"pointer" }}>
                  Guardar cambios
                </button>
                {prov.estado==="activo"
                  ? <button onClick={()=>alert("⏸ Proveedor pausado. No aparecerá en sugerencias.")} style={{ padding:"8px 12px",background:"transparent",color:"#d97706",border:"1px solid #fef3c7",borderRadius:9,fontSize:13,fontFamily:"inherit",cursor:"pointer" }}>Pausar</button>
                  : <button onClick={()=>alert("▶ Proveedor activado.")} style={{ padding:"8px 12px",background:"transparent",color:"#15803d",border:"1px solid #bbf7d0",borderRadius:9,fontSize:13,fontFamily:"inherit",cursor:"pointer" }}>Activar</button>
                }
              </div>
            </div>
          )}

          {tab==="productos" && (
            <div>
              <div style={{ fontSize:13.5,fontWeight:700,marginBottom:12 }}>Productos de {prov.nombre}</div>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {prov.productos.map((p,i)=>(
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:"#f7f6f3",borderRadius:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13.5,fontWeight:500 }}>{p.nombre}</div>
                      <div style={{ fontSize:11.5,color:"#9c9a92",marginTop:2 }}>📋 {p.solicitudes} pedidos históricos</div>
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontSize:15,fontWeight:700,fontFamily:"monospace" }}>{fmtCOP(p.precio)}</div>
                      <div style={{ fontSize:11.5,fontWeight:600,color:STOCK_CFG[p.stock]?.color,marginTop:2 }}>{STOCK_CFG[p.stock]?.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={()=>alert("Abriendo formulario para agregar producto a este proveedor…")}
                style={{ width:"100%",marginTop:12,padding:9,borderRadius:8,border:"1.5px dashed #d3cfc6",background:"transparent",color:"#6b6860",fontSize:13,fontWeight:500,fontFamily:"inherit",cursor:"pointer" }}>
                + Agregar producto
              </button>
            </div>
          )}

          {tab==="historial" && (
            <div>
              <div style={{ fontSize:13.5,fontWeight:700,marginBottom:12 }}>Historial de pedidos</div>
              {[
                { id:"#0481",repuesto:"Pantalla Oppo A79 5G",     monto:240000, fecha:"12/05/2026",estado:"pedido"    },
                { id:"#0479",repuesto:"Conector iPhone 14",        monto:195000, fecha:"11/05/2026",estado:"entregado" },
                { id:"#0475",repuesto:"Pantalla Samsung A54",      monto:145000, fecha:"10/05/2026",estado:"entregado" },
                { id:"#0469",repuesto:"Batería iPhone 13 ×2",      monto:184000, fecha:"06/05/2026",estado:"entregado" },
                { id:"#0462",repuesto:"Cámara Xiaomi 12T",         monto:78000,  fecha:"01/05/2026",estado:"devuelto"  },
              ].map((h,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #f0eee9" }}>
                  <span style={{ fontFamily:"monospace",fontSize:12,color:"#9c9a92",flexShrink:0 }}>{h.id}</span>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{h.repuesto}</div>
                    <div style={{ fontSize:11.5,color:"#9c9a92",marginTop:1 }}>{h.fecha}</div>
                  </div>
                  <div style={{ textAlign:"right",flexShrink:0 }}>
                    <div style={{ fontSize:13,fontFamily:"monospace",fontWeight:700,color:h.estado==="devuelto"?"#9c9a92":"#1a1916",textDecoration:h.estado==="devuelto"?"line-through":"none" }}>{fmtCOP(h.monto)}</div>
                    <div style={{ fontSize:11,fontWeight:600,color:h.estado==="entregado"?"#15803d":h.estado==="devuelto"?"#dc2626":"#2563eb",marginTop:2,textDecoration:"none" }}>{h.estado}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:14,padding:"10px 14px",background:"#f7f6f3",borderRadius:9,display:"flex",justifyContent:"space-between",fontSize:13.5,fontWeight:700 }}>
                <span>Total con este proveedor</span>
                <span style={{ fontFamily:"monospace" }}>{fmtCOP(prov.montoTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ModuloProveedores() {
  const [proveedores] = useState(PROVEEDORES_DATA);
  const [selected, setSelected] = useState(null);
  const [tabMain, setTabMain] = useState("lista");
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [showNuevo, setShowNuevo] = useState(false);
  const [comparadorIdx, setComparadorIdx] = useState(0);

  const filtered = useMemo(()=>{
    return proveedores.filter(p=>{
      const matchSearch = !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.ciudad.toLowerCase().includes(search.toLowerCase()) || p.contacto.toLowerCase().includes(search.toLowerCase());
      const matchEstado = filtroEstado==="todos" || p.estado===filtroEstado;
      return matchSearch && matchEstado;
    });
  },[proveedores,search,filtroEstado]);

  const comp = COMPARADOR_DATA[comparadorIdx];
  const minPrecio = Math.min(...comp.proveedores.map(p=>p.precio));

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif",background:"#f7f6f3",minHeight:"100vh",padding:24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* Header */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12 }}>
        <div>
          <div style={{ fontSize:20,fontWeight:700,letterSpacing:"-0.4px" }}>Proveedores</div>
          <div style={{ fontSize:13,color:"#6b6860",marginTop:3 }}>{proveedores.filter(p=>p.estado==="activo").length} activos · {proveedores.length} en total</div>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button style={{ padding:"7px 12px",background:"transparent",border:"1px solid #e2dfd8",borderRadius:8,fontSize:13,fontFamily:"inherit",cursor:"pointer",color:"#6b6860" }}>📥 Exportar</button>
          <button onClick={()=>setShowNuevo(true)}
            style={{ padding:"7px 14px",background:"#1a1916",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,fontFamily:"inherit",cursor:"pointer" }}>
            + Nuevo proveedor
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:20 }}>
        {[
          { label:"ACTIVOS",         val:proveedores.filter(p=>p.estado==="activo").length,                     icon:"✅",bg:"#dcfce7",c:"#15803d" },
          { label:"TOTAL PEDIDOS",   val:proveedores.reduce((a,b)=>a+b.pedidosTotales,0),                      icon:"📋",bg:"#dbeafe",c:"#2563eb" },
          { label:"MONTO TOTAL",     val:fmtCOP(proveedores.reduce((a,b)=>a+b.montoTotal,0)),                  icon:"💰",bg:"#dcfce7",c:"#15803d" },
          { label:"MEJOR RATING",    val:Math.max(...proveedores.map(p=>p.rating)).toFixed(1)+"⭐",            icon:"🏆",bg:"#fef3c7",c:"#d97706" },
        ].map(m=>(
          <div key={m.label} style={{ background:"#fff",border:"1px solid #e2dfd8",borderRadius:12,padding:"13px 14px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7 }}>
              <span style={{ fontSize:11,fontWeight:700,color:"#9c9a92",letterSpacing:".3px" }}>{m.label}</span>
              <div style={{ width:24,height:24,borderRadius:6,background:m.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12 }}>{m.icon}</div>
            </div>
            <div style={{ fontSize:20,fontWeight:700,fontFamily:"monospace",letterSpacing:"-0.5px" }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs principales */}
      <div style={{ display:"flex",gap:2,background:"#fff",border:"1px solid #e2dfd8",borderRadius:10,padding:4,marginBottom:18,width:"fit-content" }}>
        {[["lista","🏪 Proveedores"],["comparador","⚖️ Comparador de precios"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTabMain(id)}
            style={{ padding:"7px 16px",borderRadius:7,border:"none",fontSize:13.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",background:tabMain===id?"#1a1916":"transparent",color:tabMain===id?"#fff":"#6b6860",transition:"all .15s" }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ── LISTA ── */}
      {tabMain==="lista" && (
        <>
          {/* Formulario nuevo */}
          {showNuevo && (
            <div style={{ background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:12,padding:"16px 18px",marginBottom:16 }}>
              <div style={{ fontSize:13.5,fontWeight:700,marginBottom:12,color:"#0369a1" }}>➕ Nuevo proveedor</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12 }}>
                {[["Nombre *","text"],["Ciudad","text"],["Contacto","text"],["Teléfono","tel"],["Email","email"],["Tipo","select"]].map(([l,t])=>(
                  <div key={l}>
                    <label style={{ fontSize:11.5,fontWeight:600,color:"#6b6860",display:"block",marginBottom:4 }}>{l}</label>
                    {t==="select"
                      ? <select style={{ width:"100%",border:"1px solid #e2dfd8",borderRadius:8,padding:"7px 10px",fontSize:13,fontFamily:"inherit",outline:"none" }}>
                          <option>Mayorista</option><option>Distribuidor</option><option>Minorista</option>
                        </select>
                      : <input type={t} style={{ width:"100%",border:"1px solid #e2dfd8",borderRadius:8,padding:"7px 10px",fontSize:13,fontFamily:"inherit",outline:"none" }} />
                    }
                  </div>
                ))}
              </div>
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={()=>{alert("✅ Proveedor registrado.");setShowNuevo(false);}}
                  style={{ padding:"7px 14px",background:"#1a1916",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,fontFamily:"inherit",cursor:"pointer" }}>
                  Guardar
                </button>
                <button onClick={()=>setShowNuevo(false)}
                  style={{ padding:"7px 14px",background:"transparent",color:"#6b6860",border:"1px solid #e2dfd8",borderRadius:8,fontSize:13,fontFamily:"inherit",cursor:"pointer" }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
            <div style={{ position:"relative",flex:1,minWidth:200 }}>
              <span style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#9c9a92" }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar proveedor, ciudad, contacto…"
                style={{ width:"100%",background:"#fff",border:"1px solid #e2dfd8",borderRadius:8,padding:"7px 12px 7px 28px",fontSize:13,fontFamily:"inherit",outline:"none" }} />
            </div>
            <select value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}
              style={{ background:"#fff",border:"1px solid #e2dfd8",borderRadius:8,padding:"7px 28px 7px 10px",fontSize:13,fontFamily:"inherit",outline:"none",cursor:"pointer" }}>
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="pausado">Pausados</option>
            </select>
          </div>

          {/* Cards */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14 }}>
            {filtered.map(p=>(
              <div key={p.id} onClick={()=>setSelected(p)}
                style={{ background:"#fff",border:"1px solid #e2dfd8",borderRadius:14,padding:"18px 18px",cursor:"pointer",transition:"all .15s",opacity:p.estado==="pausado"?0.75:1 }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#1a1916";e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,.08)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2dfd8";e.currentTarget.style.boxShadow="none";}}
              >
                {/* Top */}
                <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12 }}>
                  <div style={{ width:40,height:40,borderRadius:10,background:"#f0eee9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>🏪</div>
                  <span style={{ padding:"2px 9px",borderRadius:99,fontSize:11.5,fontWeight:600,background:TIPO_CFG[p.estado].bg,color:TIPO_CFG[p.estado].color }}>{TIPO_CFG[p.estado].label}</span>
                </div>

                <div style={{ fontSize:15,fontWeight:700,letterSpacing:"-0.3px",marginBottom:2 }}>{p.nombre}</div>
                <div style={{ fontSize:12.5,color:"#9c9a92",marginBottom:10 }}>{p.tipo} · {p.ciudad}</div>

                <Stars rating={p.rating} />

                {/* Stats */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,margin:"12px 0",padding:"10px 0",borderTop:"1px solid #f0eee9",borderBottom:"1px solid #f0eee9" }}>
                  {[
                    { label:"Pedidos", val:p.pedidosTotales },
                    { label:"Monto",   val:fmtCOP(p.montoTotal) },
                    { label:"Entrega", val:p.tiempoEntrega },
                  ].map(s=>(
                    <div key={s.label} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:13.5,fontWeight:700,fontFamily:"monospace" }}>{s.val}</div>
                      <div style={{ fontSize:11,color:"#9c9a92",marginTop:1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Categorías */}
                <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginBottom:10 }}>
                  {p.categorias.slice(0,3).map(c=>(
                    <span key={c} style={{ padding:"2px 7px",borderRadius:99,background:"#f0eee9",fontSize:11,color:"#6b6860" }}>{c}</span>
                  ))}
                  {p.categorias.length>3 && <span style={{ fontSize:11,color:"#9c9a92",padding:"2px 0" }}>+{p.categorias.length-3} más</span>}
                </div>

                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12,color:"#9c9a92" }}>
                  <span>📞 {p.contacto}</span>
                  <span>📅 {p.ultimoPedido}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── COMPARADOR ── */}
      {tabMain==="comparador" && (
        <div>
          <div style={{ background:"#fff",border:"1px solid #e2dfd8",borderRadius:12,padding:"16px 18px",marginBottom:20 }}>
            <div style={{ fontSize:13.5,fontWeight:700,marginBottom:10 }}>Selecciona el repuesto a comparar</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {COMPARADOR_DATA.map((c,i)=>(
                <button key={i} onClick={()=>setComparadorIdx(i)}
                  style={{ padding:"8px 16px",borderRadius:8,border:comparadorIdx===i?"1.5px solid #1a1916":"1px solid #e2dfd8",background:comparadorIdx===i?"#1a1916":"transparent",color:comparadorIdx===i?"#fff":"#6b6860",fontSize:13,fontWeight:500,fontFamily:"inherit",cursor:"pointer",transition:"all .15s" }}>
                  {c.repuesto}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize:16,fontWeight:700,letterSpacing:"-0.3px",marginBottom:14 }}>
            Comparando: <span style={{ color:"#2563eb" }}>{comp.repuesto}</span>
          </div>

          {/* Tabla comparativa */}
          <div style={{ background:"#fff",border:"1px solid #e2dfd8",borderRadius:14,overflow:"hidden",marginBottom:20 }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#fafaf9" }}>
                    {["PROVEEDOR","PRECIO UNIT.","CALIDAD","ENTREGA","RATING","STOCK",""].map(h=>(
                      <th key={h} style={{ fontSize:11,fontWeight:700,color:"#9c9a92",textAlign:"left",padding:"10px 16px",borderBottom:"1px solid #e2dfd8",letterSpacing:".3px",whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comp.proveedores.map((p,i)=>{
                    const isBest = p.precio===minPrecio;
                    return (
                      <tr key={i} style={{ borderBottom:"1px solid #f0eee9",background:isBest?"#f0fdf4":"transparent" }}>
                        <td style={{ padding:"12px 16px" }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                            {isBest && <span style={{ padding:"1px 7px",borderRadius:99,background:"#15803d",color:"#fff",fontSize:10.5,fontWeight:700,flexShrink:0 }}>MEJOR</span>}
                            <span style={{ fontSize:13.5,fontWeight:600 }}>{p.nombre}</span>
                          </div>
                        </td>
                        <td style={{ padding:"12px 16px",fontSize:15,fontFamily:"monospace",fontWeight:700,color:isBest?"#15803d":"#1a1916" }}>{fmtCOP(p.precio)}</td>
                        <td style={{ padding:"12px 16px" }}>
                          <span style={{ padding:"2px 8px",borderRadius:99,fontSize:11.5,fontWeight:600,background:p.calidad==="Original"?"#dcfce7":p.calidad==="OEM"?"#dbeafe":"#f0eee9",color:p.calidad==="Original"?"#15803d":p.calidad==="OEM"?"#2563eb":"#6b6860" }}>{p.calidad}</span>
                        </td>
                        <td style={{ padding:"12px 16px",fontSize:13,color:"#6b6860" }}>🚚 {p.entrega}</td>
                        <td style={{ padding:"12px 16px" }}><Stars rating={p.rating} /></td>
                        <td style={{ padding:"12px 16px" }}>
                          <span style={{ fontSize:12,fontWeight:600,color:STOCK_CFG[p.stock]?.color }}>{STOCK_CFG[p.stock]?.label}</span>
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          <button onClick={()=>alert(`Proveedor seleccionado: ${p.nombre}\nPrecio: ${fmtCOP(p.precio)}\nSe asignará al pedido activo.`)}
                            style={{ padding:"5px 12px",borderRadius:7,border:isBest?"none":"1px solid #e2dfd8",background:isBest?"#15803d":"transparent",color:isBest?"#fff":"#6b6860",fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:"pointer" }}>
                            {isBest?"✅ Seleccionar":"Seleccionar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen comparativo */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12 }}>
            {[
              { label:"Ahorro máximo vs más caro", val:fmtCOP(Math.max(...comp.proveedores.map(p=>p.precio))-minPrecio), icon:"💸",bg:"#dcfce7",c:"#15803d" },
              { label:"Mejor tiempo de entrega",   val:comp.proveedores.sort((a,b)=>a.entrega.localeCompare(b.entrega))[0].entrega, icon:"🚀",bg:"#dbeafe",c:"#2563eb" },
              { label:"Mejor calificado",          val:comp.proveedores.sort((a,b)=>b.rating-a.rating)[0].nombre.split(" ")[0], icon:"⭐",bg:"#fef3c7",c:"#d97706" },
            ].map(m=>(
              <div key={m.label} style={{ background:"#fff",border:"1px solid #e2dfd8",borderRadius:12,padding:"14px 16px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:7 }}>
                  <span style={{ fontSize:12,fontWeight:600,color:"#6b6860" }}>{m.label}</span>
                  <div style={{ width:26,height:26,borderRadius:6,background:m.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }}>{m.icon}</div>
                </div>
                <div style={{ fontSize:18,fontWeight:700,letterSpacing:"-0.3px",fontFamily:"monospace" }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && <DetalleProveedor prov={selected} onClose={()=>setSelected(null)} />}
    </div>
  );
}
