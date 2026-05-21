// src/modules/AuthSystem.jsx
// Login real con Supabase Auth — sin datos mock, sin setTimeout falso
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ROL_CFG = {
  admin:      { label: 'Administrador', icon: '🛡️', desc: 'Control total del sistema',       color: '#7c3aed', bg: '#f5f3ff' },
  suministro: { label: 'Suministro',    icon: '📦', desc: 'Cotizaciones y gestión de precios', color: '#2563eb', bg: '#eff4ff' },
  tecnico:    { label: 'Técnico',       icon: '🔧', desc: 'Crear solicitudes de repuestos',   color: '#15803d', bg: '#f0fdf4' },
};

// ─── INPUT ────────────────────────────────────────────────────
function Input({ label, type = 'text', value, onChange, placeholder, error, icon, right }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 5 }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: focused ? '#1a1916' : '#9c9a92', pointerEvents: 'none', transition: 'color .15s' }}>{icon}</span>}
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          autoComplete={type === 'password' ? 'current-password' : 'email'}
          style={{
            width: '100%', background: '#fff',
            border: `1.5px solid ${error ? '#dc2626' : focused ? '#1a1916' : '#e2dfd8'}`,
            borderRadius: 10, padding: `9px ${right ? '40px' : '12px'} 9px ${icon ? '36px' : '12px'}`,
            fontSize: 14, fontFamily: 'inherit', color: '#1a1916', outline: 'none',
            transition: 'border-color .15s, box-shadow .15s',
            boxShadow: focused && !error ? '0 0 0 3px rgba(26,25,22,.07)' : 'none',
          }}
        />
        {right && <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)' }}>{right}</span>}
      </div>
      {error && <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>⚠ {error}</div>}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────
function LoginView({ onForgot }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [passErr, setPassErr]   = useState('');
  const [showForm, setShowForm] = useState(false);

  // Cargar accesos guardados del localStorage
  const [accesosGuardados, setAccesosGuardados] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rp_accesos') || '[]');
    } catch { return []; }
  });

  const handleLogin = async (emailLogin, passwordLogin) => {
    setError(''); setEmailErr(''); setPassErr('');
    const em = emailLogin || email;
    const pw = passwordLogin || password;
    if (!em)              { setEmailErr('El correo es obligatorio'); return; }
    if (!em.includes('@')){ setEmailErr('Correo invalido'); return; }
    if (!pw)              { setPassErr('La contrasena es obligatoria'); return; }

    setLoading(true);
    try {
      await login(em.trim().toLowerCase(), pw);
      // Guardar acceso en localStorage
      const accesos = JSON.parse(localStorage.getItem('rp_accesos') || '[]');
      const yaExiste = accesos.find(a => a.email === em.trim().toLowerCase());
      if (!yaExiste) {
        accesos.push({ email: em.trim().toLowerCase(), password: pw });
        localStorage.setItem('rp_accesos', JSON.stringify(accesos));
      }
    } catch (err) {
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('invalid') || msg.includes('credentials')) {
        setError('Correo o contrasena incorrectos.');
      } else {
        setError(err.message || 'Error al iniciar sesion');
      }
    } finally {
      setLoading(false);
    }
  };

  const eliminarAcceso = (emailEliminar) => {
    const nuevos = accesosGuardados.filter(a => a.email !== emailEliminar);
    localStorage.setItem('rp_accesos', JSON.stringify(nuevos));
    setAccesosGuardados(nuevos);
  };

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 52, height: 52, background: '#1a1916', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px' }}>🔩</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>RepuestosPRO</div>
        <div style={{ fontSize: 14, color: '#9c9a92' }}>Inicia sesion en tu cuenta</div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fff1f1', border: '1px solid #fecaca', borderRadius: 9, marginBottom: 16, fontSize: 13, color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Accesos guardados */}
      {accesosGuardados.length > 0 && !showForm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#9c9a92', fontWeight: 600, marginBottom: 4 }}>ACCESO RAPIDO</div>
          {accesosGuardados.map(acc => (
            <div key={acc.email} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => handleLogin(acc.email, acc.password)}
                disabled={loading}
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#fff', border: '1.5px solid #e2dfd8', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', opacity: loading ? .6 : 1, transition: 'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#1a1916'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2dfd8'}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1916', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {acc.email.split('@')[0].slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1916' }}>{acc.email}</div>
                  <div style={{ fontSize: 11.5, color: '#9c9a92' }}>Toca para entrar</div>
                </div>
                <span style={{ fontSize: 16, color: '#9c9a92' }}>→</span>
              </button>
              <button
                onClick={() => eliminarAcceso(acc.email)}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2dfd8', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#9c9a92', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                title="Eliminar acceso guardado">
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => setShowForm(true)}
            style={{ padding: '9px', background: 'transparent', color: '#6b6860', border: '1px dashed #d3cfc6', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', marginTop: 4 }}>
            + Agregar otra cuenta
          </button>
        </div>
      )}

      {/* Formulario — visible si no hay accesos guardados o el usuario quiere agregar */}
      {(accesosGuardados.length === 0 || showForm) && (
        <div>
          {showForm && (
            <button onClick={() => setShowForm(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6b6860', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
              ← Volver
            </button>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 5 }}>Correo electronico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@taller.com"
              style={{ width: '100%', border: '1.5px solid ' + (emailErr ? '#dc2626' : '#e2dfd8'), borderRadius: 10, padding: '9px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            {emailErr && <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{emailErr}</div>}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6b6860', display: 'block', marginBottom: 5 }}>Contrasena</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', border: '1.5px solid ' + (passErr ? '#dc2626' : '#e2dfd8'), borderRadius: 10, padding: '9px 40px 9px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#9c9a92', padding: 0 }}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            {passErr && <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{passErr}</div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -12, marginBottom: 20 }}>
            <span onClick={onForgot} style={{ fontSize: 13, color: '#2563eb', cursor: 'pointer', fontWeight: 500 }}>Olvide mi contrasena</span>
          </div>
          <button onClick={() => handleLogin()} disabled={loading}
            style={{ width: '100%', padding: '11px', background: loading ? '#9c9a92' : '#1a1916', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? 'Verificando...' : 'Iniciar sesion →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── RECUPERAR PASSWORD ───────────────────────────────────────
function ForgotView({ onBack }) {
  const { recuperarPassword } = useAuth();
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');

  const handleSend = async () => {
    if (!email.includes('@')) { setError('Correo inválido'); return; }
    setLoading(true); setError('');
    try {
      await recuperarPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Revisa tu correo</div>
      <div style={{ fontSize: 14, color: '#6b6860', marginBottom: 24 }}>Enviamos instrucciones para restablecer tu contraseña a <strong>{email}</strong></div>
      <button onClick={onBack} style={{ padding: '9px 20px', background: '#1a1916', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Volver al login</button>
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6b6860', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>← Volver</button>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Recuperar contraseña</div>
      <div style={{ fontSize: 14, color: '#9c9a92', marginBottom: 24 }}>Ingresa tu correo y te enviamos un enlace de recuperación.</div>
      {error && <div style={{ padding: '9px 12px', background: '#fff1f1', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 14, fontSize: 13, color: '#dc2626' }}>⚠️ {error}</div>}
      <Input label="Correo electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@taller.com" icon="📧" />
      <button onClick={handleSend} disabled={loading || !email}
        style={{ width: '100%', padding: '11px', background: '#1a1916', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {loading ? 'Enviando…' : 'Enviar enlace →'}
      </button>
    </div>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────
export default function AuthSystem() {
  const [view, setView] = useState('login'); // 'login' | 'forgot'
  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, border: '1px solid #e2dfd8', boxShadow: '0 20px 60px rgba(0,0,0,.08)', padding: '36px' }}>
        {view === 'login'
          ? <LoginView onForgot={() => setView('forgot')} />
          : <ForgotView onBack={() => setView('login')} />}
      </div>
    </div>
  );
}
