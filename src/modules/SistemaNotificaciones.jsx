import { useState, useEffect, useRef } from "react";

// ─── TIPOS DE NOTIFICACIÓN ────────────────────────────────────────────────────
const NOTIF_TIPOS = {
  pedido_nuevo:    { icon: "🛒", color: "#2563eb", bg: "#eff4ff",  label: "Nuevo pedido"     },
  pedido_urgente:  { icon: "🔴", color: "#dc2626", bg: "#fff1f1",  label: "Urgente"          },
  precio_cambio:   { icon: "💰", color: "#15803d", bg: "#f0fdf4",  label: "Precio"           },
  estado_cambio:   { icon: "🔄", color: "#7c3aed", bg: "#f5f3ff",  label: "Estado"           },
  entrega:         { icon: "📦", color: "#15803d", bg: "#f0fdf4",  label: "Entrega"          },
  devolucion:      { icon: "↩️", color: "#dc2626", bg: "#fff1f1",  label: "Devolución"       },
  sin_stock:       { icon: "🚫", color: "#d97706", bg: "#fffbeb",  label: "Sin stock"        },
  comentario:      { icon: "💬", color: "#6b6860", bg: "#f7f6f3",  label: "Comentario"       },
  sistema:         { icon: "⚙️", color: "#9c9a92", bg: "#f7f6f3",  label: "Sistema"          },
};

// ─── DATOS INICIALES ──────────────────────────────────────────────────────────
const NOTIFICACIONES_INIT = [
  { id: 1,  tipo: "pedido_urgente", titulo: "Pedido urgente creado",          body: "Carlos Ruiz solicitó Pantalla Oppo A79 5G con prioridad URGENTE.",  tiempo: "Hace 5min",  leida: false, pedido: "#0481", user: "Carlos Ruiz"    },
  { id: 2,  tipo: "precio_cambio",  titulo: "Precio actualizado",              body: "Pantalla Samsung A54: $158.000 → $145.000 por TechParts Colombia.", tiempo: "Hace 20min", leida: false, pedido: "#0475", user: "Ana García"     },
  { id: 3,  tipo: "entrega",        titulo: "Pedido entregado",                body: "Conector carga iPhone 14 × 3 entregado correctamente.",             tiempo: "Hace 1h",    leida: false, pedido: "#0479", user: "Sistema"        },
  { id: 4,  tipo: "devolucion",     titulo: "Devolución registrada",           body: "Pantalla Huawei Y9s devuelta. Motivo: Defecto de fabricación.",     tiempo: "Hace 3h",    leida: true,  pedido: "#0477", user: "Ana García"     },
  { id: 5,  tipo: "sin_stock",      titulo: "Repuesto sin stock",              body: "Flex cámara Xiaomi 12T marcado como 'No se consigue' × 2 prov.",   tiempo: "Hace 3h",    leida: true,  pedido: "#0478", user: "Sistema"        },
  { id: 6,  tipo: "pedido_nuevo",   titulo: "Nueva solicitud de repuesto",     body: "Ana García creó pedido de Batería Samsung S23.",                    tiempo: "Hace 5h",    leida: true,  pedido: "#0480", user: "Ana García"     },
  { id: 7,  tipo: "comentario",     titulo: "Nuevo comentario en pedido",      body: "Luis Pérez comentó en #0476: 'Cliente espera desde el lunes'.",     tiempo: "Hace 6h",    leida: true,  pedido: "#0476", user: "Luis Pérez"     },
  { id: 8,  tipo: "estado_cambio",  titulo: "Estado de pedido cambiado",       body: "#0473 cambió de 'Pedido' a 'Entregado'.",                           tiempo: "Ayer 16:30", leida: true,  pedido: "#0473", user: "Ana García"     },
  { id: 9,  tipo: "precio_cambio",  titulo: "Precio cotizado asignado",        body: "Batería iPhone 13 cotizada en $92.000 por DistriMovil SAS.",        tiempo: "Ayer 14:00", leida: true,  pedido: "#0476", user: "Ana García"     },
  { id: 10, tipo: "sistema",        titulo: "Respaldo automático completado",  body: "Copia de seguridad del sistema realizada exitosamente.",             tiempo: "Ayer 03:00", leida: true,  pedido: null,    user: "Sistema"        },
];

const COMENTARIOS_GLOBALES = [
  {
    id: 1, pedido: "#0481", repuesto: "Pantalla Oppo A79 5G",
    comentarios: [
      { id: 1, user: "Carlos Ruiz",    rol: "Técnico",    avatar: "CR", color: "#15803d", texto: "Necesito esto urgente, el cliente viene hoy a las 3pm.", tiempo: "Hace 2h",   tipo: "normal" },
      { id: 2, user: "Ana García",     rol: "Suministro", avatar: "AG", color: "#2563eb", texto: "Consultando con TechParts. Tienen en stock a $115.000.", tiempo: "Hace 1h",   tipo: "normal" },
      { id: 3, user: "Carlos Ruiz",    rol: "Técnico",    avatar: "CR", color: "#15803d", texto: "Perfecto. ¿Puede llegar antes de las 2pm?",              tiempo: "Hace 45min",tipo: "normal" },
      { id: 4, user: "Ana García",     rol: "Suministro", avatar: "AG", color: "#2563eb", texto: "Confirmado. Mensajero sale en 20 minutos.",               tiempo: "Hace 10min",tipo: "confirmacion" },
    ],
  },
  {
    id: 2, pedido: "#0480", repuesto: "Batería Samsung S23",
    comentarios: [
      { id: 1, user: "Ana García",     rol: "Suministro", avatar: "AG", color: "#2563eb", texto: "Revisando disponibilidad con proveedores.", tiempo: "Hace 3h",  tipo: "normal" },
      { id: 2, user: "Juan Martínez",  rol: "Admin",      avatar: "JM", color: "#7c3aed", texto: "Priorizar este pedido, cliente VIP.",       tiempo: "Hace 2h",  tipo: "alerta" },
    ],
  },
];

const fmtCOP = (n) => n ? "$" + Math.round(n).toLocaleString("es-CO") : "—";

// ─── HOOK: TIEMPO REAL SIMULADO ───────────────────────────────────────────────
function useNotificacionesRT(notificaciones, setNotificaciones) {
  const timerRef = useRef(null);

  useEffect(() => {
    const NUEVAS = [
      { tipo: "pedido_nuevo",   titulo: "Nueva solicitud",        body: "María Soto solicitó Cámara Samsung A54.",              pedido: "#0482", user: "María Soto"   },
      { tipo: "pedido_urgente", titulo: "¡Urgente!",              body: "Luis Pérez marcó Flex iPhone 14 como URGENTE.",        pedido: "#0483", user: "Luis Pérez"   },
      { tipo: "entrega",        titulo: "Entrega confirmada",      body: "Batería Xiaomi 12T entregada en taller.",              pedido: "#0476", user: "Sistema"      },
      { tipo: "precio_cambio",  titulo: "Precio modificado",      body: "Repuestos Global actualizó precio Pantalla Y9s.",      pedido: "#0477", user: "Ana García"   },
    ];

    let idx = 0;
    timerRef.current = setInterval(() => {
      const nueva = NUEVAS[idx % NUEVAS.length];
      const notif = {
        ...nueva,
        id: Date.now(),
        tiempo: "Ahora mismo",
        leida: false,
      };
      setNotificaciones(prev => [notif, ...prev]);
      idx++;
    }, 18000); // cada 18 segundos

    return () => clearInterval(timerRef.current);
  }, []);
}

// ─── COMPONENTE: TOAST ────────────────────────────────────────────────────────
function Toast({ notif, onClose }) {
  const tipo = NOTIF_TIPOS[notif.tipo] || NOTIF_TIPOS.sistema;

  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "13px 14px", background: "#fff",
      border: `1px solid ${tipo.color}30`,
      borderLeft: `3px solid ${tipo.color}`,
      borderRadius: 12, marginBottom: 10,
      boxShadow: "0 8px 24px rgba(0,0,0,.12)",
      animation: "toastIn .3s ease",
      cursor: "pointer", maxWidth: 340,
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: tipo.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
        {tipo.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{notif.titulo}</div>
        <div style={{ fontSize: 12.5, color: "#6b6860", lineHeight: 1.4 }}>{notif.body}</div>
        {notif.pedido && (
          <div style={{ fontSize: 12, color: tipo.color, fontWeight: 600, marginTop: 4, fontFamily: "monospace" }}>{notif.pedido}</div>
        )}
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#9c9a92", flexShrink: 0, padding: 0, lineHeight: 1 }}>×</button>
    </div>
  );
}

// ─── PANEL NOTIFICACIONES ─────────────────────────────────────────────────────
function PanelNotificaciones({ notificaciones, setNotificaciones, onClose }) {
  const [filtro, setFiltro] = useState("todas");
  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const marcarTodas = () => setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  const marcarUna   = (id) => setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  const eliminar    = (id) => setNotificaciones(prev => prev.filter(n => n.id !== id));

  const filtered = notificaciones.filter(n => {
    if (filtro === "no_leidas") return !n.leida;
    if (filtro === "urgentes")  return n.tipo === "pedido_urgente" || n.tipo === "devolucion";
    return true;
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.3)", zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: "min(380px,100%)", height: "100%", background: "#fff", borderLeft: "1px solid #e2dfd8", display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,.1)" }}>

        {/* Header */}
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #e2dfd8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              Notificaciones
              {noLeidas > 0 && <span style={{ background: "#dc2626", color: "#fff", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 99 }}>{noLeidas}</span>}
            </div>
            <div style={{ fontSize: 12, color: "#9c9a92", marginTop: 1 }}>Centro de actividad del sistema</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {noLeidas > 0 && <button onClick={marcarTodas} style={{ fontSize: 12.5, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Marcar leídas</button>}
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e2dfd8", background: "transparent", cursor: "pointer", fontSize: 14, color: "#9c9a92" }}>×</button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 2, padding: "10px 12px", background: "#f7f6f3", borderBottom: "1px solid #e2dfd8" }}>
          {[["todas","Todas"],["no_leidas","Sin leer"],["urgentes","Urgentes"]].map(([v,l]) => (
            <button key={v} onClick={() => setFiltro(v)}
              style={{ flex: 1, padding: "5px 8px", borderRadius: 7, border: "none", fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: filtro === v ? "#fff" : "transparent", color: filtro === v ? "#1a1916" : "#6b6860", boxShadow: filtro === v ? "0 1px 3px rgba(0,0,0,.06)" : "none", transition: "all .15s" }}>
              {l}{v === "no_leidas" && noLeidas > 0 ? ` (${noLeidas})` : ""}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9c9a92" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Sin notificaciones</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Todo está al día</div>
            </div>
          ) : filtered.map(n => {
            const tipo = NOTIF_TIPOS[n.tipo] || NOTIF_TIPOS.sistema;
            return (
              <div key={n.id} onClick={() => marcarUna(n.id)}
                style={{ padding: "12px 16px", borderBottom: "1px solid #f0eee9", background: n.leida ? "#fff" : "#fafbff", cursor: "pointer", transition: "background .1s", display: "flex", gap: 12, alignItems: "flex-start" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f7f6f3"}
                onMouseLeave={e => e.currentTarget.style.background = n.leida ? "#fff" : "#fafbff"}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: tipo.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, position: "relative" }}>
                  {tipo.icon}
                  {!n.leida && <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, background: "#2563eb", borderRadius: "50%", border: "1.5px solid #fff" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                    <div style={{ fontSize: 13.5, fontWeight: n.leida ? 400 : 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.titulo}</div>
                    <span style={{ fontSize: 11, color: "#9c9a92", flexShrink: 0 }}>{n.tiempo}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#6b6860", lineHeight: 1.4, marginBottom: 4 }}>{n.body}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ padding: "1px 7px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: tipo.bg, color: tipo.color }}>{tipo.label}</span>
                    {n.pedido && <span style={{ fontSize: 11.5, color: "#9c9a92", fontFamily: "monospace" }}>{n.pedido}</span>}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); eliminar(n.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#d3cfc6", flexShrink: 0, padding: "2px 0" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#dc2626"}
                  onMouseLeave={e => e.currentTarget.style.color = "#d3cfc6"}>
                  ×
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #e2dfd8", textAlign: "center" }}>
          <button style={{ fontSize: 13, color: "#9c9a92", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Ver historial completo de actividad →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SISTEMA DE COMENTARIOS POR PEDIDO ───────────────────────────────────────
function SistemaComentarios({ pedidoId, pedidoNombre, currentUser = { nombre: "Juan Martínez", rol: "Administrador", avatar: "JM", color: "#7c3aed" } }) {
  const hilo = COMENTARIOS_GLOBALES.find(c => c.pedido === pedidoId) || { comentarios: [] };
  const [comentarios, setComentarios] = useState(hilo.comentarios);
  const [texto, setTexto]             = useState("");
  const [tipo, setTipo]               = useState("normal");
  const [enviando, setEnviando]       = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [comentarios]);

  const enviar = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    await new Promise(r => setTimeout(r, 400));
    const nuevo = {
      id: Date.now(),
      user: currentUser.nombre,
      rol: currentUser.rol,
      avatar: currentUser.avatar,
      color: currentUser.color,
      texto: texto.trim(),
      tiempo: "Ahora mismo",
      tipo,
    };
    setComentarios(prev => [...prev, nuevo]);
    setTexto("");
    setEnviando(false);
  };

  const TIPO_COM = {
    normal:       { label: "Normal",        bg: "#f7f6f3", border: "#e2dfd8", bubbleBg: "#f0eee9" },
    alerta:       { label: "⚠ Alerta",      bg: "#fffbeb", border: "#fef3c7", bubbleBg: "#fef3c7" },
    confirmacion: { label: "✅ Confirmación",bg: "#f0fdf4", border: "#bbf7d0", bubbleBg: "#dcfce7" },
    interno:      { label: "🔒 Interno",     bg: "#eff4ff", border: "#bfdbfe", bubbleBg: "#dbeafe" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* Header */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2dfd8", background: "#fff" }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>💬 Comentarios internos</div>
        <div style={{ fontSize: 12, color: "#9c9a92", marginTop: 2 }}>{pedidoId} · {pedidoNombre}</div>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
        {comentarios.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#9c9a92" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Sin comentarios aún</div>
            <div style={{ fontSize: 12.5, marginTop: 4 }}>Escribe el primero para coordinar el pedido</div>
          </div>
        ) : comentarios.map((c, i) => {
          const tc = TIPO_COM[c.tipo] || TIPO_COM.normal;
          const isMe = c.user === currentUser.nombre;
          return (
            <div key={c.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 10, marginBottom: 14, alignItems: "flex-start" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${c.color}88,${c.color})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {c.avatar}
              </div>
              <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexDirection: isMe ? "row-reverse" : "row" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{isMe ? "Tú" : c.user}</span>
                  <span style={{ padding: "1px 6px", borderRadius: 99, fontSize: 10.5, fontWeight: 500, background: "#f0eee9", color: "#6b6860" }}>{c.rol}</span>
                  <span style={{ fontSize: 11, color: "#9c9a92" }}>{c.tiempo}</span>
                </div>
                <div style={{ padding: "9px 12px", borderRadius: isMe ? "12px 2px 12px 12px" : "2px 12px 12px 12px", background: isMe ? "#1a1916" : tc.bubbleBg, color: isMe ? "#fff" : "#1a1916", fontSize: 13.5, lineHeight: 1.5, border: isMe ? "none" : `1px solid ${tc.border}` }}>
                  {c.texto}
                </div>
                {c.tipo !== "normal" && (
                  <div style={{ fontSize: 11, color: "#9c9a92", marginTop: 3, padding: "1px 7px", borderRadius: 99, background: tc.bg, border: `1px solid ${tc.border}` }}>
                    {TIPO_COM[c.tipo]?.label}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #e2dfd8", background: "#fff" }}>
        {/* Tipo de comentario */}
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {Object.entries(TIPO_COM).map(([key, val]) => (
            <button key={key} onClick={() => setTipo(key)}
              style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", border: tipo === key ? "none" : "1px solid #e2dfd8", background: tipo === key ? "#1a1916" : "transparent", color: tipo === key ? "#fff" : "#6b6860", transition: "all .15s" }}>
              {val.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
            placeholder="Escribe un comentario interno… (Enter para enviar)"
            style={{ flex: 1, border: "1px solid #e2dfd8", borderRadius: 10, padding: "8px 11px", fontSize: 13.5, fontFamily: "inherit", outline: "none", resize: "none", minHeight: 60, lineHeight: 1.5, transition: "border-color .15s" }}
            onFocus={e => e.target.style.borderColor = "#1a1916"}
            onBlur={e => e.target.style.borderColor = "#e2dfd8"}
          />
          <button onClick={enviar} disabled={!texto.trim() || enviando}
            style={{ width: 44, borderRadius: 10, border: "none", background: texto.trim() && !enviando ? "#1a1916" : "#e2dfd8", color: "#fff", fontSize: 18, cursor: texto.trim() && !enviando ? "pointer" : "not-allowed", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {enviando ? "⏳" : "➤"}
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: "#9c9a92", marginTop: 5 }}>Shift+Enter para nueva línea · Solo visible para el equipo interno</div>
      </div>
    </div>
  );
}

// ─── FEED DE ACTIVIDAD GLOBAL ─────────────────────────────────────────────────
function FeedActividad() {
  const ACTIVIDADES = [
    { icon:"📦",bg:"#dcfce7",user:"Ana García",    rol:"Suministro",accion:"entregó el pedido",     target:"#0479 Conector iPhone 14",     tiempo:"Hace 12min" },
    { icon:"✏️",bg:"#dbeafe",user:"Ana García",    rol:"Suministro",accion:"actualizó el precio",   target:"Pantalla Oppo A79: $120k→$115k",tiempo:"Hace 1h"    },
    { icon:"↩️",bg:"#fee2e2",user:"Ana García",    rol:"Suministro",accion:"registró devolución",   target:"Pantalla Huawei Y9s · −$110k",  tiempo:"Hace 3h"    },
    { icon:"🛒",bg:"#fef3c7",user:"Carlos Ruiz",   rol:"Técnico",   accion:"creó solicitud",        target:"Batería Samsung S23 · Normal",  tiempo:"Hace 5h"    },
    { icon:"🔄",bg:"#ede9fe",user:"Ana García",    rol:"Suministro",accion:"cambió estado",         target:"#0473: Pedido → Entregado",     tiempo:"Ayer 16:30" },
    { icon:"👤",bg:"#fef3c7",user:"Juan Martínez", rol:"Admin",     accion:"creó usuario",          target:"Pedro Herrera · Suministro",    tiempo:"Ayer 10:00" },
    { icon:"💬",bg:"#f7f6f3",user:"Luis Pérez",    rol:"Técnico",   accion:"comentó en",            target:"Pedido #0476",                  tiempo:"Ayer 09:30" },
    { icon:"🏪",bg:"#f0eee9",user:"Ana García",    rol:"Suministro",accion:"registró proveedor",    target:"DistriMovil SAS",               tiempo:"Hace 2 días"},
    { icon:"⚠️",bg:"#fff7ed",user:"Sistema",       rol:"Automático",accion:"detectó intento",       target:"Acceso denegado sin permiso",   tiempo:"Hace 3 días"},
    { icon:"💰",bg:"#dcfce7",user:"Ana García",    rol:"Suministro",accion:"aprobó cotización",     target:"#COT-0238 · $48.000",           tiempo:"Hace 3 días"},
  ];

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px" }}>Actividad del sistema</div>
          <div style={{ fontSize: 13, color: "#6b6860", marginTop: 3 }}>Registro completo de todas las acciones</div>
        </div>
        <button style={{ padding: "7px 14px", background: "transparent", border: "1px solid #e2dfd8", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer", color: "#6b6860" }}>📥 Exportar log</button>
      </div>

      {/* Timeline */}
      <div style={{ background: "#fff", border: "1px solid #e2dfd8", borderRadius: 14, overflow: "hidden" }}>
        {ACTIVIDADES.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderBottom: i < ACTIVIDADES.length - 1 ? "1px solid #f0eee9" : "none", transition: "background .1s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#fafaf9"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ width: 34, height: 34, borderRadius: 9, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{a.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, lineHeight: 1.4 }}>
                <strong>{a.user}</strong>
                <span style={{ color: "#6b6860" }}> {a.accion} </span>
                <span style={{ fontWeight: 500 }}>{a.target}</span>
              </div>
              <span style={{ fontSize: 11.5, padding: "1px 6px", borderRadius: 99, background: "#f0eee9", color: "#6b6860", fontWeight: 500 }}>{a.rol}</span>
            </div>
            <span style={{ fontSize: 12, color: "#9c9a92", flexShrink: 0, whiteSpace: "nowrap" }}>{a.tiempo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DEMO COMPLETO ────────────────────────────────────────────────────────────
export default function SistemaNotificaciones() {
  const [notificaciones, setNotificaciones] = useState(NOTIFICACIONES_INIT);
  const [panelOpen, setPanelOpen]           = useState(false);
  const [toasts, setToasts]                 = useState([]);
  const [vista, setVista]                   = useState("feed");
  const noLeidas = notificaciones.filter(n => !n.leida).length;

  // Simular notificaciones en tiempo real
  useNotificacionesRT(notificaciones, (actualizarFn) => {
    setNotificaciones(actualizarFn);
    // También mostrar toast
    setToasts(prev => [...prev.slice(-2), { id: Date.now(), ...actualizarFn([]).at(-1) }]);
  });

  // RT simplificado para esta demo
  useEffect(() => {
    const t = setTimeout(() => {
      const nueva = {
        id: Date.now(),
        tipo: "pedido_urgente",
        titulo: "¡Nuevo pedido urgente!",
        body: "María Soto solicitó Pantalla Samsung A55 con prioridad URGENTE.",
        tiempo: "Ahora mismo",
        leida: false,
        pedido: "#0484",
        user: "María Soto",
      };
      setNotificaciones(prev => [nueva, ...prev]);
      setToasts(prev => [...prev, nueva]);
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", background: "#f7f6f3", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      {/* Topbar demo */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2dfd8", padding: "0 24px", height: 54, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 28, height: 28, background: "#1a1916", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔩</div>
          <span style={{ fontSize: 14, fontWeight: 700 }}>RepuestosPRO</span>
        </div>

        <div style={{ display: "flex", gap: 4, marginLeft: 20, background: "#f0eee9", borderRadius: 8, padding: 3 }}>
          {[["feed","📋 Feed"],["comentarios","💬 Comentarios"]].map(([v,l]) => (
            <button key={v} onClick={() => setVista(v)}
              style={{ padding: "5px 12px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: vista === v ? "#fff" : "transparent", color: vista === v ? "#1a1916" : "#6b6860", boxShadow: vista === v ? "0 1px 3px rgba(0,0,0,.06)" : "none" }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 12.5, color: "#9c9a92" }}>
            <span style={{ display: "inline-block", width: 7, height: 7, background: "#15803d", borderRadius: "50%", marginRight: 5, animation: "pulse 2s infinite" }} />
            Tiempo real activo
          </div>
          <button onClick={() => setPanelOpen(true)}
            style={{ position: "relative", width: 36, height: 36, borderRadius: 9, border: "1px solid #e2dfd8", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 17 }}>
            🔔
            {noLeidas > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, padding: "0 5px", borderRadius: 99, lineHeight: "16px", minWidth: 16, textAlign: "center" }}>
                {noLeidas}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Contenido */}
      {vista === "feed" && <FeedActividad />}
      {vista === "comentarios" && (
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Sistema de comentarios internos</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 16 }}>
            {COMENTARIOS_GLOBALES.map(hilo => (
              <div key={hilo.id} style={{ background: "#fff", border: "1px solid #e2dfd8", borderRadius: 14, overflow: "hidden", height: 460, display: "flex", flexDirection: "column" }}>
                <SistemaComentarios pedidoId={hilo.pedido} pedidoNombre={hilo.comentarios[0]?.texto?.slice(0,30) + "…" || "Pedido"} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panel notificaciones */}
      {panelOpen && (
        <PanelNotificaciones
          notificaciones={notificaciones}
          setNotificaciones={setNotificaciones}
          onClose={() => setPanelOpen(false)}
        />
      )}

      {/* Toasts */}
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 500 }}>
        {toasts.map(t => (
          <Toast key={t.id} notif={t} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
}

// ─── EXPORTS INDIVIDUALES ─────────────────────────────────────────────────────
export { PanelNotificaciones, SistemaComentarios, FeedActividad, Toast, NOTIF_TIPOS };
