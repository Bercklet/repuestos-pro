// src/modules/ModuloCotizaciones.jsx
// Comparador de precios por proveedor + control de pagos
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, fmtCOP, tiempoRelativo } from '../lib/supabase';
import { usePedidos } from '../hooks/useData';

const METODOS_PAGO = ['Efectivo','Transferencia','Nequi','Daviplata','Cheque','Otro'];
const CALIDADES    = ['Original','OEM','Genérico','Recuperado'];

function Badge({ label, bg, color }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 9px', borderRadius:99, fontSize:11.5, fontWeight:600, background:bg, color }}>
      {label}
    </span>
  );
}

// ── HOOK DE DATOS ─────────────────────────────────────────────
function useCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [pagos,        setPagos]        = useState([]);
  const [proveedores,  setProveedores]  = useState([]);
  const [pedidos,      setPedidos]      = useState([]);
  const [loading,      setLoading]      = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [
      { data: cots },
      { data: pags },
      { data: provs },
      { data: peds },
    ] = await Promise.all([
      supabase.from('cotizaciones').select('*, proveedor:proveedores(id,nombre,telefono)').order('created_at', { ascending: false }),
      supabase.from('pagos_pedido').select('*, proveedor:proveedores(nombre), pedido:pedidos(numero,repuesto,marca,modelo)').order('created_at', { ascending: false }),
      supabase.from('proveedores').select('id,nombre,telefono').eq('estado','activo').order('nombre'),
      supabase.from('pedidos').select('id,numero,repuesto,marca,modelo,unitario,cantidad,estado').eq('estado','entregado').order('numero', { ascending: false }).limit(200),
    ]);
    setCotizaciones(cots || []);
    setPagos(pags       || []);
    setProveedores(provs || []);
    setPedidos(peds      || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const agregarCotizacion = async (data) => {
    const { error } = await supabase.from('cotizaciones').insert(data);
    if (error) throw error;
    await cargar();
  };

  const seleccionarCotizacion = async (id, pedidoId) => {
    const cot = cotizaciones.find(c => c.id === id);
    if (!cot) return;

    // Si ya estaba elegida, deseleccionar
    if (cot.seleccionada) {
      await supabase.from('cotizaciones').update({ seleccionada: false }).eq('id', id);
      await cargar();
      return;
    }

    // Desmarcar todas las cotizaciones de esta misma referencia
    await supabase.from('cotizaciones')
      .update({ seleccionada: false })
      .eq('marca', cot.marca || '')
      .eq('modelo', cot.modelo || '')
      .eq('repuesto', cot.repuesto);

    // Marcar la seleccionada
    await supabase.from('cotizaciones').update({ seleccionada: true }).eq('id', id);

    // Si tiene pedido vinculado → solo actualizar precio y proveedor
    if (pedidoId) {
      await supabase.from('pedidos')
        .update({ unitario: cot.precio, proveedor_id: cot.proveedor_id, estado: 'pedido' })
        .eq('id', pedidoId);

    } else {
      // Si NO tiene pedido vinculado → CREAR el pedido automáticamente en estado "pedido"
      const { data: perfData } = await supabase.auth.getUser();
      const tecnicoId = perfData?.user?.id;

      const { data: nuevoPedido, error: errP } = await supabase
        .from('pedidos')
        .insert({
          repuesto:     cot.repuesto,
          marca:        cot.marca    || '',
          modelo:       cot.modelo   || '',
          tipo:         cot.calidad  || 'OEM',
          cantidad:     1,
          prioridad:    'normal',
          estado:       'pedido',           // ← entra directo como "Pedido"
          unitario:     cot.precio,
          proveedor_id: cot.proveedor_id,
          tecnico_id:   tecnicoId,
          observaciones: `Aceptado desde cotizaciones · Proveedor: ${cot.proveedor?.nombre || ''}`,
        })
        .select()
        .single();

      if (errP) throw errP;

      // Vincular la cotización al pedido recién creado
      await supabase.from('cotizaciones')
        .update({ pedido_id: nuevoPedido.id })
        .eq('id', id);
    }

    await cargar();
  };

  const registrarPago = async (data) => {
    const { error } = await supabase.from('pagos_pedido').insert(data);
    if (error) throw error;
    // Actualizar total_pagado en el pedido
    const totalPagado = pagos
      .filter(p => p.pedido_id === data.pedido_id)
      .reduce((a, p) => a + p.monto, 0) + data.monto;
    await supabase.from('pedidos').update({ total_pagado: totalPagado }).eq('id', data.pedido_id);
    await cargar();
  };

  return { cotizaciones, pagos, proveedores, pedidos, loading, cargar, agregarCotizacion, seleccionarCotizacion, registrarPago };
}

// ── MODAL NUEVA COTIZACIÓN ────────────────────────────────────
function ModalCotizacion({ proveedores, pedido, onClose, onGuardar }) {
  const { perfil } = useAuth();
  const [form, setForm] = useState({
    marca          : pedido?.marca    || '',
    modelo         : pedido?.modelo   || '',
    repuesto       : pedido?.repuesto || '',
    calidad        : 'OEM',
    proveedor_id   : '',
    precio         : '',
    tiempo_entrega : '',
    disponible     : true,
    notas          : '',
    pedido_id      : pedido?.id || null,
  });
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const guardar = async () => {
    if (!form.proveedor_id) { setError('Selecciona un proveedor'); return; }
    if (!form.precio || Number(form.precio) <= 0) { setError('Ingresa un precio válido'); return; }
    if (!form.repuesto.trim()) { setError('El repuesto es obligatorio'); return; }
    setGuardando(true); setError('');
    try {
      await onGuardar({ ...form, precio: Number(form.precio), registrado_por: perfil.id });
      onClose();
    } catch(e) { setError(e.message); }
    finally { setGuardando(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', padding:28 }}
        onMouseDown={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ fontSize:15, fontWeight:700 }}>+ Nueva cotización</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9c9a92' }}>×</button>
        </div>

        {/* Referencia del repuesto */}
        <div style={{ background:'#f7f6f3', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#9c9a92', marginBottom:6 }}>REPUESTO A COTIZAR</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { label:'Marca',      key:'marca',    placeholder:'Samsung' },
              { label:'Modelo',     key:'modelo',   placeholder:'Galaxy S23 Ultra' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize:11, color:'#6b6860', display:'block', marginBottom:3 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                  style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:7, padding:'6px 8px', fontSize:12.5, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop:8 }}>
            <label style={{ fontSize:11, color:'#6b6860', display:'block', marginBottom:3 }}>Componente *</label>
            <input value={form.repuesto} onChange={e => set('repuesto', e.target.value)} placeholder="Pantalla completa, Batería…"
              style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:7, padding:'6px 8px', fontSize:12.5, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
          </div>
        </div>

        {/* Proveedor */}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>PROVEEDOR *</label>
          <select value={form.proveedor_id} onChange={e => set('proveedor_id', e.target.value)}
            style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:8, padding:'8px 10px', fontSize:13, fontFamily:'inherit', outline:'none' }}>
            <option value="">Selecciona un proveedor…</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>

        {/* Precio + Calidad */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>PRECIO COTIZADO *</label>
            <input type="number" value={form.precio} onChange={e => set('precio', e.target.value)}
              placeholder="0" min="0"
              style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:8, padding:'8px 10px', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>CALIDAD</label>
            <select value={form.calidad} onChange={e => set('calidad', e.target.value)}
              style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:8, padding:'8px 10px', fontSize:13, fontFamily:'inherit', outline:'none' }}>
              {CALIDADES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Tiempo + Disponible */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, marginBottom:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>TIEMPO DE ENTREGA</label>
            <select value={form.tiempo_entrega} onChange={e => set('tiempo_entrega', e.target.value)}
              style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:8, padding:'8px 10px', fontSize:13, fontFamily:'inherit', outline:'none' }}>
              <option value="">Sin especificar</option>
              {['Inmediato','1 día','2 días','3-5 días','1 semana','Más de 1 semana'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', paddingBottom:2 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13, color:'#6b6860' }}>
              <input type="checkbox" checked={form.disponible} onChange={e => set('disponible', e.target.checked)} />
              Disponible
            </label>
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>NOTAS</label>
          <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
            rows={2} placeholder="Garantía, condiciones, referencia del proveedor…"
            style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:8, padding:'8px 10px', fontSize:13, fontFamily:'inherit', outline:'none', resize:'none', boxSizing:'border-box' }} />
        </div>

        {error && <div style={{ padding:'8px 12px', background:'#fff1f1', border:'1px solid #fecaca', borderRadius:8, fontSize:13, color:'#dc2626', marginBottom:12 }}>⚠ {error}</div>}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'9px', background:'#f0eee9', color:'#6b6860', border:'none', borderRadius:9, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            style={{ flex:2, padding:'9px', background:'#1a1916', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            {guardando ? 'Guardando…' : '+ Registrar cotización'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL REGISTRAR PAGO ──────────────────────────────────────
function ModalPago({ pedido, proveedores, pagosExistentes, onClose, onGuardar }) {
  const { perfil } = useAuth();
  const totalPedido  = (pedido.unitario || 0) * (pedido.cantidad || 0);
  const totalPagado  = pagosExistentes.reduce((a, p) => a + p.monto, 0);
  const saldoPend    = totalPedido - totalPagado;
  const [monto,       setMonto]       = useState(saldoPend > 0 ? saldoPend : '');
  const [metodo,      setMetodo]      = useState('Efectivo');
  const [provId,      setProvId]      = useState(pedido.proveedor_id || '');
  const [referencia,  setReferencia]  = useState('');
  const [notas,       setNotas]       = useState('');
  const [guardando,   setGuardando]   = useState(false);
  const [error,       setError]       = useState('');

  const guardar = async () => {
    if (!monto || Number(monto) <= 0) { setError('El monto debe ser mayor a 0'); return; }
    setGuardando(true); setError('');
    try {
      await onGuardar({
        pedido_id:      pedido.id,
        monto:          Number(monto),
        proveedor_id:   provId || null,
        metodo,
        referencia:     referencia.trim() || null,
        notas:          notas.trim() || null,
        registrado_por: perfil.id,
      });
      onClose();
    } catch(e) { setError(e.message); }
    finally { setGuardando(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:420, padding:28 }}
        onMouseDown={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:700 }}>💳 Registrar pago</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9c9a92' }}>×</button>
        </div>

        {/* Info del pedido */}
        <div style={{ background:'#f7f6f3', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
          <div style={{ fontSize:12.5, fontWeight:600 }}>#{String(pedido.numero).padStart(4,'0')} · {pedido.repuesto}</div>
          <div style={{ fontSize:11.5, color:'#6b6860', marginTop:3 }}>{pedido.marca} {pedido.modelo}</div>
          <div style={{ display:'flex', gap:16, marginTop:8 }}>
            <div><div style={{ fontSize:10.5, color:'#9c9a92' }}>VALOR TOTAL</div><div style={{ fontSize:14, fontWeight:700, color:'#1a1916' }}>{fmtCOP(totalPedido)}</div></div>
            <div><div style={{ fontSize:10.5, color:'#9c9a92' }}>PAGADO</div><div style={{ fontSize:14, fontWeight:700, color:'#15803d' }}>{fmtCOP(totalPagado)}</div></div>
            <div><div style={{ fontSize:10.5, color:'#9c9a92' }}>SALDO</div><div style={{ fontSize:14, fontWeight:700, color: saldoPend > 0 ? '#dc2626' : '#15803d' }}>{fmtCOP(saldoPend)}</div></div>
          </div>
        </div>

        {/* Historial de pagos previos */}
        {pagosExistentes.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#9c9a92', marginBottom:6 }}>PAGOS ANTERIORES</div>
            {pagosExistentes.map(p => (
              <div key={p.id} style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, padding:'4px 0', borderBottom:'1px solid #f0eee9' }}>
                <span style={{ color:'#6b6860' }}>{p.metodo} · {tiempoRelativo(p.created_at)}</span>
                <span style={{ fontWeight:600, color:'#15803d' }}>{fmtCOP(p.monto)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>MONTO A PAGAR *</label>
          <input type="number" value={monto} onChange={e => setMonto(e.target.value)} min="1" placeholder="0"
            style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:8, padding:'8px 10px', fontSize:15, fontFamily:'inherit', outline:'none', fontWeight:600, boxSizing:'border-box' }} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>MÉTODO</label>
            <select value={metodo} onChange={e => setMetodo(e.target.value)}
              style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:8, padding:'8px 10px', fontSize:13, fontFamily:'inherit', outline:'none' }}>
              {METODOS_PAGO.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>PROVEEDOR</label>
            <select value={provId} onChange={e => setProvId(e.target.value)}
              style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:8, padding:'8px 10px', fontSize:13, fontFamily:'inherit', outline:'none' }}>
              <option value="">Sin especificar</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'#6b6860', display:'block', marginBottom:4 }}>REFERENCIA / COMPROBANTE</label>
          <input value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Nro. transferencia, recibo…"
            style={{ width:'100%', border:'1.5px solid #e2dfd8', borderRadius:8, padding:'8px 10px', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
        </div>

        {error && <div style={{ padding:'8px 12px', background:'#fff1f1', border:'1px solid #fecaca', borderRadius:8, fontSize:13, color:'#dc2626', marginBottom:12 }}>⚠ {error}</div>}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'9px', background:'#f0eee9', color:'#6b6860', border:'none', borderRadius:9, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            style={{ flex:2, padding:'9px', background:'#15803d', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            {guardando ? 'Guardando…' : '💳 Registrar pago'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MÓDULO PRINCIPAL ──────────────────────────────────────────
export default function ModuloCotizaciones() {
  const { esSuministro } = useAuth();
  const { cotizaciones, pagos, proveedores, pedidos, loading, agregarCotizacion, seleccionarCotizacion, registrarPago } = useCotizaciones();

  const [tab,          setTab]          = useState('comparador'); // comparador | pagos | historial
  const [search,       setSearch]       = useState('');
  const [modalCot,     setModalCot]     = useState(false);
  const [modalPago,    setModalPago]    = useState(null); // pedido seleccionado
  const [pedidoCot,    setPedidoCot]    = useState(null);

  // Agrupar cotizaciones por referencia (marca+modelo+repuesto)
  const grupos = useMemo(() => {
    const map = {};
    cotizaciones.forEach(c => {
      const clave = `${c.marca||''}|${c.modelo||''}|${c.repuesto}|${c.calidad}`;
      if (!map[clave]) map[clave] = { clave, marca:c.marca, modelo:c.modelo, repuesto:c.repuesto, calidad:c.calidad, items:[] };
      map[clave].items.push(c);
    });
    // Ordenar items por precio ASC (el más barato primero)
    Object.values(map).forEach(g => g.items.sort((a,b) => a.precio - b.precio));
    return Object.values(map);
  }, [cotizaciones]);

  const gruposFiltrados = useMemo(() => {
    if (!search.trim()) return grupos;
    const q = search.toLowerCase();
    return grupos.filter(g =>
      g.repuesto?.toLowerCase().includes(q) ||
      g.marca?.toLowerCase().includes(q) ||
      g.modelo?.toLowerCase().includes(q)
    );
  }, [grupos, search]);

  // Balance global de pagos
  const totalPagado  = pagos.reduce((a, p) => a + p.monto, 0);
  const totalPedidos = pedidos.reduce((a, p) => a + (p.unitario || 0) * (p.cantidad || 0), 0);
  const saldoTotal   = totalPedidos - totalPagado;

  // Pagos por pedido (para el modal)
  const getPagosPedido = id => pagos.filter(p => p.pedido_id === id);

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)}
      style={{ padding:'7px 16px', borderRadius:8, border:'none', fontFamily:'inherit', fontSize:13, fontWeight:500, cursor:'pointer', background:tab===id?'#1a1916':'transparent', color:tab===id?'#fff':'#6b6860' }}>
      {label}
    </button>
  );

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:28, height:28, border:'3px solid #e2dfd8', borderTopColor:'#1a1916', borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 10px' }} />
        <div style={{ fontSize:13, color:'#9c9a92' }}>Cargando cotizaciones…</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:'#f7f6f3', minHeight:'100vh', padding:24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.4px' }}>Cotizaciones y Pagos</div>
          <div style={{ fontSize:13, color:'#6b6860', marginTop:3 }}>Compara precios entre proveedores · Lleva el control de pagos</div>
        </div>
        {esSuministro && (
          <button onClick={() => { setPedidoCot(null); setModalCot(true); }}
            style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:600, fontFamily:'inherit', background:'#1a1916', color:'#fff', border:'none', cursor:'pointer' }}>
            + Nueva cotización
          </button>
        )}
      </div>

      {/* KPIs de balance */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, marginBottom:20 }}>
        {[
          { label:'TOTAL ENTREGADO',   val:fmtCOP(totalPedidos), icon:'📦', bg:'#dbeafe', c:'#2563eb' },
          { label:'PAGADO',            val:fmtCOP(totalPagado),  icon:'✅', bg:'#dcfce7', c:'#15803d' },
          { label:'SALDO PENDIENTE',   val:fmtCOP(saldoTotal),   icon:'⏳', bg: saldoTotal>0?'#fee2e2':'#dcfce7', c: saldoTotal>0?'#dc2626':'#15803d' },
          { label:'COTIZACIONES',      val:cotizaciones.length,  icon:'🏷️', bg:'#ede9fe', c:'#7c3aed' },
          { label:'PAGOS REGISTRADOS', val:pagos.length,         icon:'💳', bg:'#fef3c7', c:'#d97706' },
        ].map(m => (
          <div key={m.label} style={{ background:'#fff', border:'1px solid #e2dfd8', borderRadius:12, padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:10.5, fontWeight:700, color:'#9c9a92', letterSpacing:'.3px' }}>{m.label}</span>
              <div style={{ width:24, height:24, borderRadius:6, background:m.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>{m.icon}</div>
            </div>
            <div style={{ fontSize:18, fontWeight:700, fontFamily:'monospace', color:m.c }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Nota si hay saldo pendiente */}
      {saldoTotal > 0 && (
        <div style={{ padding:'10px 14px', background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, fontSize:13, color:'#c2410c', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
          ⚠️ Tienes <strong>{fmtCOP(saldoTotal)}</strong> pendientes de pagar a proveedores.
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'#fff', border:'1px solid #e2dfd8', borderRadius:10, padding:3, width:'fit-content', marginBottom:16 }}>
        <TabBtn id="comparador" label="🏷️ Comparador de precios" />
        <TabBtn id="pagos"      label="💳 Control de pagos" />
        <TabBtn id="historial"  label="📊 Historial de precios" />
      </div>

      {/* ── TAB COMPARADOR ── */}
      {tab === 'comparador' && (
        <div>
          <div style={{ marginBottom:14 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por repuesto, marca o modelo…"
              style={{ width:'100%', maxWidth:400, background:'#fff', border:'1px solid #e2dfd8', borderRadius:8, padding:'8px 12px', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
          </div>
          {gruposFiltrados.length === 0 ? (
            <div style={{ background:'#fff', border:'1px solid #e2dfd8', borderRadius:12, padding:'40px', textAlign:'center', color:'#9c9a92' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🏷️</div>
              <div style={{ fontSize:14, fontWeight:500 }}>No hay cotizaciones aún</div>
              <div style={{ fontSize:13, marginTop:4 }}>Registra las cotizaciones de tus proveedores para comparar precios</div>
              {esSuministro && (
                <button onClick={() => setModalCot(true)}
                  style={{ marginTop:14, padding:'8px 18px', background:'#1a1916', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  + Agregar cotización
                </button>
              )}
            </div>
          ) : gruposFiltrados.map(g => {
            const mejor    = g.items[0]; // el más barato
            const ahorro   = g.items.length > 1 ? g.items[g.items.length-1].precio - mejor.precio : 0;
            return (
              <div key={g.clave} style={{ background:'#fff', border:'1px solid #e2dfd8', borderRadius:12, marginBottom:12, overflow:'hidden' }}>
                {/* Encabezado del grupo */}
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0eee9', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600 }}>
                      {g.marca && <span style={{ color:'#2563eb' }}>{g.marca} </span>}
                      {g.modelo && <span>{g.modelo} · </span>}
                      <span>{g.repuesto}</span>
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:4 }}>
                      <Badge label={g.calidad} bg="#f0eee9" color="#6b6860" />
                      <span style={{ fontSize:12, color:'#9c9a92' }}>{g.items.length} cotizacion{g.items.length>1?'es':''}</span>
                      {ahorro > 0 && <span style={{ fontSize:12, color:'#15803d', fontWeight:600 }}>💡 Ahorro posible: {fmtCOP(ahorro)}</span>}
                    </div>
                  </div>
                  {esSuministro && (
                    <button onClick={() => { setPedidoCot({ marca:g.marca, modelo:g.modelo, repuesto:g.repuesto, calidad:g.calidad }); setModalCot(true); }}
                      style={{ padding:'5px 12px', borderRadius:7, border:'1px solid #e2dfd8', background:'transparent', fontSize:12, fontFamily:'inherit', cursor:'pointer', color:'#6b6860' }}>
                      + Agregar cotización
                    </button>
                  )}
                </div>

                {/* Tabla de cotizaciones — ordenadas por precio */}
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
                    <thead>
                      <tr style={{ background:'#fafaf9' }}>
                        {['PROVEEDOR','PRECIO','TIEMPO','DISPONIBLE','FECHA',''].map(h => (
                          <th key={h} style={{ fontSize:10.5, fontWeight:700, color:'#9c9a92', textAlign:'left', padding:'8px 14px', borderBottom:'1px solid #f0eee9', letterSpacing:'.3px', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((c, i) => (
                        <tr key={c.id} style={{ borderBottom: i<g.items.length-1?'1px solid #f7f6f3':'none', background: i===0?'#f0fdf4':'#fff' }}>
                          <td style={{ padding:'10px 14px' }}>
                            <div style={{ fontSize:13, fontWeight:600 }}>{c.proveedor?.nombre || '—'}</div>
                            {c.notas && <div style={{ fontSize:11, color:'#9c9a92', marginTop:1 }}>{c.notas}</div>}
                          </td>
                          <td style={{ padding:'10px 14px' }}>
                            <div style={{ fontSize:14, fontWeight:700, fontFamily:'monospace', color: i===0?'#15803d':'#1a1916' }}>
                              {fmtCOP(c.precio)}
                              {i===0 && g.items.length>1 && <span style={{ fontSize:10, marginLeft:5, background:'#dcfce7', color:'#15803d', padding:'1px 5px', borderRadius:99, fontWeight:600 }}>MEJOR</span>}
                            </div>
                          </td>
                          <td style={{ padding:'10px 14px', fontSize:12.5, color:'#6b6860' }}>{c.tiempo_entrega || '—'}</td>
                          <td style={{ padding:'10px 14px' }}>
                            <span style={{ fontSize:12, color: c.disponible?'#15803d':'#dc2626', fontWeight:600 }}>
                              {c.disponible ? '✓ Sí' : '✗ No'}
                            </span>
                          </td>
                          <td style={{ padding:'10px 14px', fontSize:11.5, color:'#9c9a92' }}>{tiempoRelativo(c.created_at)}</td>
                          <td style={{ padding:'10px 14px' }}>
                            {esSuministro && (
                              <div style={{ display:'flex', gap:5 }}>
                                {/* ✓ Aceptar — crea pedido automáticamente */}
                                <button
                                  onClick={() => seleccionarCotizacion(c.id, c.pedido_id)}
                                  title={c.seleccionada ? 'Aceptado — click para deshacer' : 'Aceptar esta cotización y crear pedido'}
                                  style={{
                                    padding:'5px 10px', borderRadius:7,
                                    border: c.seleccionada ? 'none' : '1px solid #bbf7d0',
                                    background: c.seleccionada ? '#15803d' : '#f0fdf4',
                                    color: c.seleccionada ? '#fff' : '#15803d',
                                    fontSize:13, fontWeight:700, cursor:'pointer',
                                    transition:'all .15s',
                                  }}>
                                  ✓
                                </button>
                                {/* Label de estado */}
                                {c.seleccionada && (
                                  <span style={{ fontSize:11, color:'#15803d', fontWeight:600, alignSelf:'center', whiteSpace:'nowrap' }}>
                                    Pedido creado
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB CONTROL DE PAGOS ── */}
      {tab === 'pagos' && (
        <div>
          <div style={{ background:'#fff', border:'1px solid #e2dfd8', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #e2dfd8', fontSize:14, fontWeight:600 }}>
              Pedidos entregados — Estado de pago
            </div>
            {pedidos.length === 0 ? (
              <div style={{ padding:'32px', textAlign:'center', color:'#9c9a92', fontSize:13 }}>Sin pedidos entregados aún</div>
            ) : pedidos.map((p, i) => {
              const pagsPed    = getPagosPedido(p.id);
              const totalVal   = (p.unitario || 0) * (p.cantidad || 0);
              const totalPag   = pagsPed.reduce((a, pg) => a + pg.monto, 0);
              const saldo      = totalVal - totalPag;
              const pct        = totalVal > 0 ? Math.min((totalPag / totalVal) * 100, 100) : 0;
              const pagCompl   = saldo <= 0;
              return (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom: i<pedidos.length-1?'1px solid #f0eee9':'none', flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>
                      <span style={{ fontFamily:'monospace', color:'#9c9a92', fontSize:11 }}>#{String(p.numero).padStart(4,'0')} </span>
                      {p.repuesto}
                    </div>
                    <div style={{ fontSize:11.5, color:'#9c9a92', marginTop:1 }}>{p.marca} {p.modelo}</div>
                    {/* Barra de pago */}
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5 }}>
                      <div style={{ flex:1, height:4, background:'#f0eee9', borderRadius:99, overflow:'hidden', maxWidth:120 }}>
                        <div style={{ height:'100%', background: pagCompl?'#15803d':'#2563eb', borderRadius:99, width:pct+'%', transition:'width .4s' }} />
                      </div>
                      <span style={{ fontSize:11, color:'#9c9a92' }}>{Math.round(pct)}%</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:12.5, color:'#9c9a92' }}>Total: <strong style={{ color:'#1a1916' }}>{fmtCOP(totalVal)}</strong></div>
                    <div style={{ fontSize:12.5, color:'#15803d' }}>Pagado: {fmtCOP(totalPag)}</div>
                    {saldo > 0 && <div style={{ fontSize:12.5, color:'#dc2626', fontWeight:600 }}>Saldo: {fmtCOP(saldo)}</div>}
                    {pagCompl && <div style={{ fontSize:11.5, color:'#15803d', fontWeight:600 }}>✓ Pagado completo</div>}
                  </div>
                  {esSuministro && !pagCompl && totalVal > 0 && (
                    <button onClick={() => setModalPago(p)}
                      style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #e2dfd8', background:'#fff', fontSize:12.5, fontFamily:'inherit', cursor:'pointer', color:'#1a1916', flexShrink:0 }}>
                      💳 Pagar
                    </button>
                  )}
                  {esSuministro && pagCompl && (
                    <button onClick={() => setModalPago(p)}
                      style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #e2dfd8', background:'#f7f6f3', fontSize:12.5, fontFamily:'inherit', cursor:'pointer', color:'#9c9a92', flexShrink:0 }}>
                      Ver pagos
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB HISTORIAL DE PRECIOS ── */}
      {tab === 'historial' && (
        <div>
          <div style={{ marginBottom:14 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar repuesto…"
              style={{ width:'100%', maxWidth:400, background:'#fff', border:'1px solid #e2dfd8', borderRadius:8, padding:'8px 12px', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ background:'#fff', border:'1px solid #e2dfd8', borderRadius:12, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
              <thead>
                <tr style={{ background:'#fafaf9' }}>
                  {['REPUESTO','CALIDAD','COTIZACIONES','MÍN.','MÁX.','PROMEDIO','MEJOR PROVEEDOR','ÚLTIMO REGISTRO'].map(h => (
                    <th key={h} style={{ fontSize:10.5, fontWeight:700, color:'#9c9a92', textAlign:'left', padding:'10px 14px', borderBottom:'1px solid #e2dfd8', letterSpacing:'.3px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grupos.filter(g => !search || g.repuesto?.toLowerCase().includes(search.toLowerCase()) || g.marca?.toLowerCase().includes(search.toLowerCase())).map((g, i) => {
                  const precios    = g.items.map(c => c.precio);
                  const minP       = Math.min(...precios);
                  const maxP       = Math.max(...precios);
                  const avgP       = Math.round(precios.reduce((a,b) => a+b, 0) / precios.length);
                  const mejorProv  = g.items[0]?.proveedor?.nombre || '—';
                  const ultimaFech = g.items.reduce((latest, c) => c.created_at > latest ? c.created_at : latest, '');
                  return (
                    <tr key={g.clave} style={{ borderBottom:'1px solid #f0eee9' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fafaf9'}
                      onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ fontSize:13, fontWeight:500 }}>
                          {g.marca && <span style={{ color:'#2563eb' }}>{g.marca} </span>}
                          {g.modelo && <span style={{ color:'#6b6860' }}>{g.modelo} · </span>}
                          {g.repuesto}
                        </div>
                      </td>
                      <td style={{ padding:'10px 14px' }}><Badge label={g.calidad} bg="#f0eee9" color="#6b6860" /></td>
                      <td style={{ padding:'10px 14px', fontSize:13, textAlign:'center', fontWeight:600, color:'#7c3aed' }}>{g.items.length}</td>
                      <td style={{ padding:'10px 14px', fontSize:12.5, fontFamily:'monospace', color:'#15803d', fontWeight:700 }}>{fmtCOP(minP)}</td>
                      <td style={{ padding:'10px 14px', fontSize:12.5, fontFamily:'monospace', color:'#dc2626' }}>{fmtCOP(maxP)}</td>
                      <td style={{ padding:'10px 14px', fontSize:12.5, fontFamily:'monospace', fontWeight:600 }}>{fmtCOP(avgP)}</td>
                      <td style={{ padding:'10px 14px', fontSize:12.5, color:'#6b6860' }}>{mejorProv}</td>
                      <td style={{ padding:'10px 14px', fontSize:11.5, color:'#9c9a92' }}>{tiempoRelativo(ultimaFech)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      {modalCot && (
        <ModalCotizacion
          proveedores={proveedores}
          pedido={pedidoCot}
          onClose={() => { setModalCot(false); setPedidoCot(null); }}
          onGuardar={agregarCotizacion}
        />
      )}
      {modalPago && (
        <ModalPago
          pedido={modalPago}
          proveedores={proveedores}
          pagosExistentes={getPagosPedido(modalPago.id)}
          onClose={() => setModalPago(null)}
          onGuardar={registrarPago}
        />
      )}
    </div>
  );
}
