// src/modules/ModuloRepuestos.jsx
// Catálogo de repuestos en tiempo real — sin datos mock
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRepuestos, useComparador } from '../hooks/useData';
import { fmtCOP, tiempoRelativo } from '../lib/supabase';

const CATEGORIAS = ['Display', 'Batería', 'Conector', 'Cámara', 'Flex', 'Tapa trasera', 'Otros'];
const CALIDADES  = ['Original', 'OEM', 'Genérico', 'Recuperado'];
const STOCKS     = {
  disponible: { label: 'Disponible', bg: '#dcfce7', color: '#15803d' },
  bajo:       { label: 'Stock bajo', bg: '#fef3c7', color: '#d97706' },
  agotado:    { label: 'Agotado',    bg: '#fee2e2', color: '#dc2626' },
};

function Badge({ cfg }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// Gráfico de precios histórico inline (SVG puro)
function GraficoPrecios({ historial }) {
  if (!historial?.length) return <div style={{ fontSize: 12, color: '#9c9a92', textAlign: 'center', padding: '12px 0' }}>Sin historial de precios</div>;
  const datos = historial.slice(-6);
  const max = Math.max(...datos.map(d => d.precio));
  const min = Math.min(...datos.map(d => d.precio));
  const rng = max - min || 1;
  const W = 280, H = 60, PAD = 8;
  const pts = datos.map((d, i) => ({
    x: PAD + (i / Math.max(datos.length - 1, 1)) * (W - PAD * 2),
    y: H - PAD - ((d.precio - min) / rng) * (H - PAD * 2),
    precio: d.precio,
    mes: d.mes,
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <div>
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        <path d={path} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill="#2563eb" />
            <text x={p.x} y={H - 1} textAnchor="middle" fontSize={9} fill="#9c9a92">{p.mes}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: '#9c9a92' }}>
        <span style={{ color: '#dc2626' }}>Mín: {fmtCOP(min)}</span>
        <span style={{ color: '#15803d' }}>Máx: {fmtCOP(max)}</span>
      </div>
    </div>
  );
}

// Panel detalle de repuesto
function DetalleRepuesto({ repuesto, onClose, onActualizarPrecio, puedeEditar }) {
  const { comparador } = useComparador(repuesto.id);
  const [nuevoPrecio, setNuevoPrecio] = useState(repuesto.precio_actual || 0);
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState('');
  const [guardado, setGuardado]       = useState(false);

  const guardarPrecio = async () => {
    const p = Number(nuevoPrecio);
    if (!p || p === repuesto.precio_actual) return;
    setGuardando(true); setError('');
    try {
      await onActualizarPrecio(repuesto.id, p);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const stockCfg = STOCKS[repuesto.stock] || STOCKS.disponible;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}
      onClick={onClose}>
      <div style={{ background: '#fff', width: 440, maxWidth: '95vw', height: '100vh', overflowY: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,.12)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2dfd8', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{repuesto.nombre}</div>
            <div style={{ fontSize: 12, color: '#9c9a92', marginTop: 2 }}>{repuesto.marca} · {repuesto.modelo}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9c9a92' }}>×</button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'PRECIO ACTUAL', val: fmtCOP(repuesto.precio_actual), c: '#1a1916' },
              { label: 'SOLICITUDES',   val: repuesto.solicitudes,           c: '#2563eb' },
              { label: 'STOCK',         val: <Badge cfg={stockCfg} />,        c: null },
            ].map(s => (
              <div key={s.label} style={{ background: '#f7f6f3', borderRadius: 9, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#9c9a92', fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.c || 'inherit' }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Tags */}
          {repuesto.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {repuesto.tags.map(t => (
                <span key={t} style={{ padding: '2px 9px', background: '#f0eee9', borderRadius: 99, fontSize: 11.5, color: '#6b6860' }}>{t}</span>
              ))}
            </div>
          )}

          {/* Historial precios */}
          <div style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>📈 Historial de precios</div>
            <GraficoPrecios historial={repuesto.historial} />
          </div>

          {/* Comparador proveedores */}
          {comparador.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>🏪 Comparador de precios</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {comparador.map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: i === 0 ? '#f0fdf4' : '#f7f6f3', border: i === 0 ? '1px solid #bbf7d0' : '1px solid transparent' }}>
                    {i === 0 && <span style={{ fontSize: 10, background: '#15803d', color: '#fff', padding: '1px 6px', borderRadius: 99, fontWeight: 600 }}>MEJOR</span>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{c.proveedor?.nombre}</div>
                      <div style={{ fontSize: 11, color: '#9c9a92' }}>{c.calidad} · {c.tiempo_entrega}</div>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: i === 0 ? '#15803d' : '#1a1916' }}>
                      {fmtCOP(c.precio)}
                    </div>
                    <Badge cfg={STOCKS[c.stock] || STOCKS.disponible} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editar precio (solo suministro/admin) */}
          {puedeEditar && (
            <div style={{ background: '#f7f6f3', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>✏️ Actualizar precio</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" value={nuevoPrecio} onChange={e => setNuevoPrecio(e.target.value)}
                  style={{ flex: 1, border: '1.5px solid #e2dfd8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                <button onClick={guardarPrecio} disabled={guardando}
                  style={{ padding: '8px 14px', background: guardado ? '#15803d' : '#1a1916', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {guardado ? '✓ Guardado' : guardando ? 'Guardando…' : 'Actualizar'}
                </button>
              </div>
              {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>⚠ {error}</div>}
              <div style={{ fontSize: 11, color: '#9c9a92', marginTop: 6 }}>
                El cambio se registrará en el historial y se notificará al equipo en tiempo real.
              </div>
            </div>
          )}

          {/* Proveedor principal */}
          {repuesto.proveedor && (
            <div style={{ background: '#eff4ff', border: '1px solid #bfdbfe', borderRadius: 9, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, marginBottom: 3 }}>PROVEEDOR PRINCIPAL</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{repuesto.proveedor.nombre}</div>
              <div style={{ fontSize: 11.5, color: '#6b6860' }}>{repuesto.proveedor.ciudad} · ⭐ {repuesto.proveedor.rating}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MÓDULO REPUESTOS ─────────────────────────────────────────
export default function ModuloRepuestos() {
  const { esSuministro } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroStock, setFiltroStock]         = useState('todos');
  const [selected, setSelected]               = useState(null);

  // Debounce búsqueda 300ms
  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounced(busqueda), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const { repuestos, loading, error, actualizarPrecio, crearRepuesto } = useRepuestos({ busqueda: busquedaDebounced });

  const filtered = useMemo(() => {
    return repuestos.filter(r => {
      const matchCat   = filtroCategoria === 'todas' || r.categoria === filtroCategoria;
      const matchStock = filtroStock === 'todos'     || r.stock === filtroStock;
      return matchCat && matchStock;
    });
  }, [repuestos, filtroCategoria, filtroStock]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e2dfd8', borderTopColor: '#1a1916', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 14, color: '#9c9a92' }}>Cargando catálogo…</div>
      </div>
    </div>
  );

  if (error) return <div style={{ padding: 24, color: '#dc2626' }}>⚠️ {error}</div>;

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f7f6f3', minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>Catálogo de Repuestos</div>
            <div style={{ fontSize: 13, color: '#6b6860', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              {filtered.length} repuestos
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#15803d' }} />
                Tiempo real
              </span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9c9a92' }}>🔍</span>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar repuesto, marca, modelo, tag…"
              style={{ width: '100%', background: '#f7f6f3', border: '1px solid #e2dfd8', borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
            style={{ background: '#f7f6f3', border: '1px solid #e2dfd8', borderRadius: 8, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
            <option value="todas">Todas las categorías</option>
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filtroStock} onChange={e => setFiltroStock(e.target.value)}
            style={{ background: '#f7f6f3', border: '1px solid #e2dfd8', borderRadius: 8, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
            <option value="todos">Todos los stocks</option>
            {Object.entries(STOCKS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9c9a92' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
            <div>No se encontraron repuestos</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map(r => {
              const stockCfg  = STOCKS[r.stock] || STOCKS.disponible;
              const variacion = r.precio_max > 0
                ? ((r.precio_actual - r.precio_min) / (r.precio_max - r.precio_min) * 100).toFixed(0)
                : 0;
              return (
                <div key={r.id} onClick={() => setSelected(r)}
                  style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color .15s, box-shadow .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a1916'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2dfd8'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0eee9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, marginBottom: 2 }}>{r.nombre}</div>
                        <div style={{ fontSize: 11.5, color: '#9c9a92' }}>{r.marca} · {r.categoria} · {r.calidad}</div>
                      </div>
                      <Badge cfg={stockCfg} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>{fmtCOP(r.precio_actual)}</div>
                      {r.precio_min !== r.precio_max && (
                        <div style={{ fontSize: 11.5, color: '#9c9a92' }}>
                          {fmtCOP(r.precio_min)} – {fmtCOP(r.precio_max)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#6b6860' }}>
                      <span style={{ fontWeight: 600 }}>{r.solicitudes}</span> solicitudes
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9c9a92' }}>
                      {r.proveedor?.nombre || 'Sin proveedor'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <DetalleRepuesto
          repuesto={selected}
          onClose={() => setSelected(null)}
          onActualizarPrecio={actualizarPrecio}
          puedeEditar={esSuministro}
        />
      )}
    </div>
  );
}
