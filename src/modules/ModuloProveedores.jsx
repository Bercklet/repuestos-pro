// src/modules/ModuloProveedores.jsx
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
const CATS = ['Display','Batería','Conector','Cámara','Flex','Tapa trasera','Placa','Otros'];

function Badge({ cfg }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:99, fontSize:11.5, fontWeight:600, background:cfg.bg, color:cfg.color }}>
      {cfg.dot && <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.dot }}/>}
      {cfg.label}
    </span>
  );
}
function Stars({ rating = 0 }) {
  const f = Math.round(rating);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:14, color:'#f59e0b' }}>
      {'★'.repeat(f)}{'☆'.repeat(5-f)}
      <span style={{ fontSize:12, color:'#6b6860', marginLeft:3 }}>{Number(rating).toFixed(1)}</span>
    </div>
  );
}

// ── CAMPO SIMPLE ──────────────────────────────────────────────
function Campo({ label, value, onChange, placeholder, type='text', hint }) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>
        {label}
        {hint && <span style={{ fontSize:11, color:'#9c9a92', fontWeight:400, marginLeft:5 }}>{hint}</span>}
      </label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:8, padding:'8px 10px', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
      />
    </div>
  );
}

// ── MODAL CREAR / EDITAR PROVEEDOR ────────────────────────────
function ModalProveedor({ proveedor, onClose, onGuardar }) {
  const esNuevo = !proveedor;
  const [form, setForm] = useState({
    nombre          : proveedor?.nombre           || '',
    apodo           : proveedor?.apodo            || '',
    tipo            : proveedor?.tipo             || 'Mayorista',
    ciudad          : proveedor?.ciudad           || '',
    contacto        : proveedor?.contacto         || '',
    telefono        : proveedor?.telefono         || '',
    whatsapp        : proveedor?.whatsapp         || '',
    email           : proveedor?.email            || '',
    direccion       : proveedor?.direccion        || '',
    comentario      : proveedor?.comentario       || '',
    notas_internas  : proveedor?.notas_internas   || '',
    categorias      : proveedor?.categorias       || [],
    estado          : proveedor?.estado           || 'activo',
    rating          : proveedor?.rating           || 5,
    precios_competitivos: proveedor?.precios_competitivos ?? true,
  });
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState('');
  const [tab,       setTab]       = useState('info'); // info | categorias | notas

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleCat = (cat) => {
    const cats = form.categorias.includes(cat)
      ? form.categorias.filter(c => c !== cat)
      : [...form.categorias, cat];
    set('categorias', cats);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre del negocio es obligatorio'); return; }
    setGuardando(true); setError('');
    try {
      await onGuardar(form, proveedor?.id);
      onClose();
    } catch(e) { setError(e.message); }
    finally { setGuardando(false); }
  };

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)}
      style={{ padding:'6px 14px', borderRadius:7, border:'none', fontFamily:'inherit', fontSize:13, fontWeight:500, cursor:'pointer', background:tab===id?'#1a1916':'transparent', color:tab===id?'#fff':'#6b6860' }}>
      {label}
    </button>
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onMouseDown={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:520, maxHeight:'92vh', overflowY:'auto', display:'flex', flexDirection:'column' }}
        onMouseDown={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'18px 22px 14px', borderBottom:'1px solid #e2dfd8', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ fontSize:15, fontWeight:700 }}>{esNuevo ? '+ Nuevo proveedor' : `✏️ Editar · ${proveedor.apodo || proveedor.nombre}`}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9c9a92' }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ padding:'10px 22px 0', borderBottom:'1px solid #e2dfd8', display:'flex', gap:4 }}>
          <TabBtn id="info"       label="📋 Información" />
          <TabBtn id="contacto"   label="📞 Contacto" />
          <TabBtn id="categorias" label="🔧 Categorías" />
        </div>

        {/* Contenido */}
        <div style={{ padding:'18px 22px', flex:1, overflowY:'auto' }}>

          {tab === 'info' && (
            <>
              {/* Nombre del negocio — el más importante */}
              <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#15803d', marginBottom:8 }}>🏪 IDENTIDAD DEL NEGOCIO</div>
                <Campo label="NOMBRE DEL NEGOCIO *"
                  value={form.nombre} onChange={v => set('nombre', v)}
                  placeholder="Ej: Repuestos Pescado, DistriMovil SAS"
                  hint="Nombre legal o comercial"
                />
                <Campo label="APODO / NOMBRE CORTO"
                  value={form.apodo} onChange={v => set('apodo', v)}
                  placeholder="Ej: Pescado, DistriMovil"
                  hint="Se mostrará en cotizaciones y pedidos"
                />
                <div style={{ fontSize:11.5, color:'#15803d', padding:'6px 10px', background:'#dcfce7', borderRadius:7 }}>
                  💡 El apodo es como lo identificarás en el día a día dentro del sistema
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>TIPO</label>
                  <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
                    style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:8, padding:'8px 10px', fontSize:13, fontFamily:'inherit', outline:'none' }}>
                    {Object.keys(TIPO_CFG).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>ESTADO</label>
                  <select value={form.estado} onChange={e => set('estado', e.target.value)}
                    style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:8, padding:'8px 10px', fontSize:13, fontFamily:'inherit', outline:'none' }}>
                    {Object.entries(ESTADO_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <Campo label="CIUDAD" value={form.ciudad} onChange={v => set('ciudad', v)} placeholder="Medellín, Bogotá…"/>

              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>
                  CALIFICACIÓN
                  <span style={{ fontSize:11, color:'#9c9a92', fontWeight:400, marginLeft:5 }}>{form.rating}/5</span>
                </label>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="range" min="0" max="5" step="0.5" value={form.rating}
                    onChange={e => set('rating', Number(e.target.value))}
                    style={{ flex:1 }} />
                  <Stars rating={form.rating} />
                </div>
              </div>

              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#6b6860', marginBottom:12 }}>
                <input type="checkbox" checked={form.precios_competitivos} onChange={e => set('precios_competitivos', e.target.checked)} />
                Precios competitivos
              </label>
            </>
          )}

          {tab === 'contacto' && (
            <>
              <Campo label="NOMBRE DEL CONTACTO" value={form.contacto} onChange={v => set('contacto', v)} placeholder="Juan Pérez"/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <Campo label="TELÉFONO" value={form.telefono} onChange={v => set('telefono', v)} placeholder="601 234 5678"/>
                <Campo label="WHATSAPP" value={form.whatsapp} onChange={v => set('whatsapp', v)} placeholder="3001234567"/>
              </div>
              <Campo label="EMAIL" value={form.email} onChange={v => set('email', v)} placeholder="ventas@proveedor.com" type="email"/>
              <Campo label="DIRECCIÓN" value={form.direccion} onChange={v => set('direccion', v)} placeholder="Calle 10 # 45-12, Medellín"/>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>COMENTARIO PÚBLICO</label>
                <textarea value={form.comentario} onChange={e => set('comentario', e.target.value)}
                  rows={2} placeholder="Condiciones de pago, horarios, etc."
                  style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:8, padding:'8px 10px', fontSize:13, fontFamily:'inherit', outline:'none', resize:'none', boxSizing:'border-box' }}/>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>NOTAS INTERNAS</label>
                <textarea value={form.notas_internas} onChange={e => set('notas_internas', e.target.value)}
                  rows={2} placeholder="Notas privadas: descuentos especiales, condiciones acordadas…"
                  style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:8, padding:'8px 10px', fontSize:13, fontFamily:'inherit', outline:'none', resize:'none', boxSizing:'border-box' }}/>
              </div>
            </>
          )}

          {tab === 'categorias' && (
            <>
              <div style={{ fontSize:13, color:'#6b6860', marginBottom:12 }}>
                Selecciona los tipos de repuestos que maneja este proveedor:
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {CATS.map(cat => {
                  const sel = form.categorias.includes(cat);
                  return (
                    <button key={cat} onClick={() => toggleCat(cat)}
                      style={{ padding:'7px 14px', borderRadius:99, border:`1.5px solid ${sel?'#1a1916':'#e2dfd8'}`, background:sel?'#1a1916':'#fff', color:sel?'#fff':'#6b6860', fontSize:13, fontWeight:sel?600:400, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
                      {sel && '✓ '}{cat}
                    </button>
                  );
                })}
              </div>
              {form.categorias.length > 0 && (
                <div style={{ marginTop:16, padding:'10px 14px', background:'#f0fdf4', borderRadius:9, fontSize:13, color:'#15803d' }}>
                  ✓ Especializado en: {form.categorias.join(', ')}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 22px 20px', borderTop:'1px solid #e2dfd8', flexShrink:0 }}>
          {error && <div style={{ padding:'8px 12px', background:'#fff1f1', border:'1px solid #fecaca', borderRadius:8, fontSize:13, color:'#dc2626', marginBottom:12 }}>⚠ {error}</div>}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ flex:1, padding:'10px', background:'#f0eee9', color:'#6b6860', border:'none', borderRadius:9, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>Cancelar</button>
            <button onClick={guardar} disabled={guardando}
              style={{ flex:2, padding:'10px', background:'#1a1916', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              {guardando ? 'Guardando…' : esNuevo ? '+ Crear proveedor' : '✓ Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CARD PROVEEDOR ────────────────────────────────────────────
function CardProveedor({ proveedor, onEditar, onEliminar, esSuministro }) {
  const [expandido, setExpandido] = useState(false);
  const tipoCfg   = TIPO_CFG[proveedor.tipo]   || TIPO_CFG.Mayorista;
  const estadoCfg = ESTADO_CFG[proveedor.estado] || ESTADO_CFG.activo;
  const nombreDisplay = proveedor.apodo || proveedor.nombre;

  return (
    <div style={{ background:'#fff', border:'1px solid #e2dfd8', borderRadius:14, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
        {/* Avatar del negocio */}
        <div style={{ width:44, height:44, borderRadius:10, background:'#1a1916', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ fontSize:18 }}>🏪</span>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <div style={{ fontSize:15, fontWeight:700 }}>{nombreDisplay}</div>
            {proveedor.apodo && proveedor.apodo !== proveedor.nombre && (
              <span style={{ fontSize:11, color:'#9c9a92', fontStyle:'italic' }}>({proveedor.nombre})</span>
            )}
            <Badge cfg={estadoCfg}/>
            <Badge cfg={{ ...tipoCfg, label: proveedor.tipo }}/>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4, flexWrap:'wrap' }}>
            <Stars rating={proveedor.rating}/>
            {proveedor.ciudad && <span style={{ fontSize:12, color:'#9c9a92' }}>📍 {proveedor.ciudad}</span>}
            {proveedor.telefono && (
              <a href={`tel:${proveedor.telefono}`} style={{ fontSize:12, color:'#2563eb', textDecoration:'none' }}>
                📞 {proveedor.telefono}
              </a>
            )}
            {proveedor.whatsapp && (
              <a href={`https://wa.me/57${proveedor.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                style={{ fontSize:12, color:'#15803d', textDecoration:'none', fontWeight:600 }}>
                💬 WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          {esSuministro && (
            <button onClick={() => onEditar(proveedor)}
              style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #e2dfd8', background:'#fff', fontSize:12.5, fontFamily:'inherit', cursor:'pointer', color:'#1a1916', fontWeight:500 }}>
              ✏️ Editar
            </button>
          )}
          <button onClick={() => setExpandido(!expandido)}
            style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #e2dfd8', background:'transparent', fontSize:13, cursor:'pointer', color:'#9c9a92' }}>
            {expandido ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Detalle expandido */}
      {expandido && (
        <div style={{ padding:'14px 18px', background:'#fafaf9', borderTop:'1px solid #f0eee9', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:10 }}>
            {[
              { label:'Contacto',    val: proveedor.contacto    || '—' },
              { label:'Email',       val: proveedor.email       || '—' },
              { label:'Dirección',   val: proveedor.direccion   || '—' },
              { label:'Registrado',  val: tiempoRelativo(proveedor.created_at) },
            ].filter(f => f.val !== '—').map(f => (
              <div key={f.label}>
                <div style={{ fontSize:11, fontWeight:700, color:'#9c9a92', marginBottom:2 }}>{f.label.toUpperCase()}</div>
                <div style={{ fontSize:13 }}>{f.val}</div>
              </div>
            ))}
          </div>

          {proveedor.categorias?.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#9c9a92', marginBottom:6 }}>ESPECIALIDADES</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {proveedor.categorias.map(c => (
                  <span key={c} style={{ padding:'3px 10px', background:'#f0eee9', borderRadius:99, fontSize:12, color:'#6b6860' }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {proveedor.comentario && (
            <div style={{ padding:'8px 12px', background:'#fef3c7', border:'1px solid #fde68a', borderRadius:8, fontSize:13 }}>
              💬 {proveedor.comentario}
            </div>
          )}

          {proveedor.notas_internas && esSuministro && (
            <div style={{ padding:'8px 12px', background:'#f0eee9', border:'1px solid #e2dfd8', borderRadius:8, fontSize:12.5, color:'#6b6860' }}>
              🔒 <strong>Nota interna:</strong> {proveedor.notas_internas}
            </div>
          )}

          {esSuministro && (
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              {proveedor.whatsapp && (
                <a href={`https://wa.me/57${proveedor.whatsapp.replace(/\D/g,'')}?text=Hola%20${encodeURIComponent(nombreDisplay)}%2C%20necesito%20cotizar%20un%20repuesto.`}
                  target="_blank" rel="noreferrer"
                  style={{ padding:'7px 14px', borderRadius:8, background:'#dcfce7', color:'#15803d', fontSize:12.5, fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:5 }}>
                  💬 Cotizar por WhatsApp
                </a>
              )}
              <button onClick={() => onEliminar(proveedor)}
                style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #fecaca', background:'#fff1f1', color:'#dc2626', fontSize:12.5, fontFamily:'inherit', cursor:'pointer' }}>
                Desactivar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MÓDULO PRINCIPAL ──────────────────────────────────────────
export default function ModuloProveedores() {
  const { esSuministro }                            = useAuth();
  const { proveedores, loading, error, crearProveedor, actualizarProveedor } = useProveedores();
  const [search, setSearch]                         = useState('');
  const [filtroEstado, setFiltroEstado]              = useState('todos');
  const [filtroTipo, setFiltroTipo]                  = useState('todos');
  const [modal, setModal]                            = useState(null); // null | 'nuevo' | proveedor

  const filtrados = useMemo(() => {
    return proveedores.filter(p => {
      const q = search.toLowerCase();
      const matchQ = !q || p.nombre?.toLowerCase().includes(q) || p.apodo?.toLowerCase().includes(q) || p.ciudad?.toLowerCase().includes(q);
      const matchE = filtroEstado === 'todos' || p.estado === filtroEstado;
      const matchT = filtroTipo  === 'todos' || p.tipo   === filtroTipo;
      return matchQ && matchE && matchT;
    });
  }, [proveedores, search, filtroEstado, filtroTipo]);

  const handleGuardar = async (form, id) => {
    if (id) await actualizarProveedor(id, form);
    else    await crearProveedor(form);
  };

  const handleEliminar = async (p) => {
    if (!window.confirm(`¿Desactivar a "${p.apodo || p.nombre}"?`)) return;
    await actualizarProveedor(p.id, { estado: 'inactivo' });
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:28, height:28, border:'3px solid #e2dfd8', borderTopColor:'#1a1916', borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 10px' }}/>
        <div style={{ fontSize:13, color:'#9c9a92' }}>Cargando proveedores…</div>
      </div>
    </div>
  );

  if (error) return <div style={{ padding:24, color:'#dc2626' }}>⚠️ {error}</div>;

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:'#f7f6f3', minHeight:'100vh', padding:24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.4px' }}>Proveedores</div>
          <div style={{ fontSize:13, color:'#6b6860', marginTop:3 }}>
            {filtrados.filter(p => p.estado==='activo').length} activos · {proveedores.length} total
          </div>
        </div>
        {esSuministro && (
          <button onClick={() => setModal('nuevo')}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:600, fontFamily:'inherit', background:'#1a1916', color:'#fff', border:'none', cursor:'pointer' }}>
            + Nuevo proveedor
          </button>
        )}
      </div>

      {/* Métricas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:20 }}>
        {[
          { label:'ACTIVOS',     val: proveedores.filter(p=>p.estado==='activo').length,   bg:'#dcfce7', c:'#15803d', icon:'✅' },
          { label:'MAYORISTAS',  val: proveedores.filter(p=>p.tipo==='Mayorista').length,  bg:'#ede9fe', c:'#7c3aed', icon:'🏭' },
          { label:'PAUSADOS',    val: proveedores.filter(p=>p.estado==='pausado').length,  bg:'#fef3c7', c:'#d97706', icon:'⏸️' },
          { label:'RATING PROM.',val: proveedores.length ? (proveedores.reduce((a,p)=>a+(p.rating||0),0)/proveedores.length).toFixed(1) : '—', bg:'#fef3c7', c:'#d97706', icon:'⭐' },
        ].map(m => (
          <div key={m.label} style={{ background:'#fff', border:'1px solid #e2dfd8', borderRadius:12, padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:10.5, fontWeight:700, color:'#9c9a92', letterSpacing:'.3px' }}>{m.label}</span>
              <div style={{ width:24, height:24, borderRadius:6, background:m.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>{m.icon}</div>
            </div>
            <div style={{ fontSize:22, fontWeight:700, color:m.c }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ background:'#fff', border:'1px solid #e2dfd8', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#9c9a92' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, apodo, ciudad…"
            style={{ width:'100%', background:'#f7f6f3', border:'1px solid #e2dfd8', borderRadius:8, padding:'7px 12px 7px 28px', fontSize:13, fontFamily:'inherit', outline:'none' }}/>
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          style={{ background:'#f7f6f3', border:'1px solid #e2dfd8', borderRadius:8, padding:'7px 10px', fontSize:13, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
          <option value="todos">Todos los estados</option>
          {Object.entries(ESTADO_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          style={{ background:'#f7f6f3', border:'1px solid #e2dfd8', borderRadius:8, padding:'7px 10px', fontSize:13, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
          <option value="todos">Todos los tipos</option>
          {Object.keys(TIPO_CFG).map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid #e2dfd8', borderRadius:14, padding:'48px', textAlign:'center', color:'#9c9a92' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🏪</div>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>No hay proveedores</div>
          <div style={{ fontSize:13 }}>Agrega tu primer proveedor para empezar a cotizar</div>
          {esSuministro && (
            <button onClick={() => setModal('nuevo')}
              style={{ marginTop:16, padding:'8px 18px', background:'#1a1916', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              + Agregar proveedor
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtrados.map(p => (
            <CardProveedor key={p.id} proveedor={p}
              onEditar={p => setModal(p)}
              onEliminar={handleEliminar}
              esSuministro={esSuministro}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <ModalProveedor
          proveedor={modal === 'nuevo' ? null : modal}
          onClose={() => setModal(null)}
          onGuardar={handleGuardar}
        />
      )}
    </div>
  );
}
