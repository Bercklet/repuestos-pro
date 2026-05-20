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

  const handleLogin = async () => {
    setError(''); setEmailErr(''); setPassErr('');
    if (!email)              { setEmailErr('El correo es obligatorio'); return; }
    if (!email.includes('@')){ setEmailErr('Correo inválido'); return; }
    if (!password)           { setPassErr('La contraseña es obligatoria'); return; }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // AuthContext detecta la sesión y AuthProvider actualiza el estado
    } catch (err) {
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('invalid') || msg.includes('credentials')) {
        setError('Correo o contraseña incorrectos.');
      } else if (msg.includes('email not confirmed')) {
        setError('Debes confirmar tu correo electrónico primero.');
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };

  // Cuentas demo hardcodeadas en UI (las credenciales reales están en Supabase Auth)
  const DEMO = [
    { email: 'admin@taller.com',      password: 'Admin123!',   nombre: 'Juan Martínez',  rol: 'admin' },
    { email: 'suministro@taller.com', password: 'Sumi123!',    nombre: 'Ana García',     rol: 'suministro' },
    { email: 'tecnico@taller.com',    password: 'Tecnico123!', nombre: 'Carlos Ruiz',    rol: 'tecnico' },
  ];

  const loginDemo = async (demo) => {
    setLoading(true);
    try {
      await login(demo.email, demo.password);
    } catch (err) {
      setError(`Demo: crea el usuario ${demo.email} en Supabase Auth primero.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 52, height: 52, background: '#1a1916', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px' }}>🔩</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>RepuestosPRO</div>
        <div style={{ fontSize: 14, color: '#9c9a92' }}>Inicia sesión en tu cuenta</div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fff1f1', border: '1px solid #fecaca', borderRadius: 9, marginBottom: 16, fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠️ {error}
        </div>
      )}

      <Input label="Correo electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="usuario@taller.com" error={emailErr} icon="📧" />
      <Input label="Contraseña" type={showPass ? 'text' : 'password'} value={password}
        onChange={e => setPassword(e.target.value)} placeholder="••••••••" error={passErr} icon="🔒"
        right={<button onClick={() => setShowPass(!showPass)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#9c9a92', padding: 0 }}>{showPass ? '🙈' : '👁'}</button>}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8, marginBottom: 20 }}>
        <span onClick={onForgot} style={{ fontSize: 13, color: '#2563eb', cursor: 'pointer', fontWeight: 500 }}>¿Olvidaste tu contraseña?</span>
      </div>

      <button onClick={handleLogin} disabled={loading} onKeyDown={handleKeyDown}
        style={{ width: '100%', padding: '11px', background: loading ? '#9c9a92' : '#1a1916', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {loading
          ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />Verificando…</>
          : 'Iniciar sesión →'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ flex: 1, height: 1, background: '#e2dfd8' }} />
        <span style={{ fontSize: 12, color: '#9c9a92', fontWeight: 500 }}>Acceso rápido demo</span>
        <div style={{ flex: 1, height: 1, background: '#e2dfd8' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DEMO.map(u => {
          const cfg = ROL_CFG[u.rol];
          return (
            <button key={u.email} onClick={() => loginDemo(u)} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fff', border: '1px solid #e2dfd8', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', opacity: loading ? .6 : 1 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{cfg.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{u.nombre}</div>
                <div style={{ fontSize: 11.5, color: '#9c9a92' }}>{cfg.label} · {u.email}</div>
              </div>
              <div style={{ padding: '2px 8px', borderRadius: 99, background: cfg.bg, fontSize: 11, fontWeight: 600, color: cfg.color }}>{cfg.label}</div>
            </button>
          );
        })}
      </div>
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
