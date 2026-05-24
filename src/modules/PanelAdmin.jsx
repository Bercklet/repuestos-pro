// src/modules/PanelAdmin.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUsuarios, useAuditoria } from '../hooks/useData';
import { fmtCOP } from '../lib/supabase';
import { supabase } from '../lib/supabase';

const ROLES_CFG = {
  admin:      { label: 'Administrador', bg: '#ede9fe', color: '#7c3aed' },
  suministro: { label: 'Suministro',    bg: '#dbeafe', color: '#2563eb' },
  tecnico:    { label: 'Técnico',       bg: '#dcfce7', color: '#15803d' },
};

const TIPO_AUDIT = {
  crear:      { icon: '🛒', color: '#15803d', bg: '#dcfce7' },
  editar:     { icon: '✏️', color: '#2563eb', bg: '#dbeafe' },
  estado:     { icon: '🔄', color: '#7c3aed', bg: '#ede9fe' },
  usuario:    { icon: '👤', color: '#d97706', bg: '#fef3c7' },
  devolucion: { icon: '↩️', color: '#dc2626', bg: '#fee2e2' },
  sesion:     { icon: '🔐', color: '#6b6860', bg: '#f4f3f0' },
  alerta:     { icon: '⚠️', color: '#dc2626', bg: '#fff1f1' },
};

const PERMISOS = {
  tecnico:    { crear_pedido: true,  editar_precio: false, aprobar: false, ver_reportes: false, gestionar_usuarios: false, exportar: false },
  suministro: { crear_pedido: true,  editar_precio: true,  aprobar: true,  ver_reportes: true,  gestionar_usuarios: false, exportar: true  },
  admin:      { crear_pedido: true,  editar_precio: true,  aprobar: true,  ver_reportes: true,  gestionar_usuarios: true,  exportar: true  },
};

const PERMISOS_LABELS = {
  crear_pedido:       'Crear solicitudes de pedido',
  editar_precio:      'Editar precios y valores',
  aprobar:            'Aprobar cotizaciones',
  ver_reportes:       'Ver reportes financieros',
  gestionar_usuarios: 'Gestionar usuarios y roles',
  exportar:           'Exportar PDF / Excel',
};

// Formato de fecha y hora exacta para auditoría
function fmtFechaExacta(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ padding: '7px 16px', borderRadius: 8, border: 'none', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'all .15s', background: active ? '#1a1916' : 'transparent', color: active ? '#fff' : '#6b6860' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f0eee9'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      {children}
    </button>
  );
}

function Badge({ cfg }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function ModalNuevoUsuario({ onClose, onCreado }) {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'tecnico', color: '#7c3aed' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const crear = async () => {
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Todos los campos son obligatorios'); return;
    }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setGuardando(true); setError('');
    try {
      const { data, error: err } = await supabase.auth.admin.createUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        email_confirm: true,
        user_metadata: {
          nombre: form.nombre.trim(),
          rol: form.rol,
          avatar: form.nombre.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
          color: form.color,
        },
      });
      if (err) throw err;
      onCreado?.();
      onClose();
    } catch (e) {
      setError('Para crear usuarios usa el Dashboard de Supabase. Error: ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, padding: 28 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>+ Nuevo usuario</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9c9a92' }}>×</button>
        </div>
        {[
          { label: 'NOMBRE COMPLETO', key: 'nombre', placeholder: 'Maycol Infante' },
          { label: 'EMAIL', key: 'email', placeholder: 'usuario@taller.com' },
          { label: 'CONTRASEÑA TEMPORAL', key: 'password', placeholder: 'Mínimo 6 caracteres' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 4 }}>{f.label}</label>
            <input value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
              type={f.key === 'password' ? 'password' : 'text'}
              style={{ width: '100%', border: '1.5px solid #e2dfd8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 6 }}>ROL</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(ROLES_CFG).map(([k, v]) => (
              <button key={k} onClick={() => set('rol', k)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1.5px solid ' + (form.rol === k ? v.color : '#e2dfd8'), background: form.rol === k ? v.bg : '#fff', color: v.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        {error && <div style={{ padding: '8px 12px', background: '#fff1f1', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', background: '#f0eee9', color: '#6b6860', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={crear} disabled={guardando}
            style={{ flex: 2, padding: '9px', background: '#1a1916', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {guardando ? 'Creando...' : '+ Crear usuario'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL EDITAR MI PERFIL ───────────────────────────────────
function ModalEditarPerfil({ perfil, onClose, onGuardado }) {
  const [nombre, setNombre] = useState(perfil.nombre || '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async () => {
    if (!nombre.trim()) { setError('El nombre no puede estar vacío'); return; }
    setGuardando(true); setError('');
    try {
      const nombreFinal = nombre.trim();
      const avatarNuevo = nombreFinal.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const { error: err } = await supabase
        .from('perfiles')
        .update({ nombre: nombreFinal, avatar: avatarNuevo })
        .eq('id', perfil.id);
      if (err) throw err;
      onGuardado?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380, padding: 28 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>✏️ Editar mi perfil</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9c9a92' }}>×</button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 4 }}>NOMBRE COMPLETO</label>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && guardar()}
            style={{ width: '100%', border: '1.5px solid #e2dfd8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        {error && <div style={{ padding: '8px 12px', background: '#fff1f1', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', background: '#f0eee9', color: '#6b6860', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            style={{ flex: 2, padding: '9px', background: '#1a1916', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {guardando ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SeccionUsuarios() {
  const { perfil: miPerfil, esAdmin, recargarPerfil } = useAuth();
  const { usuarios, loading, actualizarUsuario, cargar } = useUsuarios();
  const [selected, setSelected] = useState(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditarPerfil, setModalEditarPerfil] = useState(false);
  const [guardando, setGuardando] = useState(null);
  const [error, setError] = useState('');

  const handleCambiarRol = async (id, nuevoRol) => {
    setGuardando(id); setError('');
    try { await actualizarUsuario(id, { rol: nuevoRol }); }
    catch (e) { setError(e.message); }
    finally { setGuardando(null); }
  };

  const handleToggleActivo = async (id, activo) => {
    setGuardando(id);
    try { await actualizarUsuario(id, { activo: !activo }); }
    catch (e) { setError(e.message); }
    finally { setGuardando(null); }
  };

  const handleEditarNombre = async (id, nombre) => {
    if (!nombre.trim()) return;
    try {
      const nombreFinal = nombre.trim();
      const avatarNuevo = nombreFinal.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
      await actualizarUsuario(id, { nombre: nombreFinal, avatar: avatarNuevo });
      if (id === miPerfil?.id) recargarPerfil?.();
    }
    catch (e) { setError(e.message); }
  };

  const handleEliminar = async (u) => {
    if (!window.confirm('¿Desactivar a ' + u.nombre + '?')) return;
    try { await actualizarUsuario(u.id, { activo: false }); cargar(); }
    catch (e) { setError(e.message); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9c9a92' }}>Cargando usuarios...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Usuarios del sistema ({usuarios.length})</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Botón para editar el propio perfil */}
          <button onClick={() => setModalEditarPerfil(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', background: '#f0eee9', color: '#6b6860', border: '1px solid #e2dfd8', cursor: 'pointer' }}>
            ✏️ Editar mi nombre
          </button>
          {esAdmin && (
            <button onClick={() => setModalNuevo(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', background: '#1a1916', color: '#fff', border: 'none', cursor: 'pointer' }}>
              + Nuevo usuario
            </button>
          )}
        </div>
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#fff1f1', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {usuarios.map(u => {
          const rolCfg = ROLES_CFG[u.rol] || ROLES_CFG.tecnico;
          const esMi = u.id === miPerfil?.id;
          const permisos = PERMISOS[u.rol] || PERMISOS.tecnico;
          const isOpen = selected?.id === u.id;
          return (
            <div key={u.id} style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onClick={() => setSelected(isOpen ? null : u)}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {u.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{u.nombre}</div>
                    {esMi && <span style={{ fontSize: 11, background: '#f0eee9', color: '#6b6860', padding: '1px 6px', borderRadius: 99 }}>Tú</span>}
                    {!u.activo && <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: 99 }}>Desactivado</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#9c9a92' }}>{u.email} · {u.pedidos_count} pedidos</div>
                </div>
                <Badge cfg={rolCfg} />
                <div style={{ fontSize: 12, color: '#9c9a92', whiteSpace: 'nowrap' }}>
                  {u.ultimo_acceso ? fmtFechaExacta(u.ultimo_acceso) : 'Sin acceso'}
                </div>
                <span style={{ fontSize: 12, color: '#9c9a92' }}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {isOpen && esAdmin && !esMi && (
                <div style={{ padding: '14px 18px', background: '#fafaf9', borderTop: '1px solid #f0eee9' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#9c9a92', marginBottom: 8 }}>CAMBIAR ROL</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {Object.entries(ROLES_CFG).map(([k, v]) => (
                          <button key={k} onClick={() => handleCambiarRol(u.id, k)} disabled={guardando === u.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: '1.5px solid ' + (u.rol === k ? v.color : '#e2dfd8'), background: u.rol === k ? v.bg : '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: u.rol === k ? 700 : 400, color: v.color }}>
                            {v.label}
                            {u.rol === k && <span style={{ marginLeft: 'auto' }}>✓</span>}
                          </button>
                        ))}
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#9c9a92', marginBottom: 6 }}>PERMISOS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {Object.entries(PERMISOS_LABELS).map(([k, label]) => (
                            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                              <span style={{ color: permisos[k] ? '#15803d' : '#d3cfc6' }}>{permisos[k] ? '✓' : '✗'}</span>
                              <span style={{ color: permisos[k] ? '#1a1916' : '#9c9a92' }}>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#9c9a92', marginBottom: 8 }}>ACCIONES</div>
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 4 }}>EDITAR NOMBRE</label>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            defaultValue={u.nombre}
                            id={'nombre-' + u.id}
                            style={{ flex: 1, border: '1.5px solid #e2dfd8', borderRadius: 7, padding: '6px 8px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                          />
                          <button
                            onClick={() => handleEditarNombre(u.id, document.getElementById('nombre-' + u.id).value)}
                            style={{ padding: '6px 10px', background: '#1a1916', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            OK
                          </button>
                        </div>
                      </div>
                      <button onClick={() => handleToggleActivo(u.id, u.activo)} disabled={guardando === u.id}
                        style={{ width: '100%', padding: '7px', borderRadius: 8, border: '1px solid ' + (u.activo ? '#fecaca' : '#bbf7d0'), background: u.activo ? '#fff1f1' : '#f0fdf4', color: u.activo ? '#dc2626' : '#15803d', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6 }}>
                        {u.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                      </button>
                      <button onClick={() => handleEliminar(u)}
                        style={{ width: '100%', padding: '7px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff1f1', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Eliminar usuario
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalNuevo && (
        <ModalNuevoUsuario
          onClose={() => setModalNuevo(false)}
          onCreado={cargar}
        />
      )}

      {modalEditarPerfil && miPerfil && (
        <ModalEditarPerfil
          perfil={miPerfil}
          onClose={() => setModalEditarPerfil(false)}
          onGuardado={() => { recargarPerfil?.(); cargar(); }}
        />
      )}
    </div>
  );
}

// ─── SECCIÓN AUDITORÍA — con fecha y hora exacta ──────────────
function SeccionAuditoria() {
  const { registros, loading } = useAuditoria({ limite: 100 });
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroModulo, setFiltroModulo] = useState('todos');

  const modulos = [...new Set(registros.map(r => r.modulo).filter(Boolean))];
  const filtered = registros.filter(r => {
    const matchTipo = filtroTipo === 'todos' || r.tipo === filtroTipo;
    const matchModulo = filtroModulo === 'todos' || r.modulo === filtroModulo;
    return matchTipo && matchModulo;
  });

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9c9a92' }}>Cargando auditoría...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Historial de actividad ({filtered.length})</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            style={{ background: '#f7f6f3', border: '1px solid #e2dfd8', borderRadius: 8, padding: '6px 10px', fontSize: 12.5, fontFamily: 'inherit', outline: 'none' }}>
            <option value="todos">Todos los tipos</option>
            {Object.keys(TIPO_AUDIT).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select value={filtroModulo} onChange={e => setFiltroModulo(e.target.value)}
            style={{ background: '#f7f6f3', border: '1px solid #e2dfd8', borderRadius: 8, padding: '6px 10px', fontSize: 12.5, fontFamily: 'inherit', outline: 'none' }}>
            <option value="todos">Todos los módulos</option>
            {modulos.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 12, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9c9a92', fontSize: 14 }}>
            Sin registros de auditoría
          </div>
        ) : filtered.map((r, i) => {
          const tipCfg = TIPO_AUDIT[r.tipo] || TIPO_AUDIT.editar;
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderBottom: i < filtered.length - 1 ? '1px solid #f0eee9' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: tipCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                {tipCfg.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{r.accion}</span>
                    {r.modulo && <span style={{ fontSize: 11, color: '#9c9a92', marginLeft: 6 }}>· {r.modulo}</span>}
                  </div>
                  {/* CORRECCIÓN: mostrar fecha y hora exacta en lugar de "hace X tiempo" */}
                  <span style={{ fontSize: 11, color: '#6b6860', whiteSpace: 'nowrap', fontFamily: 'monospace', background: '#f7f6f3', padding: '2px 6px', borderRadius: 5 }}>
                    {fmtFechaExacta(r.created_at)}
                  </span>
                </div>
                {r.detalle && <div style={{ fontSize: 12, color: '#6b6860', marginTop: 2 }}>{r.detalle}</div>}
                {r.usuario && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: r.usuario.color || '#e2dfd8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>
                      {r.usuario.avatar || '?'}
                    </div>
                    <span style={{ fontSize: 11, color: '#9c9a92' }}>{r.usuario.nombre} · {ROLES_CFG[r.usuario.rol]?.label || r.usuario.rol}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SECCIÓN REPORTES — corregido useEffect + cálculo correcto ─
function SeccionReportes() {
  const [reporteData, setReporteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // CORRECCIÓN: useEffect con [] para que solo se ejecute UNA vez
    const cargar = async () => {
      try {
        const [
          { data: pedidos, error: errP },
          { data: repuestos, error: errR },
          { data: proveedores, error: errProv },
        ] = await Promise.all([
          supabase
            .from('pedidos')
            .select('estado, prioridad, unitario, cantidad, devueltos, created_at')
            .order('created_at', { ascending: false })
            .limit(500),
          supabase
            .from('repuestos')
            .select('solicitudes, categoria, nombre')
            .order('solicitudes', { ascending: false })
            .limit(10),
          supabase
            .from('proveedores')
            .select('nombre, rating, estado')
            .eq('estado', 'activo'),
        ]);

        if (errP || errR || errProv) throw errP || errR || errProv;

        // CORRECCIÓN DE CÁLCULO:
        // - Gastado real = solo pedidos ENTREGADOS
        // - Devuelto = pedidos en estado DEVUELTO
        // - No consigue / pendiente / pedido = NO se cuentan en el gasto
        const totalGasto = (pedidos || [])
          .filter(p => p.estado === 'entregado')
          .reduce((a, p) => a + (p.unitario || 0) * (p.cantidad || 0), 0);

        const totalDev = (pedidos || [])
          .filter(p => p.estado === 'devuelto')
          .reduce((a, p) => a + ((p.devueltos || p.cantidad || 0) * (p.unitario || 0)), 0);

        // Agrupación mensual — solo entregados para el gasto real
        const meses = {};
        (pedidos || []).forEach(p => {
          const fecha = new Date(p.created_at);
          const key = fecha.toLocaleDateString('es-CO', { year: 'numeric', month: 'short' });
          if (!meses[key]) meses[key] = { gastado: 0, devuelto: 0, label: fecha.toLocaleDateString('es-CO', { month: 'short' }) };
          if (p.estado === 'entregado') meses[key].gastado += (p.unitario || 0) * (p.cantidad || 0);
          if (p.estado === 'devuelto')  meses[key].devuelto += ((p.devueltos || p.cantidad || 0) * (p.unitario || 0));
        });

        setReporteData({
          totalGasto,
          totalDev,
          meses,
          repuestos: repuestos || [],
          proveedores: proveedores || [],
          totalPedidos: pedidos?.length || 0,
          totalEntregados: (pedidos || []).filter(p => p.estado === 'entregado').length,
        });
      } catch (e) {
        setError(e.message || 'Error al cargar reportes');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []); // ← Array vacío: solo ejecutar al montar

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#9c9a92' }}>
      <div style={{ width: 28, height: 28, border: '3px solid #e2dfd8', borderTopColor: '#1a1916', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 12px' }} />
      Calculando reportes...
    </div>
  );

  if (error) return (
    <div style={{ padding: '16px', background: '#fff1f1', border: '1px solid #fecaca', borderRadius: 12, fontSize: 13, color: '#dc2626' }}>
      ⚠️ Error cargando reportes: {error}
    </div>
  );

  if (!reporteData) return null;

  // Ordenar meses cronológicamente, tomar últimos 6
  const mesesArr = Object.entries(reporteData.meses)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .slice(-6);
  const maxGasto = Math.max(...mesesArr.map(([, v]) => v.gastado), 1);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'PEDIDOS TOTALES', val: reporteData.totalPedidos,               icon: '📋', bg: '#dbeafe', c: '#2563eb' },
          { label: 'ENTREGADOS',      val: reporteData.totalEntregados,             icon: '📦', bg: '#dcfce7', c: '#15803d' },
          { label: 'GASTO REAL',      val: fmtCOP(reporteData.totalGasto),          icon: '💰', bg: '#dcfce7', c: '#15803d' },
          { label: 'DEVUELTO',        val: fmtCOP(reporteData.totalDev),            icon: '↩️', bg: '#fee2e2', c: '#dc2626' },
          { label: 'PROVEEDORES',     val: reporteData.proveedores.length,          icon: '🏪', bg: '#ede9fe', c: '#7c3aed' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9c9a92', letterSpacing: '.3px' }}>{k.label}</span>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{k.icon}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.c }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Nota aclaratoria */}
      <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 12, color: '#15803d', marginBottom: 20 }}>
        ℹ️ <strong>Gasto real</strong>: solo pedidos con estado <strong>Entregado</strong>. Los pedidos devueltos, no conseguidos o pendientes no se cuentan.
      </div>

      {/* Gráfico mensual */}
      {mesesArr.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📊 Gasto mensual (solo entregados)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
            {mesesArr.map(([, vals]) => (
              <div key={vals.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 100, gap: 2 }}>
                  {vals.devuelto > 0 && (
                    <div style={{ width: '100%', height: Math.max((vals.devuelto / maxGasto) * 100, 3), background: '#fecaca', borderRadius: '4px 4px 0 0', minHeight: 3 }} title={`Devuelto: ${fmtCOP(vals.devuelto)}`} />
                  )}
                  <div style={{ width: '100%', height: Math.max((vals.gastado / maxGasto) * 100, 4), background: '#2563eb', borderRadius: vals.devuelto ? 0 : '4px 4px 0 0', minHeight: 4 }} title={`Entregado: ${fmtCOP(vals.gastado)}`} />
                </div>
                <div style={{ fontSize: 10.5, color: '#9c9a92', textAlign: 'center' }}>{vals.label}</div>
                <div style={{ fontSize: 10, color: '#6b6860', fontFamily: 'monospace', textAlign: 'center' }}>{fmtCOP(vals.gastado)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b6860' }}>
              <div style={{ width: 10, height: 10, background: '#2563eb', borderRadius: 2 }} /> Entregado
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b6860' }}>
              <div style={{ width: 10, height: 10, background: '#fecaca', borderRadius: 2 }} /> Devuelto
            </div>
          </div>
        </div>
      )}

      {/* Top repuestos */}
      {reporteData.repuestos.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2dfd8', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>🔧 Repuestos más solicitados</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reporteData.repuestos.slice(0, 6).map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f0eee9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#6b6860', flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, fontSize: 13 }}>{r.nombre || r.categoria}</div>
                <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, flexShrink: 0 }}>{r.solicitudes} sol.</div>
                <div style={{ width: 80, height: 4, background: '#f0eee9', borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ height: '100%', background: '#2563eb', borderRadius: 99, width: ((r.solicitudes / (reporteData.repuestos[0]?.solicitudes || 1)) * 100) + '%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PanelAdmin({ tab: tabInicial = 'usuarios' }) {
  const { esAdmin, esSuministro } = useAuth();
  const [tab, setTab] = useState(tabInicial);

  if (!esSuministro) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#9c9a92', fontFamily: "'DM Sans', system-ui" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>Acceso restringido</div>
      <div style={{ fontSize: 13, marginTop: 6 }}>Solo administradores y suministro pueden ver este panel</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f7f6f3', minHeight: '100vh', padding: 24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 14 }}>
          {tab === 'usuarios' ? 'Gestión de Usuarios' : tab === 'auditoria' ? 'Auditoría del Sistema' : 'Reportes'}
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#fff', border: '1px solid #e2dfd8', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {esAdmin && <TabBtn active={tab === 'usuarios'} onClick={() => setTab('usuarios')}>Usuarios</TabBtn>}
          <TabBtn active={tab === 'auditoria'} onClick={() => setTab('auditoria')}>Auditoría</TabBtn>
          <TabBtn active={tab === 'reportes'} onClick={() => setTab('reportes')}>Reportes</TabBtn>
        </div>
      </div>

      {tab === 'usuarios'  && <SeccionUsuarios />}
      {tab === 'auditoria' && <SeccionAuditoria />}
      {tab === 'reportes'  && <SeccionReportes />}
    </div>
  );
}
