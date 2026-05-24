// src/modules/RepuestosPRO.jsx
// Dashboard principal en tiempo real
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDashboardStats, usePedidos, useRepuestos } from '../hooks/useData';
import { fmtCOP, fmtNumPedido, tiempoRelativo } from '../lib/supabase';
import ModalNuevoPedido from './ModalNuevoPedido';

const ESTADO_CFG = {
  pendiente:   { label:'Pendiente',   bg:'#fef3c7', color:'#d97706', dot:'#d97706' },
  pedido:      { label:'Pedido',      bg:'#dbeafe', color:'#2563eb', dot:'#2563eb' },
  entregado:   { label:'Entregado',   bg:'#dcfce7', color:'#15803d', dot:'#15803d' },
  devuelto:    { label:'Devuelto',    bg:'#fee2e2', color:'#dc2626', dot:'#dc2626' },
  no_consigue: { label:'No consigue', bg:'#f4f3f0', color:'#9c9a92', dot:'#9c9a92' },
};

const PRIO_CFG = {
  urgente: { label:'Urgente', bg:'#fee2e2', color:'#dc2626' },
  alta:    { label:'Alta',    bg:'#fef3c7', color:'#d97706' },
  normal:  { label:'Normal',  bg:'#f4f3f0', color:'#9c9a92' },
};


function Badge({ cfg }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      {cfg.dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />}
      {cfg.label}
    </span>
  );
}

// Gráfico de barras simple para el dashboard
function ChartBars({ data, valueKey, labelKey, color = '#2563eb' }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 9, color: '#9c9a92', fontFamily: 'monospace' }}>
            {d[valueKey] >= 1000 ? `${(d[valueKey] / 1000).toFixed(0)}k` : d[valueKey]}
          </div>
          <div style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0', height: Math.max((d[valueKey] / max) * 60, 3) }} />
          <div style={{ fontSize: 9, color: '#9c9a92', textAlign: 'center' }}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
}

// ─── DASHBOARD PRINCIPAL ──────────────────────────────────────
export default function RepuestosPRO({ onNavigate }) {
  const { perfil, esSuministro } = useAuth();
  const { stats, actividad, loading: loadingStats } = useDashboardStats();
  const { pedidos, loading: loadingPedidos, crearPedido, actualizarEstado } = usePedidos();
  const { repuestos, loading: loadingReps } = useRepuestos();

  const [activeTab, setActiveTab]   = useState('dashboard');
  const [modalNuevo, setModalNuevo] = useState(false);

  // Pedidos recientes para el dashboard (últimos 5)
  const pedidosRecientes = pedidos.slice(0, 5);

  // Top repuestos (por solicitudes)
  const topRepuestos = useMemo(() =>
    [...repuestos].sort((a, b) => b.solicitudes - a.solicitudes).slice(0, 5),
    [repuestos]
  );

  // Datos para gráfico: pedidos por semana (últimas 4 semanas)
  const chartData = useMemo(() => {
    const now = Date.now();
    const semanas = [3, 2, 1, 0].map(n => {
      const inicio = now - (n + 1) * 7 * 24 * 3600 * 1000;
      const fin    = now - n * 7 * 24 * 3600 * 1000;
      const cnt    = pedidos.filter(p => {
        const t = new Date(p.created_at).getTime();
        return t >= inicio && t < fin;
      }).length;
      return { sem: n === 0 ? 'Esta sem.' : `Sem ${4 - n}`, val: cnt };
    });
    return semanas;
  }, [pedidos]);

  const loading = loadingStats || loadingPedidos || loadingReps;


  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e2dfd8', borderTopColor: '#1a1916', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <div style={{ fontSize: 14, color: '#9c9a92' }}>Conectando a la base de datos…</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f7f6f3', minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div style={{ padding: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>
              Buenos días, {perfil?.nombre?.split(' ')[0] || 'usuario'} 👋
            </div>
            <div style={{ fontSize: 13, color: '#6b6860', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
              Dashboard en tiempo real
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '1px 8px', borderRadius: 99, fontWeight: 600 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#15803d', animation: 'pulse 2s infinite' }} />
                LIVE
              </span>
            </div>
          </div>
          <button onClick={() => setModalNuevo(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', background: '#1a1916', color: '#fff', border: 'none', cursor: 'pointer' }}>
            + Nuevo pedido
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'PEDIDOS HOY',   val: pedidos.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length, icon: '📋', bg: '#dbeafe', c: '#2563eb', onClick: () => onNavigate?.('pedidos') },
            { label: 'PENDIENTES',    val: stats?.pendientes || 0,  icon: '⏳', bg: '#fef3c7', c: '#d97706', onClick: () => onNavigate?.('pedidos') },
            { label: 'URGENTES',      val: stats?.urgentes || 0,    icon: '🚨', bg: '#fee2e2', c: '#dc2626', onClick: () => onNavigate?.('pedidos') },
            { label: 'TOTAL PEDIDOS', val: stats?.total || 0,       icon: '📦', bg: '#ede9fe', c: '#7c3aed', onClick: () => onNavigate?.('pedidos') },
            { label: 'GASTO REAL',    val: fmtCOP(stats?.gastoTotal || 0), icon: '💰', bg: '#dcfce7', c: '#15803d', onClick: null },
          ].map(k => (
            <div key={k.label} onClick={k.onClick}
              style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 14, padding: '14px 16px', cursor: k.onClick ? 'pointer' : 'default', transition: 'border-color .15s' }}
              onMouseEnter={e => { if (k.onClick) e.currentTarget.style.borderColor = '#1a1916'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2dfd8'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9c9a92', letterSpacing: '.3px' }}>{k.label}</span>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{k.icon}</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: k.c, letterSpacing: '-0.5px', fontFamily: 'monospace' }}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* Contenido: 2 columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
          {/* Columna izquierda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Pedidos recientes */}
            <div style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '13px 18px 11px', borderBottom: '1px solid #e2dfd8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>🛒 Pedidos recientes</div>
                <span onClick={() => onNavigate?.('pedidos')} style={{ fontSize: 12.5, color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>Ver todos →</span>
              </div>
              <div>
                {pedidosRecientes.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#9c9a92', fontSize: 13 }}>
                    No hay pedidos aún. ¡Crea el primero!
                  </div>
                ) : pedidosRecientes.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: i < pedidosRecientes.length - 1 ? '1px solid #f0eee9' : 'none' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: p.tecnico?.color || '#e2dfd8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {p.tecnico?.avatar || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.repuesto}</div>
                      <div style={{ fontSize: 11.5, color: '#9c9a92', marginTop: 1 }}>
                        {fmtNumPedido(p.numero)} · {p.tecnico?.nombre || '—'} · {tiempoRelativo(p.created_at)}
                      </div>
                    </div>
                    <Badge cfg={PRIO_CFG[p.prioridad] || PRIO_CFG.normal} />
                    <Badge cfg={ESTADO_CFG[p.estado] || ESTADO_CFG.pendiente} />
                    {p.unitario ? <span style={{ fontSize: 12.5, fontFamily: 'monospace', fontWeight: 600, flexShrink: 0 }}>{fmtCOP(p.unitario)}</span> : null}
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico de pedidos por semana */}
            {chartData.some(d => d.val > 0) && (
              <div style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>📊 Pedidos por semana</div>
                <ChartBars data={chartData} valueKey="val" labelKey="sem" color="#2563eb" />
              </div>
            )}
          </div>

          {/* Columna derecha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Actividad reciente */}
            <div style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '13px 18px 11px', borderBottom: '1px solid #e2dfd8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>⚡ Actividad en vivo</div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#15803d', animation: 'pulse 2s infinite' }} />LIVE
                </span>
              </div>
              <div>
                {actividad.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#9c9a92', fontSize: 13 }}>Sin actividad reciente</div>
                ) : actividad.slice(0, 6).map((a, i) => (
                  <div key={a.id} style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: i < Math.min(actividad.length, 6) - 1 ? '1px solid #f0eee9' : 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f0eee9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                      {a.tipo === 'crear' ? '🛒' : a.tipo === 'estado' ? '🔄' : a.tipo === 'editar' ? '✏️' : a.tipo === 'devolucion' ? '↩️' : '💬'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3 }}>{a.accion}</div>
                      {a.detalle && <div style={{ fontSize: 11.5, color: '#9c9a92', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.detalle}</div>}
                      <div style={{ fontSize: 11, color: '#9c9a92', marginTop: 2 }}>
                        {a.usuario?.nombre || 'Sistema'} · {tiempoRelativo(a.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top repuestos */}
            {topRepuestos.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '13px 18px 11px', borderBottom: '1px solid #e2dfd8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>🔧 Más solicitados</div>
                  <span onClick={() => onNavigate?.('repuestos')} style={{ fontSize: 12.5, color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>Ver catálogo →</span>
                </div>
                <div style={{ padding: '8px 16px 12px' }}>
                  {topRepuestos.map((r, i) => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topRepuestos.length - 1 ? '1px solid #f7f6f3' : 'none' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f0eee9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#6b6860', flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nombre}</div>
                        <div style={{ fontSize: 11, color: '#9c9a92' }}>{r.categoria} · {r.calidad}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>{r.solicitudes}</span>
                        <div style={{ width: 50, height: 3, background: '#f0eee9', borderRadius: 99 }}>
                          <div style={{ height: '100%', background: '#2563eb', borderRadius: 99, width: `${(r.solicitudes / (topRepuestos[0]?.solicitudes || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accesos rápidos */}
            <div style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>⚡ Accesos rápidos</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: '🛒', label: 'Nuevo pedido',     action: () => setModalNuevo(true) },
                  { icon: '🔧', label: 'Ver catálogo',     action: () => onNavigate?.('repuestos') },
                  { icon: '🏪', label: 'Proveedores',      action: () => onNavigate?.('proveedores') },
                  ...(esSuministro ? [{ icon: '📊', label: 'Reportes', action: () => onNavigate?.('reportes') }] : []),
                ].map(a => (
                  <button key={a.label} onClick={a.action}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: '1px solid #e2dfd8', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: '#1a1916', transition: 'all .15s', textAlign: 'left' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f7f6f3'; e.currentTarget.style.borderColor = '#1a1916'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2dfd8'; }}>
                    <span style={{ fontSize: 16 }}>{a.icon}</span>
                    <span>{a.label}</span>
                    <span style={{ marginLeft: 'auto', color: '#9c9a92' }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal nuevo pedido — componente compartido con autocompletado completo */}
      {modalNuevo && (
        <ModalNuevoPedido
          onClose={() => setModalNuevo(false)}
          onCrear={crearPedido}
        />
      )}
    </div>
  );
}
