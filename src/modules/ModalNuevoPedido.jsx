// src/components/ModalNuevoPedido.jsx
// Modal con soporte multi-ítem: agrega varios repuestos de una vez
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sugerirMarcasCompleto, sugerirModelosCompleto, sugerirComponentes, guardarMarcaPersonalizada, MARCAS } from '../lib/marcas';

const PRIORIDADES = {
  urgente: { label: 'Urgente', bg: '#fee2e2', color: '#dc2626' },
  alta:    { label: 'Alta',    bg: '#fef3c7', color: '#d97706' },
  normal:  { label: 'Normal',  bg: '#f4f3f0', color: '#9c9a92' },
};

const ITEM_VACIO = () => ({
  id:           Date.now() + Math.random(),
  marca:        '',
  modelo:       '',
  repuesto:     '',
  tipo:         'OEM',
  cantidad:     1,
  otraMarca:    '',
  otroModelo:   '',
  otroComp:     '',
});

// ── AutoInput ─────────────────────────────────────────────────
function AutoInput({ label, value, onChange, sugerir, placeholder, disabled, compact }) {
  const [open, setOpen]   = useState(false);
  const [lista, setLista] = useState([]);
  const ref               = useRef(null);

  useEffect(() => { setLista(sugerir(value)); }, [value]);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pad = compact ? '6px 8px' : '8px 10px';
  const fsz = compact ? 12 : 13;

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 3 }}>{label}</label>}
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); e.stopPropagation(); }}}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        style={{ width: '100%', border: '1.5px solid #e2dfd8', borderRadius: 7, padding: pad, fontSize: fsz, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: disabled ? '#f7f6f3' : '#fff' }}
      />
      {open && !disabled && lista.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, background: '#fff', border: '1px solid #e2dfd8', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,.12)', zIndex: 9999, maxHeight: 180, overflowY: 'auto' }}>
          {lista.map((item, i) => (
            <div key={i}
              onMouseDown={e => { e.preventDefault(); onChange(item); setOpen(false); }}
              style={{ padding: '7px 11px', fontSize: fsz, cursor: 'pointer', borderBottom: i < lista.length - 1 ? '1px solid #f7f6f3' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f7f6f3'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FILA DE ÍTEM ──────────────────────────────────────────────
function FilaItem({ item, index, total, onChange, onRemove }) {
  const set = (k, v) => onChange(item.id, k, v);

  const esOtraMarca  = item.marca    === 'Otras marcas';
  const esOtroModelo = item.modelo   === 'Otro modelo (especificar en observaciones)';
  const esOtroComp   = item.repuesto === 'Otro componente (especificar)';

  const marcaReal    = esOtraMarca  ? item.otraMarca  : item.marca;
  const modeloReal   = esOtroModelo ? item.otroModelo : item.modelo;
  const repuestoReal = esOtroComp   ? item.otroComp   : item.repuesto;
  const refLabel     = [marcaReal, modeloReal, repuestoReal].filter(Boolean).join(' › ');

  return (
    <div style={{ background: index % 2 === 0 ? '#fafaf9' : '#fff', border: '1.5px solid #e2dfd8', borderRadius: 10, padding: '12px 14px', position: 'relative' }}>
      {/* Número + botón eliminar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9c9a92', background: '#f0eee9', padding: '1px 8px', borderRadius: 99 }}>
          Ítem {index + 1}
        </span>
        {total > 1 && (
          <button onClick={() => onRemove(item.id)}
            style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#dc2626', lineHeight: 1, padding: '0 2px' }}
            title="Eliminar ítem">
            ×
          </button>
        )}
      </div>

      {/* Fila Marca + Modelo */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <AutoInput label="MARCA" value={item.marca}
          onChange={v => { set('marca', v); set('modelo', ''); set('otraMarca', ''); }}
          sugerir={sugerirMarcasCompleto} placeholder="Samsung…" compact />
        <AutoInput label="MODELO" value={item.modelo}
          onChange={v => { set('modelo', v); set('otroModelo', ''); }}
          sugerir={v => sugerirModelosCompleto(esOtraMarca ? item.otraMarca : item.marca, v)}
          placeholder={marcaReal ? `Modelo de ${marcaReal}…` : 'Modelo…'} compact />
      </div>

      {/* Campos "otro" para marca/modelo */}
      {esOtraMarca && (
        <input value={item.otraMarca} onChange={e => set('otraMarca', e.target.value)}
          placeholder="Nombre de la marca"
          style={{ width: '100%', border: '1.5px solid #d97706', borderRadius: 7, padding: '6px 8px', fontSize: 12, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
      )}
      {esOtroModelo && (
        <input value={item.otroModelo} onChange={e => set('otroModelo', e.target.value)}
          placeholder="Modelo exacto"
          style={{ width: '100%', border: '1.5px solid #d97706', borderRadius: 7, padding: '6px 8px', fontSize: 12, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
      )}

      {/* Componente + Cantidad + Tipo */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <AutoInput label="COMPONENTE *" value={item.repuesto}
          onChange={v => { set('repuesto', v); set('otroComp', ''); }}
          sugerir={sugerirComponentes} placeholder="Pantalla, Batería…" compact />
        <div style={{ width: 70, flexShrink: 0 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 3 }}>CANT.</label>
          <input type="number" min="1" value={item.cantidad}
            onChange={e => set('cantidad', Math.max(1, Number(e.target.value)))}
            style={{ width: '100%', border: '1.5px solid #e2dfd8', borderRadius: 7, padding: '6px 8px', fontSize: 13, fontFamily: 'inherit', outline: 'none', fontWeight: 700, textAlign: 'center' }} />
        </div>
        <div style={{ width: 100, flexShrink: 0 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 3 }}>TIPO</label>
          <select value={item.tipo} onChange={e => set('tipo', e.target.value)}
            style={{ width: '100%', border: '1.5px solid #e2dfd8', borderRadius: 7, padding: '6px 6px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}>
            {['Original','OEM','Genérico','Recuperado'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {esOtroComp && (
        <input value={item.otroComp} onChange={e => set('otroComp', e.target.value)}
          placeholder="Describe el componente"
          style={{ width: '100%', border: '1.5px solid #d97706', borderRadius: 7, padding: '6px 8px', fontSize: 12, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
      )}

      {/* Preview referencia */}
      {refLabel && (
        <div style={{ fontSize: 11.5, color: '#15803d', fontWeight: 500, marginTop: 4 }}>
          📦 {refLabel}
        </div>
      )}
    </div>
  );
}

// ── MODAL PRINCIPAL ───────────────────────────────────────────
export default function ModalNuevoPedido({ onClose, onCrear }) {
  const { perfil } = useAuth();
  const [items,      setItems]      = useState([ITEM_VACIO()]);
  const [prioridad,  setPrioridad]  = useState('normal');
  const [obsGlobal,  setObs]        = useState('');
  const [guardando,  setGuardando]  = useState(false);
  const [error,      setError]      = useState('');
  const [creados,    setCreados]    = useState(0);

  // Cerrar con Escape
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const agregarItem  = () => setItems(prev => [...prev, ITEM_VACIO()]);
  const eliminarItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const cambiarItem  = (id, k, v) => setItems(prev => prev.map(i => i.id === id ? { ...i, [k]: v } : i));

  // Total de unidades sumando todas las cantidades
  const totalUnidades = items.reduce((a, i) => a + Number(i.cantidad || 1), 0);

  const crear = async () => {
    // Validar que todos los ítems tengan componente
    const invalido = items.find(i => {
      const comp = i.repuesto === 'Otro componente (especificar)' ? i.otroComp : i.repuesto;
      return !comp?.trim();
    });
    if (invalido) { setError('Todos los ítems deben tener un componente/repuesto'); return; }

    setGuardando(true); setError(''); setCreados(0);

    try {
      let count = 0;
      for (const item of items) {
        const marcaFinal    = item.marca    === 'Otras marcas'                             ? item.otraMarca.trim()  : item.marca;
        const modeloFinal   = item.modelo   === 'Otro modelo (especificar en observaciones)' ? item.otroModelo.trim() : item.modelo;
        const repuestoFinal = item.repuesto === 'Otro componente (especificar)'              ? item.otroComp.trim()  : item.repuesto;

        // Guardar marca/modelo nuevo en localStorage
        if (marcaFinal && !MARCAS.includes(marcaFinal)) guardarMarcaPersonalizada(marcaFinal, modeloFinal);
        else if (marcaFinal && modeloFinal)              guardarMarcaPersonalizada(marcaFinal, modeloFinal);

        await onCrear({
          repuesto:      repuestoFinal,
          marca:         marcaFinal,
          modelo:        modeloFinal,
          tipo:          item.tipo,
          cantidad:      Number(item.cantidad),
          prioridad,
          observaciones: obsGlobal,
          tecnico_id:    perfil.id,
        });
        count++;
        setCreados(count);
      }
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '94vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
        onMouseDown={e => e.stopPropagation()}>

        {/* Header fijo */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #e2dfd8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>+ Nuevo pedido</div>
            <div style={{ fontSize: 12, color: '#9c9a92', marginTop: 2 }}>
              {items.length} ítem{items.length > 1 ? 's' : ''} · {totalUnidades} unidad{totalUnidades > 1 ? 'es' : ''} en total
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9c9a92', lineHeight: 1 }}>×</button>
        </div>

        {/* Ítems */}
        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
          {items.map((item, index) => (
            <FilaItem key={item.id} item={item} index={index} total={items.length}
              onChange={cambiarItem} onRemove={eliminarItem} />
          ))}

          {/* Botón agregar ítem */}
          <button onClick={agregarItem}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 9, border: '1.5px dashed #d3cfc6', background: 'transparent', color: '#6b6860', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a1916'; e.currentTarget.style.color = '#1a1916'; e.currentTarget.style.background = '#f7f6f3'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d3cfc6'; e.currentTarget.style.color = '#6b6860'; e.currentTarget.style.background = 'transparent'; }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Agregar otro repuesto
          </button>
        </div>

        {/* Footer con prioridad, observaciones y botones */}
        <div style={{ padding: '14px 22px 20px', borderTop: '1px solid #e2dfd8', flexShrink: 0 }}>
          {/* Prioridad global */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 6 }}>PRIORIDAD (todos los ítems)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(PRIORIDADES).map(([k, v]) => (
                <button key={k} onClick={() => setPrioridad(k)}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: `1.5px solid ${prioridad === k ? v.color : '#e2dfd8'}`, background: prioridad === k ? v.bg : '#fff', color: v.color, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Observaciones globales */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 4 }}>OBSERVACIONES</label>
            <textarea value={obsGlobal} onChange={e => setObs(e.target.value)}
              rows={2} placeholder="Descripción del daño, urgencia, referencia adicional…"
              style={{ width: '100%', border: '1.5px solid #e2dfd8', borderRadius: 8, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Resumen */}
          {items.length > 1 && (
            <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12.5, color: '#15803d', marginBottom: 12 }}>
              📋 Se crearán <strong>{items.length} pedidos</strong> con <strong>{totalUnidades} unidades</strong> en total
            </div>
          )}

          {/* Progreso al crear */}
          {guardando && items.length > 1 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b6860', marginBottom: 4 }}>
                <span>Creando pedidos…</span>
                <span>{creados}/{items.length}</span>
              </div>
              <div style={{ height: 4, background: '#f0eee9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#1a1916', borderRadius: 99, width: `${(creados / items.length) * 100}%`, transition: 'width .3s' }} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: '8px 12px', background: '#fff1f1', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 12 }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '10px', background: '#f0eee9', color: '#6b6860', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancelar
            </button>
            <button onClick={crear} disabled={guardando}
              style={{ flex: 2, padding: '10px', background: '#1a1916', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: guardando ? 0.7 : 1 }}>
              {guardando ? `Creando ${creados}/${items.length}…` : `+ Crear ${items.length > 1 ? `${items.length} pedidos` : 'pedido'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
