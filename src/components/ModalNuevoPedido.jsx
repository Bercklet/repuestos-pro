// src/components/ModalNuevoPedido.jsx
// Modal compartido para crear pedidos — usado en Dashboard y en Pedidos
// Correcciones:
//  - No se cierra al seleccionar sugerencia (onMouseDown en vez de onClick)
//  - Solo cierra con: botón X, Cancelar, tecla Escape, o al crear con éxito
//  - Guarda marcas/modelos nuevos en localStorage para sugerencias futuras
//  - Opción "Otras marcas" y "Otro componente" con campo libre
//  - Autocompletado inteligente por marca seleccionada
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sugerirMarcasCompleto, sugerirModelosCompleto, sugerirComponentes, guardarMarcaPersonalizada, MARCAS } from '../lib/marcas';

const PRIORIDADES = {
  urgente: { label: 'Urgente', bg: '#fee2e2', color: '#dc2626' },
  alta:    { label: 'Alta',    bg: '#fef3c7', color: '#d97706' },
  normal:  { label: 'Normal',  bg: '#f4f3f0', color: '#9c9a92' },
};

// ── AutoInput — NO se cierra al seleccionar ───────────────────
function AutoInput({ label, value, onChange, sugerir, placeholder, disabled }) {
  const [open, setOpen]   = useState(false);
  const [lista, setLista] = useState([]);
  const ref               = useRef(null);
  const inputRef          = useRef(null);

  // Recalcular lista cuando cambia el valor
  useEffect(() => {
    const res = sugerir(value);
    setLista(res);
  }, [value]);

  // Cerrar solo al click FUERA del contenedor
  useEffect(() => {
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Cerrar con Escape
  const handleKeyDown = e => {
    if (e.key === 'Escape') { setOpen(false); e.stopPropagation(); }
    if (e.key === 'ArrowDown' && lista.length > 0) setOpen(true);
  };

  const seleccionar = (item) => {
    onChange(item);
    setOpen(false);
    // Foco al siguiente campo
    setTimeout(() => inputRef.current?.blur(), 50);
  };

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        ref={inputRef}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        style={{
          width: '100%', border: '1.5px solid #e2dfd8', borderRadius: 8,
          padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none',
          boxSizing: 'border-box', background: disabled ? '#f7f6f3' : '#fff',
          color: disabled ? '#9c9a92' : '#1a1916',
        }}
      />
      {open && !disabled && lista.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0,
          background: '#fff', border: '1px solid #e2dfd8', borderRadius: 9,
          boxShadow: '0 6px 20px rgba(0,0,0,.12)', zIndex: 9999,
          maxHeight: 200, overflowY: 'auto',
        }}>
          {lista.map((item, i) => (
            <div key={i}
              // onMouseDown en lugar de onClick → el input no pierde foco primero
              onMouseDown={e => { e.preventDefault(); seleccionar(item); }}
              style={{ padding: '9px 12px', fontSize: 13, cursor: 'pointer', borderBottom: i < lista.length - 1 ? '1px solid #f7f6f3' : 'none' }}
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

// ── MODAL PRINCIPAL ───────────────────────────────────────────
export default function ModalNuevoPedido({ onClose, onCrear }) {
  const { perfil } = useAuth();
  const [form, setForm] = useState({
    marca: '', modelo: '', repuesto: '', tipo: 'OEM',
    cantidad: 1, prioridad: 'normal', observaciones: '',
  });
  const [otraMarca,    setOtraMarca]    = useState('');
  const [otroModelo,   setOtroModelo]   = useState('');
  const [otroComp,     setOtroComp]     = useState('');
  const [guardando,    setGuardando]    = useState(false);
  const [error,        setError]        = useState('');

  const set = useCallback((k, v) => setForm(prev => ({ ...prev, [k]: v })), []);

  // Cerrar SOLO con Escape — el overlay llama a onClose directamente
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  // Valores finales (resolviendo "otras" opciones)
  const marcaFinal    = form.marca    === 'Otras marcas'            ? otraMarca.trim()  : form.marca;
  const modeloFinal   = form.modelo   === 'Otro modelo (especificar en observaciones)' ? otroModelo.trim() : form.modelo;
  const repuestoFinal = form.repuesto === 'Otro componente (especificar)'              ? otroComp.trim()   : form.repuesto;

  const crear = async () => {
    if (!repuestoFinal) { setError('El componente/repuesto es obligatorio'); return; }
    setGuardando(true); setError('');
    try {
      // Guardar en localStorage si es marca/modelo nuevo (no está en catálogo)
      if (marcaFinal && !MARCAS.includes(marcaFinal)) {
        guardarMarcaPersonalizada(marcaFinal, modeloFinal);
      } else if (marcaFinal && modeloFinal) {
        guardarMarcaPersonalizada(marcaFinal, modeloFinal);
      }
      await onCrear({
        repuesto:      repuestoFinal,
        marca:         marcaFinal,
        modelo:        modeloFinal,
        tipo:          form.tipo,
        cantidad:      Number(form.cantidad),
        prioridad:     form.prioridad,
        observaciones: form.observaciones,
        tecnico_id:    perfil.id,
      });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const esOtraMarca  = form.marca    === 'Otras marcas';
  const esOtroModelo = form.modelo   === 'Otro modelo (especificar en observaciones)';
  const esOtroComp   = form.repuesto === 'Otro componente (especificar)';

  const refFinal     = [marcaFinal, modeloFinal, repuestoFinal].filter(Boolean).join(' › ');

  return (
    // CRÍTICO: stopPropagation en el contenedor para que clicks internos
    // no lleguen al overlay y cierren el modal
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
        zIndex: 300, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 16,
      }}
      // El overlay SÍ cierra — pero solo si el click llega directamente aquí
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, width: '100%',
          maxWidth: 500, maxHeight: '92vh', overflowY: 'auto', padding: 28,
        }}
        // Detener propagación para que clicks dentro NO cierren el modal
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>+ Nuevo pedido</div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9c9a92', lineHeight: 1, padding: '0 4px' }}>
            ×
          </button>
        </div>

        {/* MARCA */}
        <AutoInput
          label="MARCA"
          value={form.marca}
          onChange={v => { set('marca', v); set('modelo', ''); setOtraMarca(''); }}
          sugerir={sugerirMarcasCompleto}
          placeholder="Ej: Samsung, iPhone, Xiaomi…"
        />
        {/* Campo libre si eligió Otras marcas */}
        {esOtraMarca && (
          <div style={{ marginTop: -8, marginBottom: 12 }}>
            <input
              value={otraMarca}
              onChange={e => setOtraMarca(e.target.value)}
              placeholder="Escribe el nombre de la marca"
              autoFocus
              style={{ width: '100%', border: '1.5px solid #d97706', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: '#d97706', marginTop: 3 }}>✨ Se guardará para sugerencias futuras</div>
          </div>
        )}

        {/* MODELO */}
        <AutoInput
          label="MODELO"
          value={form.modelo}
          onChange={v => { set('modelo', v); setOtroModelo(''); }}
          sugerir={v => sugerirModelosCompleto(esOtraMarca ? otraMarca : form.marca, v)}
          placeholder={(esOtraMarca ? otraMarca : form.marca) ? `Modelos de ${esOtraMarca ? otraMarca : form.marca}…` : 'Primero selecciona una marca'}
        />
        {esOtroModelo && (
          <div style={{ marginTop: -8, marginBottom: 12 }}>
            <input
              value={otroModelo}
              onChange={e => setOtroModelo(e.target.value)}
              placeholder="Escribe el modelo exacto"
              style={{ width: '100%', border: '1.5px solid #d97706', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: '#d97706', marginTop: 3 }}>✨ Se guardará para sugerencias futuras</div>
          </div>
        )}

        {/* COMPONENTE */}
        <AutoInput
          label="COMPONENTE / REPUESTO *"
          value={form.repuesto}
          onChange={v => { set('repuesto', v); setOtroComp(''); }}
          sugerir={sugerirComponentes}
          placeholder="Ej: Pantalla completa, Batería…"
        />
        {esOtroComp && (
          <div style={{ marginTop: -8, marginBottom: 12 }}>
            <input
              value={otroComp}
              onChange={e => setOtroComp(e.target.value)}
              placeholder="Describe el componente"
              style={{ width: '100%', border: '1.5px solid #d97706', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Preview referencia */}
        {refFinal && (
          <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12.5, color: '#15803d', marginBottom: 12, fontWeight: 500 }}>
            📦 <strong>{refFinal}</strong>
          </div>
        )}

        {/* Cantidad + Tipo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 4 }}>CANTIDAD</label>
            <input
              type="number" min="1" value={form.cantidad}
              onChange={e => set('cantidad', e.target.value)}
              style={{ width: '100%', border: '1.5px solid #e2dfd8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 4 }}>TIPO / CALIDAD</label>
            <select
              value={form.tipo} onChange={e => set('tipo', e.target.value)}
              style={{ width: '100%', border: '1.5px solid #e2dfd8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
              {['Original', 'OEM', 'Genérico', 'Recuperado'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Prioridad */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 6 }}>PRIORIDAD</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(PRIORIDADES).map(([k, v]) => (
              <button key={k} onClick={() => set('prioridad', k)}
                style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: `1.5px solid ${form.prioridad === k ? v.color : '#e2dfd8'}`, background: form.prioridad === k ? v.bg : '#fff', color: v.color, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Observaciones */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 4 }}>OBSERVACIONES</label>
          <textarea
            value={form.observaciones}
            onChange={e => set('observaciones', e.target.value)}
            rows={2}
            placeholder="Descripción del daño, urgencia, referencia adicional…"
            style={{ width: '100%', border: '1.5px solid #e2dfd8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {error && (
          <div style={{ padding: '8px 12px', background: '#fff1f1', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 12 }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '10px', background: '#f0eee9', color: '#6b6860', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button
            onClick={crear} disabled={guardando}
            style={{ flex: 2, padding: '10px', background: '#1a1916', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: guardando ? 0.7 : 1 }}>
            {guardando ? 'Creando…' : '+ Crear pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}
