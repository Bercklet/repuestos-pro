// src/App.jsx
// App root: maneja sesión, sidebar, topbar y routing — 100% conectado a Supabase
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import { useNotificaciones } from './hooks/useNotificaciones';
import { tiempoRelativo } from './lib/supabase';

import AuthSystem        from './modules/AuthSystem';
import RepuestosPRO      from './modules/RepuestosPRO';
import ModuloPedidos     from './modules/ModuloPedidos';
import ModuloRepuestos   from './modules/ModuloRepuestos';
import ModuloProveedores from './modules/ModuloProveedores';
import PanelAdmin        from './modules/PanelAdmin';

// ─── NAVIGATION CONFIG ────────────────────────────────────────
const NAV = [
  { id: 'dashboard',    label: 'Dashboard',      icon: '⊞',  group: 'Principal', roles: ['admin', 'suministro', 'tecnico'] },
  { id: 'pedidos',      label: 'Pedidos',        icon: '🛒', group: 'Principal', roles: ['admin', 'suministro', 'tecnico'] },
  { id: 'repuestos',    label: 'Repuestos',      icon: '🔧', group: 'Principal', roles: ['admin', 'suministro', 'tecnico'] },
  { id: 'proveedores',  label: 'Proveedores',    icon: '🏪', group: 'Gestión',   roles: ['admin', 'suministro'] },
  { id: 'reportes',     label: 'Reportes',       icon: '📊', group: 'Gestión',   roles: ['admin', 'suministro'] },
  { id: 'auditoria',    label: 'Auditoría',      icon: '🕐', group: 'Sistema',   roles: ['admin', 'suministro'] },
  { id: 'usuarios',     label: 'Usuarios',       icon: '👥', group: 'Sistema',   roles: ['admin'] },
];

const ROL_CFG = {
  admin:      { label: 'Administrador', color: '#7c3aed' },
  suministro: { label: 'Suministro',    color: '#2563eb' },
  tecnico:    { label: 'Técnico',       color: '#15803d' },
};

// ─── SIDEBAR ──────────────────────────────────────────────────
function Sidebar({ active, setActive, perfil }) {
  const rol = perfil?.rol || 'tecnico';
  const visible = NAV.filter(n => n.roles.includes(rol));
  const groups  = [...new Set(visible.map(n => n.group))];

  return (
    <aside style={{ width: 220, background: '#fff', borderRight: '1px solid #e2dfd8', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'center', gap: 9, borderBottom: '1px solid #e2dfd8' }}>
        <div style={{ width: 30, height: 30, background: '#1a1916', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: 15 }}>🔩</span>
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.3px' }}>RepuestosPRO</div>
          <div style={{ fontSize: 10.5, color: '#9c9a92' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#15803d', display: 'inline-block' }} />
              Tiempo real
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 10px 8px', flex: 1 }}>
        {groups.map(group => (
          <div key={group} style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9c9a92', letterSpacing: '.8px', textTransform: 'uppercase', padding: '8px 8px 2px' }}>{group}</div>
            {visible.filter(n => n.group === group).map(item => {
              const isActive = active === item.id;
              return (
                <div key={item.id} onClick={() => setActive(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 500 : 400, marginBottom: 1, background: isActive ? '#1a1916' : 'transparent', color: isActive ? '#fff' : '#6b6860', transition: 'all .15s' }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#f0eee9'; e.currentTarget.style.color = '#1a1916'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b6860'; } }}>
                  <span style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* User info */}
      {perfil && (
        <div style={{ padding: 10, borderTop: '1px solid #e2dfd8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px', borderRadius: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: perfil.color || '#e2dfd8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {perfil.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perfil.nombre}</div>
              <div style={{ fontSize: 11, color: '#9c9a92' }}>{ROL_CFG[perfil.rol]?.label || perfil.rol}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── TOPBAR CON NOTIFICACIONES REALTIME ──────────────────────
function Topbar({ activeLabel, perfil, onLogout, onNew }) {
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones(perfil?.id);
  const [notifOpen, setNotifOpen] = useState(false);

  const TIPO_ICONS = {
    pedido: '📦', precio: '💰', devolucion: '↩️', usuario: '👤', sistema: '⚙️', alerta: '⚠️',
  };

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #e2dfd8', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 40, flexShrink: 0 }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9c9a92' }}>🔍</span>
        <input placeholder={`Buscar en ${activeLabel}…`}
          style={{ width: '100%', background: '#f0eee9', border: '1px solid #e2dfd8', borderRadius: 8, padding: '6px 12px 6px 30px', fontSize: 13, fontFamily: "'DM Sans',inherit", color: '#1a1916', outline: 'none' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
        {/* Notificaciones realtime */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setNotifOpen(!notifOpen)}
            style={{ width: 33, height: 33, borderRadius: 8, border: '1px solid #e2dfd8', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, position: 'relative' }}>
            🔔
            {noLeidas > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, background: '#dc2626', borderRadius: 99, border: '1.5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', padding: '0 3px' }}>
                {noLeidas > 9 ? '9+' : noLeidas}
              </span>
            )}
          </button>
          {notifOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 320, background: '#fff', border: '1px solid #e2dfd8', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.1)', overflow: 'hidden', zIndex: 200 }}>
              <div style={{ padding: '11px 14px', borderBottom: '1px solid #e2dfd8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13.5, fontWeight: 700 }}>Notificaciones {noLeidas > 0 && <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: 99 }}>{noLeidas}</span>}</span>
                {noLeidas > 0 && <span onClick={marcarTodasLeidas} style={{ fontSize: 11.5, color: '#2563eb', cursor: 'pointer', fontWeight: 500 }}>Marcar leídas</span>}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notificaciones.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9c9a92', fontSize: 13 }}>Sin notificaciones</div>
                ) : notificaciones.slice(0, 8).map(n => (
                  <div key={n.id} onClick={() => marcarLeida(n.id)}
                    style={{ display: 'flex', gap: 10, padding: '10px 14px', background: n.leida ? '#fff' : '#fafaf9', borderBottom: '1px solid #f0eee9', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f7f6f3'}
                    onMouseLeave={e => e.currentTarget.style.background = n.leida ? '#fff' : '#fafaf9'}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{TIPO_ICONS[n.tipo] || '🔔'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: n.leida ? 400 : 600, lineHeight: 1.3 }}>{n.titulo}</div>
                      <div style={{ fontSize: 11.5, color: '#6b6860', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.mensaje}</div>
                      <div style={{ fontSize: 11, color: '#9c9a92', marginTop: 2 }}>{tiempoRelativo(n.created_at)}</div>
                    </div>
                    {!n.leida && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', flexShrink: 0, marginTop: 4 }} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {perfil?.rol !== 'tecnico' ? null : null}
        <button onClick={onNew}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#1a1916', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          + Nuevo pedido
        </button>

        <button onClick={onLogout}
          style={{ width: 33, height: 33, borderRadius: 8, border: '1px solid #e2dfd8', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: '#9c9a92' }}
          title="Cerrar sesión">
          🚪
        </button>
      </div>
    </header>
  );
}

// ─── ROUTING ──────────────────────────────────────────────────
function getComponent(active) {
  switch (active) {
    case 'dashboard':   return RepuestosPRO;
    case 'pedidos':     return ModuloPedidos;
    case 'repuestos':   return ModuloRepuestos;
    case 'proveedores': return ModuloProveedores;
    case 'reportes':    return (props) => <PanelAdmin {...props} tab="reportes" />;
    case 'auditoria':   return (props) => <PanelAdmin {...props} tab="auditoria" />;
    case 'usuarios':    return (props) => <PanelAdmin {...props} tab="usuarios" />;
    default:            return RepuestosPRO;
  }
}

// ─── LOADING SCREEN CON AUTO-LIMPIEZA ────────────────────────
function LoadingScreen() {
  const [tardando, setTardando] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTardando(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const limpiarSesion = () => {
    // Limpiar todo el storage de Supabase
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('sb-')) localStorage.removeItem(k);
    });
    Object.keys(sessionStorage).forEach(k => {
      if (k.startsWith('sb-')) sessionStorage.removeItem(k);
    });
    // Forzar recarga completa
    window.location.href = window.location.href;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f3', fontFamily: "'DM Sans', system-ui" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, background: '#1a1916', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 14px' }}>🔩</div>
        <div style={{ width: 32, height: 32, border: '3px solid #e2dfd8', borderTopColor: '#1a1916', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 14, color: '#9c9a92' }}>Verificando sesión…</div>
        {tardando && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, color: '#9c9a92', marginBottom: 10 }}>
              ¿Tardando demasiado?
            </div>
            <button onClick={limpiarSesion}
              style={{ padding: '8px 16px', background: '#1a1916', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              🔄 Limpiar sesión y reiniciar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APP INNER (necesita AuthContext) ─────────────────────────
function AppInner() {
  const { perfil, loading, logout } = useAuth();
  const [active, setActive] = useState('dashboard');

  // Pantalla de carga inicial
  if (loading) return <LoadingScreen />;

  // Sin sesión → login
  if (!perfil) return <AuthSystem />;

  // Verificar que el rol tenga acceso al tab activo
  const activeNav = NAV.find(n => n.id === active);
  if (activeNav && !activeNav.roles.includes(perfil.rol)) {
    // Redirigir al dashboard si no tiene acceso
    setActive('dashboard');
    return null;
  }

  const activeLabel = NAV.find(n => n.id === active)?.label || 'Dashboard';
  const Component   = getComponent(active);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f7f6f3', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d3cfc6; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #9c9a92; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) { .sidebar-wrap { display: none !important; } }
      `}</style>

      <div className="sidebar-wrap" style={{ display: 'flex' }}>
        <Sidebar active={active} setActive={setActive} perfil={perfil} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar
          activeLabel={activeLabel}
          perfil={perfil}
          onLogout={logout}
          onNew={() => setActive('pedidos')}
        />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Component user={perfil} perfil={perfil} onNavigate={setActive} />
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
