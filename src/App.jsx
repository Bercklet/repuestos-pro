/**
 * RepuestosPRO — App.jsx FINAL
 * ─────────────────────────────────────────────────────────────────
 * Integra autenticación + todos los módulos en un solo punto de entrada.
 *
 * INSTALACIÓN:
 *   npx create-vite@latest repuestos-pro --template react
 *   cd repuestos-pro && npm install
 *
 * ESTRUCTURA DE ARCHIVOS:
 *   src/
 *   ├── App.jsx                   ← Este archivo
 *   ├── main.jsx                  ← Sin cambios
 *   └── modules/
 *       ├── AuthSystem.jsx
 *       ├── RepuestosPRO.jsx       (Dashboard + Cotizaciones + CrearPedido)
 *       ├── ModuloPedidos.jsx
 *       ├── ModuloRepuestos.jsx
 *       ├── ModuloProveedores.jsx
 *       └── PanelAdmin.jsx
 */

import { useState } from "react";

// ── Descomenta cuando tengas los archivos en su lugar ────────────────────────
import AuthSystem        from "./modules/AuthSystem";
import RepuestosPRO      from "./modules/RepuestosPRO";
import ModuloPedidos     from "./modules/ModuloPedidos";
import ModuloRepuestos   from "./modules/ModuloRepuestos";
import ModuloProveedores from "./modules/ModuloProveedores";
import PanelAdmin        from "./modules/PanelAdmin";

// ── Módulos reales importados arriba ─────────────────────────────────────────

function DemoAuth({ onAuth }) {
  const USERS = [
    { nombre:"Juan Martínez",  rol:"admin",      avatar:"JM", color:"#7c3aed", email:"admin@taller.com" },
    { nombre:"Ana García",     rol:"suministro", avatar:"AG", color:"#2563eb", email:"suministro@taller.com" },
    { nombre:"Carlos Ruiz",    rol:"tecnico",    avatar:"CR", color:"#15803d", email:"tecnico@taller.com" },
  ];
  const ROL_CFG = {
    admin:      { label:"Administrador", icon:"🛡️", bg:"#f5f3ff", c:"#7c3aed" },
    suministro: { label:"Suministro",    icon:"📦", bg:"#eff4ff", c:"#2563eb" },
    tecnico:    { label:"Técnico",       icon:"🔧", bg:"#f0fdf4", c:"#15803d" },
  };
  return (
    <div style={{ minHeight:"100vh",background:"#f7f6f3",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{ width:"100%",maxWidth:420,background:"#fff",borderRadius:20,border:"1px solid #e2dfd8",boxShadow:"0 20px 60px rgba(0,0,0,.08)",padding:"36px" }}>
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <div style={{ width:52,height:52,background:"#1a1916",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 14px" }}>🔩</div>
          <div style={{ fontSize:22,fontWeight:700,letterSpacing:"-0.5px",marginBottom:4 }}>RepuestosPRO</div>
          <div style={{ fontSize:14,color:"#9c9a92" }}>Selecciona un usuario para entrar</div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {USERS.map(u=>(
            <button key={u.email} onClick={()=>onAuth(u)}
              style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#fff",border:"1px solid #e2dfd8",borderRadius:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all .15s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#1a1916";e.currentTarget.style.background="#f7f6f3";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2dfd8";e.currentTarget.style.background="#fff";}}>
              <div style={{ width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${u.color}88,${u.color})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0 }}>{u.avatar}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14,fontWeight:600 }}>{u.nombre}</div>
                <div style={{ fontSize:12,color:"#9c9a92",marginTop:1 }}>{ROL_CFG[u.rol].label} · {u.email}</div>
              </div>
              <div style={{ padding:"3px 10px",borderRadius:99,background:ROL_CFG[u.rol].bg,fontSize:12,fontWeight:600,color:ROL_CFG[u.rol].c,flexShrink:0 }}>{ROL_CFG[u.rol].icon}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModPlaceholder({ icon, name, color, desc }) {
  return (
    <div style={{ padding:40,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400,gap:12,textAlign:"center",fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ width:56,height:56,borderRadius:14,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:20,fontWeight:700,letterSpacing:"-0.3px" }}>{name}</div>
      <div style={{ fontSize:14,color:"#6b6860",maxWidth:340,lineHeight:1.6 }}>{desc}</div>
      <div style={{ padding:"6px 14px",background:color+"12",border:`1px solid ${color}30`,borderRadius:8,fontSize:12.5,color,fontWeight:600,marginTop:4 }}>✅ Módulo implementado — importa el .jsx correspondiente</div>
    </div>
  );
}

// ─── NAVIGATION CONFIG ────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard",    label:"Dashboard",      icon:"⊞",  group:"Principal",  badge:null, roles:["admin","suministro","tecnico"] },
  { id:"pedidos",      label:"Pedidos",        icon:"🛒", group:"Principal",  badge:8,    badgeColor:"#dc2626", roles:["admin","suministro","tecnico"] },
  { id:"cotizaciones", label:"Cotizaciones",   icon:"📋", group:"Principal",  badge:null, roles:["admin","suministro"] },
  { id:"repuestos",    label:"Repuestos",      icon:"🔧", group:"Principal",  badge:null, roles:["admin","suministro","tecnico"] },
  { id:"devoluciones", label:"Devoluciones",   icon:"↩",  group:"Gestión",    badge:3,    badgeColor:"#d97706", roles:["admin","suministro"] },
  { id:"proveedores",  label:"Proveedores",    icon:"🏪", group:"Gestión",    badge:null, roles:["admin","suministro"] },
  { id:"reportes",     label:"Reportes",       icon:"📊", group:"Gestión",    badge:null, roles:["admin","suministro"] },
  { id:"auditoria",    label:"Auditoría",      icon:"🕐", group:"Sistema",    badge:null, roles:["admin"] },
  { id:"usuarios",     label:"Usuarios",       icon:"👥", group:"Sistema",    badge:null, roles:["admin"] },
  { id:"config",       label:"Configuración",  icon:"⚙️", group:"Sistema",    badge:null, roles:["admin"] },
];

const ROUTE_MAP = {
  dashboard:    RepuestosPRO,
  pedidos:      ModuloPedidos,
  cotizaciones: RepuestosPRO,
  repuestos:    ModuloRepuestos,
  devoluciones: () => <ModPlaceholder icon="↩" name="Devoluciones" color="#dc2626" desc="Historial completo de devoluciones con trazabilidad y descuentos automáticos" />,
  proveedores:  ModuloProveedores,
  reportes:     PanelAdmin,
  auditoria:    PanelAdmin,
  usuarios:     PanelAdmin,
  config:       PanelAdmin,
};

const ROL_CFG_FULL = {
  admin:      { label:"Administrador", color:"#7c3aed" },
  suministro: { label:"Suministro",    color:"#2563eb" },
  tecnico:    { label:"Técnico",       color:"#15803d" },
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, user }) {
  const userRol  = user?.rol || "tecnico";
  const visibleNav = NAV.filter(n => n.roles.includes(userRol));
  const groups   = [...new Set(visibleNav.map(n => n.group))];

  return (
    <aside style={{ width:220,background:"#fff",borderRight:"1px solid #e2dfd8",display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto" }}>
      <div style={{ padding:"18px 16px 14px",display:"flex",alignItems:"center",gap:9,borderBottom:"1px solid #e2dfd8" }}>
        <div style={{ width:30,height:30,background:"#1a1916",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
          <span style={{ color:"#fff",fontSize:15 }}>🔩</span>
        </div>
        <div>
          <div style={{ fontSize:13.5,fontWeight:700,letterSpacing:"-0.3px" }}>RepuestosPRO</div>
          <div style={{ fontSize:10.5,color:"#9c9a92" }}>Taller Técnico</div>
        </div>
      </div>

      <div style={{ padding:"10px 10px 8px",flex:1 }}>
        {groups.map(group=>(
          <div key={group} style={{ marginBottom:4 }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#9c9a92",letterSpacing:".8px",textTransform:"uppercase",padding:"8px 8px 2px" }}>{group}</div>
            {visibleNav.filter(n=>n.group===group).map(item=>{
              const isActive = active===item.id;
              return (
                <div key={item.id} onClick={()=>setActive(item.id)}
                  style={{ display:"flex",alignItems:"center",gap:9,padding:"7px 8px",borderRadius:7,cursor:"pointer",fontSize:13,fontWeight:isActive?500:400,marginBottom:1,background:isActive?"#1a1916":"transparent",color:isActive?"#fff":"#6b6860",transition:"all .15s" }}
                  onMouseEnter={e=>{ if(!isActive){e.currentTarget.style.background="#f0eee9";e.currentTarget.style.color="#1a1916";}}}
                  onMouseLeave={e=>{ if(!isActive){e.currentTarget.style.background="transparent";e.currentTarget.style.color="#6b6860";}}}
                >
                  <span style={{ fontSize:15,width:18,textAlign:"center",flexShrink:0 }}>{item.icon}</span>
                  <span style={{ flex:1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ background:item.badgeColor||"#dc2626",color:"#fff",fontSize:10,fontWeight:700,padding:"0 5px",borderRadius:99,lineHeight:"16px" }}>{item.badge}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* User section */}
      {user && (
        <div style={{ padding:10,borderTop:"1px solid #e2dfd8" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 8px",borderRadius:8,cursor:"pointer",transition:"background .15s" }}
            onMouseEnter={e=>e.currentTarget.style.background="#f0eee9"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <div style={{ width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${ROL_CFG_FULL[user.rol]?.color}88,${ROL_CFG_FULL[user.rol]?.color})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0 }}>
              {user.avatar}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12.5,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user.nombre}</div>
              <div style={{ fontSize:11,color:"#9c9a92" }}>{ROL_CFG_FULL[user.rol]?.label}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ activeLabel, user, onLogout, onNew }) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header style={{ background:"#fff",borderBottom:"1px solid #e2dfd8",padding:"0 24px",height:54,display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:40,flexShrink:0 }}>
      <div style={{ position:"relative",flex:1,maxWidth:360 }}>
        <span style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#9c9a92" }}>🔍</span>
        <input placeholder={`Buscar en ${activeLabel}…`}
          style={{ width:"100%",background:"#f0eee9",border:"1px solid #e2dfd8",borderRadius:8,padding:"6px 12px 6px 30px",fontSize:13,fontFamily:"'DM Sans',inherit",color:"#1a1916",outline:"none" }} />
      </div>
      <div style={{ display:"flex",gap:8,marginLeft:"auto",alignItems:"center" }}>
        {/* Notificaciones */}
        <div style={{ position:"relative" }}>
          <button onClick={()=>setNotifOpen(!notifOpen)}
            style={{ width:33,height:33,borderRadius:8,border:"1px solid #e2dfd8",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:15,position:"relative" }}>
            🔔
            <span style={{ position:"absolute",top:6,right:6,width:6,height:6,background:"#dc2626",borderRadius:"50%",border:"1.5px solid #fff" }} />
          </button>
          {notifOpen && (
            <div style={{ position:"absolute",top:"calc(100% + 6px)",right:0,width:300,background:"#fff",border:"1px solid #e2dfd8",borderRadius:12,boxShadow:"0 8px 24px rgba(0,0,0,.1)",overflow:"hidden",zIndex:200 }}>
              <div style={{ padding:"11px 14px",borderBottom:"1px solid #e2dfd8",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:13.5,fontWeight:700 }}>Notificaciones</span>
                <span style={{ fontSize:11.5,color:"#2563eb",cursor:"pointer",fontWeight:500 }}>Marcar leídas</span>
              </div>
              {[
                { icon:"⚠️",txt:"3 pedidos pendientes sin respuesta",time:"12m",bg:"#fffbeb" },
                { icon:"📦",txt:"Pedido #0479 entregado por TechParts",time:"1h",bg:"#f0fdf4" },
                { icon:"↩️",txt:"Devolución #DEV-001 confirmada",time:"3h",bg:"#fff1f1" },
                { icon:"💰",txt:"Precio actualizado: Pantalla A79 5G",time:"5h",bg:"#eff4ff" },
              ].map((n,i)=>(
                <div key={i} style={{ display:"flex",gap:10,padding:"10px 14px",background:n.bg,borderBottom:"1px solid #f0eee9",cursor:"pointer" }}>
                  <span style={{ fontSize:16,flexShrink:0 }}>{n.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,lineHeight:1.4 }}>{n.txt}</div>
                    <div style={{ fontSize:11,color:"#9c9a92",marginTop:2 }}>Hace {n.time}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding:"8px 14px",textAlign:"center" }}>
                <span style={{ fontSize:12.5,color:"#2563eb",cursor:"pointer",fontWeight:500 }}>Ver todas las notificaciones</span>
              </div>
            </div>
          )}
        </div>

        {user?.rol !== "tecnico" && (
          <button onClick={onNew}
            style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,fontSize:13,fontWeight:600,background:"#1a1916",color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit" }}>
            + Nuevo pedido
          </button>
        )}

        {/* Logout */}
        <button onClick={onLogout}
          style={{ width:33,height:33,borderRadius:8,border:"1px solid #e2dfd8",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:"#9c9a92" }}
          title="Cerrar sesión">
          🚪
        </button>
      </div>
    </header>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]     = useState(null);
  const [active, setActive] = useState("dashboard");

  const handleAuth  = (u) => setUser(u);
  const handleLogout = () => { setUser(null); setActive("dashboard"); };

  const visibleNav = NAV.filter(n => n.roles.includes(user?.rol || "tecnico"));
  const activeLabel = NAV.find(n => n.id === active)?.label || "Dashboard";
  const Component   = ROUTE_MAP[active] || RepuestosPRO;

  if (!user) {
    return <AuthSystem onAuthenticated={handleAuth} />;
  }

  return (
    <div style={{ display:"flex",height:"100vh",background:"#f7f6f3",fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d3cfc6; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #9c9a92; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          .sidebar-wrap { display: none !important; }
        }
      `}</style>

      {/* Sidebar */}
      <div className="sidebar-wrap" style={{ display:"flex" }}>
        <Sidebar active={active} setActive={setActive} user={user} />
      </div>

      {/* Main */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <Topbar
          activeLabel={activeLabel}
          user={user}
          onLogout={handleLogout}
          onNew={() => setActive("pedidos")}
        />
        <div style={{ flex:1,overflowY:"auto" }}>
          <Component user={user} onNavigate={setActive} />
        </div>
      </div>
    </div>
  );
}
