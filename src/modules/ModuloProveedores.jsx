// src/modules/ModuloProveedores.jsx
// Proveedores en tiempo real — sin datos mock
import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProveedores } from '../hooks/useData';
import { fmtCOP, tiempoRelativo } from '../lib/supabase';

const TIPO_CFG = {
  Mayorista:    { bg: '#ede9fe', color: '#7c3aed' },
  Distribuidor: { bg: '#dbeafe', color: '#2563eb' },
  Minorista:    { bg: '#dcfce7', color: '#15803d' },
};

const ESTADO_CFG = {
  activo:   { label: 'Activo',   bg: '#dcfce7', color: '#15803d', dot: '#15803d' },
  pausado:  { label: 'Pausado',  bg: '#fef3c7', color: '#d97706', dot: '#d97706' },
  inactivo: { label: 'Inactivo', bg: '#fee2e2', color: '#dc2626', dot: '#dc2626' },
};

const STOCK_CFG = {
  disponible: { label: 'Disponible', color: '#15803d' },
  bajo:       { label: 'Stock bajo', color: '#d97706' },
  agotado:    { label: 'Agotado',    color: '#dc2626' },
};

function Badge({ cfg }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      {cfg.dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />}
      {cfg.label}
    </span>
  );
}

function Stars({ rating }) {
  const full = Math.round(rating);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      <span style={{ fontSize: 12, color: '#6b6860', marginLeft: 4 }}>{rating?.toFixed(1)}</span>
    </div>
  );
}

// ─── MODAL NUEVO / EDITAR PROVEEDOR ──────────────────────────
function ModalProveedor({ proveedor, onClose, onGuardar }) {
  const esNuevo = !proveedor;
  const [form, setForm] = useState({
    nombre: proveedor?.nombre || '',
    tipo: proveedor?.tipo || 'Mayorista',
    ciudad: proveedor?.ciudad || '',
    contacto: proveedor?.contacto || '',
    telefono: proveedor?.telefono || '',
    email: proveedor?.email || '',
    comentario: proveedor?.comentario || '',
    categorias: proveedor?.categorias || [],
    estado: proveedor?.estado || 'activo',
    precios_competitivos: proveedor?.precios_competitivos ?? true,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState('');

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setGuardando(true); setError('');
    try {
      await onGuardar(form, proveedor?.id);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const CATS = ['Display', 'Batería', 'Conector', 'Cámara', 'Flex', 'Tapa trasera'];

  const InputF = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', border: '1.5px solid #e2dfd8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{esNuevo ? '+ Nuevo proveedor' : 'Editar proveedor'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9c9a92' }}>×</button>
        </div>

        <InputF label="NOMBRE *" value={form.nombre} onChange={v => set('nombre', v)} placeholder="TechParts Colombia" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 4 }}>TIPO</label>
            <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
              style={{ width: '100%', border: '1.5px solid #e2dfd8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
              {['Mayorista', 'Distribuidor', 'Minorista'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <InputF label="CIUDAD" value={form.ciudad} onChange={v => set('ciudad', v)} placeholder="Bogotá" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <InputF label="CONTACTO" value={form.contacto} onChange={v => set('contacto', v)} placeholder="Nombre" />
          <InputF label="TELÉFONO" value={form.telefono} onChange={v => set('telefono', v)} placeholder="+57 300..." />
        </div>
        <InputF label="EMAIL" type="email" value={form.email} onChange={v => set('email', v)} placeholder="ventas@proveedor.co" />

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 6 }}>CATEGORÍAS</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATS.map(cat => {
              const sel = form.categorias.includes(cat);
              return (
                <button key={cat} onClick={() => set('categorias', sel ? form.categorias.filter(c => c !== cat) : [...form.categorias, cat])}
                  style={{ padding: '4px 10px', borderRadius: 99, border: `1.5px solid ${sel ? '#1a1916' : '#e2dfd8'}`, background: sel ? '#1a1916' : '#fff', color: sel ? '#fff' : '#6b6860', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 4 }}>COMENTARIO</label>
          <textarea value={form.comentario} onChange={e => set('comentario', e.target.value)} rows={2}
            style={{ width: '100%', border: '1.5px solid #e2dfd8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none' }} />
        </div>

        {error && <div style={{ padding: '8px 12px', background: '#fff1f1', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 12 }}>⚠ {error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', background: '#f0eee9', color: '#6b6860', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            style={{ flex: 2, padding: '9px', background: '#1a1916', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {guardando ? 'Guardando…' : esNuevo ? '+ Crear proveedor' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DETALLE PROVEEDOR ────────────────────────────────────────
function DetalleProveedor({ proveedor, onClose, onEditar, puedeEditar }) {
  const pedidosTotales = proveedor.pedidos?.length || 0;
  const montoTotal     = proveedor.pedidos?.reduce((a, p) => a + (p.unitario * p.cantidad || 0), 0) || 0;
  const devueltos      = proveedor.pedidos?.filter(p => p.devueltos > 0).length || 0;
  const ultimoPedido   = proveedor.pedidos?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  const estadoCfg      = ESTADO_CFG[proveedor.estado] || ESTADO_CFG.activo;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}
      onClick={onClose}>
      <div style={{ background: '#fff', width: 460, maxWidth: '95vw', height: '100vh', overflowY: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,.12)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2dfd8', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{proveedor.nombre}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Badge cfg={TIPO_CFG[proveedor.tipo] || TIPO_CFG.Mayorista} />
              <Badge cfg={estadoCfg} />
              <span style={{ fontSize: 12, color: '#9c9a92' }}>{proveedor.ciudad}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9c9a92' }}>×</button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'PEDIDOS', val: pedidosTotales, c: '#2563eb' },
              { label: 'MONTO TOTAL', val: fmtCOP(montoTotal), c: '#15803d' },
              { label: 'DEVUELTOS', val: devueltos, c: '#dc2626' },
            ].map(s => (
              <div key={s.label} style={{ background: '#f7f6f3', borderRadius: 9, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#9c9a92', fontWeight: 700, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.c }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: '#9c9a92', fontWeight: 600, marginBottom: 4 }}>CALIFICACIÓN</div>
              <Stars rating={proveedor.rating} />
            </div>
            {proveedor.precios_competitivos && (
              <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#15803d', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>💰 Precios competitivos</span>
            )}
          </div>

          {/* Contacto */}
          <div style={{ background: '#f7f6f3', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9c9a92', marginBottom: 10 }}>CONTACTO</div>
            {[
              { icon: '👤', val: proveedor.contacto },
              { icon: '📞', val: proveedor.telefono },
              { icon: '✉️', val: proveedor.email },
            ].filter(c => c.val).map(c => (
              <div key={c.icon} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
                <span>{c.icon}</span>
                <span>{c.val}</span>
              </div>
            ))}
          </div>

          {/* Categorías */}
          {proveedor.categorias?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9c9a92', marginBottom: 8 }}>CATEGORÍAS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {proveedor.categorias.map(c => (
                  <span key={c} style={{ padding: '3px 10px', background: '#f0eee9', borderRadius: 99, fontSize: 12, color: '#6b6860', fontWeight: 500 }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Productos del comparador */}
          {proveedor.productos?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9c9a92', marginBottom: 8 }}>PRODUCTOS DISPONIBLES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {proveedor.productos.slice(0, 5).map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f7f6f3', borderRadius: 8, fontSize: 13 }}>
                    <span>{p.repuesto?.nombre || '—'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmtCOP(p.precio)}</span>
                      <span style={{ fontSize: 11, color: STOCK_CFG[p.stock]?.color || '#9c9a92' }}>
                        {STOCK_CFG[p.stock]?.label || p.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {proveedor.comentario && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600, marginBottom: 3 }}>COMENTARIO INTERNO</div>
              <div style={{ fontSize: 13 }}>{proveedor.comentario}</div>
            </div>
          )}

          {ultimoPedido && (
            <div style={{ fontSize: 12, color: '#9c9a92', textAlign: 'right' }}>
              Último pedido: {tiempoRelativo(ultimoPedido.created_at)}
            </div>
          )}

          {puedeEditar && (
            <button onClick={() => onEditar(proveedor)}
              style={{ width: '100%', padding: '10px', background: '#f0eee9', color: '#1a1916', border: '1px solid #e2dfd8', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              ✏️ Editar proveedor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MÓDULO PROVEEDORES ───────────────────────────────────────
export default function ModuloProveedores() {
  const { esSuministro } = useAuth();
  const { proveedores, loading, error, crearProveedor, actualizarProveedor } = useProveedores();
  const [search, setSearch]           = useState('');
  const [filtroTipo, setFiltroTipo]   = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [selected, setSelected]       = useState(null);
  const [modalForm, setModalForm]     = useState(null); // null | 'nuevo' | proveedor

  const filtered = useMemo(() => {
    return proveedores.filter(p => {
      const q = search.toLowerCase();
      const matchQ     = !q || p.nombre?.toLowerCase().includes(q) || p.ciudad?.toLowerCase().includes(q) || p.contacto?.toLowerCase().includes(q);
      const matchTipo  = filtroTipo === 'todos'   || p.tipo === filtroTipo;
      const matchEst   = filtroEstado === 'todos' || p.estado === filtroEstado;
      return matchQ && matchTipo && matchEst;
    });
  }, [proveedores, search, filtroTipo, filtroEstado]);

  const handleGuardar = async (datos, id) => {
    if (id) await actualizarProveedor(id, datos);
    else await crearProveedor(datos);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e2dfd8', borderTopColor: '#1a1916', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 14, color: '#9c9a92' }}>Cargando proveedores…</div>
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
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>Proveedores</div>
            <div style={{ fontSize: 13, color: '#6b6860', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              {filtered.length} proveedores · {filtered.filter(p => p.estado === 'activo').length} activos
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#15803d' }} />Tiempo real
              </span>
            </div>
          </div>
          {esSuministro && (
            <button onClick={() => setModalForm('nuevo')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', background: '#1a1916', color: '#fff', border: 'none', cursor: 'pointer' }}>
              + Nuevo proveedor
            </button>
          )}
        </div>

        {/* Filtros */}
        <div style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9c9a92' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proveedor…"
              style={{ width: '100%', background: '#f7f6f3', border: '1px solid #e2dfd8', borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            style={{ background: '#f7f6f3', border: '1px solid #e2dfd8', borderRadius: 8, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
            <option value="todos">Todos los tipos</option>
            {['Mayorista', 'Distribuidor', 'Minorista'].map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            style={{ background: '#f7f6f3', border: '1px solid #e2dfd8', borderRadius: 8, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
            <option value="todos">Todos los estados</option>
            {Object.entries(ESTADO_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* Grid de proveedores */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9c9a92' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
            <div>No se encontraron proveedores</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {filtered.map(p => {
              const estadoCfg = ESTADO_CFG[p.estado] || ESTADO_CFG.activo;
              const tipoCfg   = TIPO_CFG[p.tipo] || TIPO_CFG.Mayorista;
              const pedidosCnt = p.pedidos?.length || 0;
              const montoTotal = p.pedidos?.reduce((a, x) => a + (x.unitario * x.cantidad || 0), 0) || 0;
              return (
                <div key={p.id} onClick={() => setSelected(p)}
                  style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color .15s, box-shadow .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a1916'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2dfd8'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ padding: '16px 18px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{p.nombre}</div>
                        <div style={{ fontSize: 12, color: '#9c9a92', marginTop: 2 }}>{p.ciudad}</div>
                      </div>
                      <Badge cfg={estadoCfg} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Badge cfg={tipoCfg} />
                      {p.precios_competitivos && <span style={{ fontSize: 11, color: '#15803d' }}>💰 Precios competitivos</span>}
                    </div>
                    <div style={{ fontSize: 20, color: '#f5a623', letterSpacing: 2, marginBottom: 6 }}>
                      {'★'.repeat(Math.round(p.rating || 0))}{'☆'.repeat(5 - Math.round(p.rating || 0))}
                      <span style={{ fontSize: 12, color: '#6b6860', marginLeft: 6 }}>{p.rating?.toFixed(1)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#9c9a92', fontWeight: 700 }}>PEDIDOS</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#2563eb' }}>{pedidosCnt}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#9c9a92', fontWeight: 700 }}>MONTO TOTAL</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>{fmtCOP(montoTotal)}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 18px', background: '#fafaf9', borderTop: '1px solid #f0eee9' }}>
                    <div style={{ fontSize: 12, color: '#6b6860', display: 'flex', justifyContent: 'space-between' }}>
                      <span>👤 {p.contacto || '—'}</span>
                      <span>{p.tiempo_entrega || 'Sin datos'}</span>
                    </div>
                    {p.categorias?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {p.categorias.slice(0, 3).map(c => (
                          <span key={c} style={{ padding: '1px 7px', background: '#f0eee9', borderRadius: 99, fontSize: 10.5, color: '#6b6860' }}>{c}</span>
                        ))}
                        {p.categorias.length > 3 && (
                          <span style={{ padding: '1px 7px', background: '#f0eee9', borderRadius: 99, fontSize: 10.5, color: '#9c9a92' }}>+{p.categorias.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel detalle */}
      {selected && (
        <DetalleProveedor
          proveedor={selected}
          onClose={() => setSelected(null)}
          onEditar={(p) => { setSelected(null); setModalForm(p); }}
          puedeEditar={esSuministro}
        />
      )}

      {/* Modal form */}
      {modalForm && (
        <ModalProveedor
          proveedor={modalForm === 'nuevo' ? null : modalForm}
          onClose={() => setModalForm(null)}
          onGuardar={handleGuardar}
        />
      )}
    </div>
  );
}
