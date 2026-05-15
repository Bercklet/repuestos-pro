import { useState } from "react";

// ─── USUARIOS DE PRUEBA ───────────────────────────────────────────────────────
const USERS_DB = [
  { email: "admin@taller.com",     password: "Admin123",     nombre: "Juan Martínez",  rol: "admin",      avatar: "JM", color: "#7c3aed" },
  { email: "suministro@taller.com",password: "Sumi123",      nombre: "Ana García",     rol: "suministro", avatar: "AG", color: "#2563eb" },
  { email: "tecnico@taller.com",   password: "Tecnico123",   nombre: "Carlos Ruiz",    rol: "tecnico",    avatar: "CR", color: "#15803d" },
];

const ROL_CFG = {
  admin:      { label: "Administrador", icon: "🛡️", desc: "Control total del sistema",       color: "#7c3aed", bg: "#f5f3ff" },
  suministro: { label: "Suministro",    icon: "📦", desc: "Cotizaciones y gestión de precios", color: "#2563eb", bg: "#eff4ff" },
  tecnico:    { label: "Técnico",       icon: "🔧", desc: "Crear solicitudes de repuestos",   color: "#15803d", bg: "#f0fdf4" },
};

// ─── INPUT FIELD ──────────────────────────────────────────────────────────────
function Input({ label, type = "text", value, onChange, placeholder, error, icon, right }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 12.5, fontWeight: 600, color: "#6b6860", display: "block", marginBottom: 5 }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: focused ? "#1a1916" : "#9c9a92", pointerEvents: "none", transition: "color .15s" }}>{icon}</span>}
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: "100%", background: "#fff",
            border: `1.5px solid ${error ? "#dc2626" : focused ? "#1a1916" : "#e2dfd8"}`,
            borderRadius: 10, padding: `9px ${right ? "40px" : "12px"} 9px ${icon ? "36px" : "12px"}`,
            fontSize: 14, fontFamily: "inherit", color: "#1a1916", outline: "none",
            transition: "border-color .15s, box-shadow .15s",
            boxShadow: focused && !error ? "0 0 0 3px rgba(26,25,22,.07)" : "none",
          }}
        />
        {right && <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)" }}>{right}</span>}
      </div>
      {error && <div style={{ fontSize: 11.5, color: "#dc2626", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>⚠ {error}</div>}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginView({ onSuccess, onForgot }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [passErr, setPassErr]   = useState("");

  const handleLogin = async () => {
    setError(""); setEmailErr(""); setPassErr("");
    if (!email)    { setEmailErr("El correo es obligatorio"); return; }
    if (!email.includes("@")) { setEmailErr("Correo inválido"); return; }
    if (!password) { setPassErr("La contraseña es obligatoria"); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    const user = USERS_DB.find(u => u.email === email && u.password === password);
    if (!user) {
      setError("Correo o contraseña incorrectos. Verifica tus datos.");
      setLoading(false);
      return;
    }
    setLoading(false);
    onSuccess(user);
  };

  const loginDemo = async (u) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    onSuccess(u);
  };

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ width: 52, height: 52, background: "#1a1916", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 14px" }}>🔩</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 4 }}>RepuestosPRO</div>
        <div style={{ fontSize: 14, color: "#9c9a92" }}>Inicia sesión en tu cuenta</div>
      </div>

      {/* Error general */}
      {error && (
        <div style={{ padding: "10px 14px", background: "#fff1f1", border: "1px solid #fecaca", borderRadius: 9, marginBottom: 16, fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Form */}
      <Input
        label="Correo electrónico"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="usuario@taller.com"
        error={emailErr}
        icon="📧"
      />
      <Input
        label="Contraseña"
        type={showPass ? "text" : "password"}
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="••••••••"
        error={passErr}
        icon="🔒"
        right={
          <button onClick={() => setShowPass(!showPass)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#9c9a92", padding: 0 }}>
            {showPass ? "🙈" : "👁"}
          </button>
        }
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8, marginBottom: 20 }}>
        <span onClick={onForgot} style={{ fontSize: 13, color: "#2563eb", cursor: "pointer", fontWeight: 500 }}>¿Olvidaste tu contraseña?</span>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: "100%", padding: "11px", background: loading ? "#9c9a92" : "#1a1916",
          color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
          fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer",
          transition: "all .15s", marginBottom: 20,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        {loading ? (
          <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />Verificando…</>
        ) : "Iniciar sesión →"}
      </button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ flex: 1, height: 1, background: "#e2dfd8" }} />
        <span style={{ fontSize: 12, color: "#9c9a92", fontWeight: 500 }}>Acceso rápido de demostración</span>
        <div style={{ flex: 1, height: 1, background: "#e2dfd8" }} />
      </div>

      {/* Demo buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {USERS_DB.map(u => (
          <button key={u.email} onClick={() => loginDemo(u)} disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
              background: "#fff", border: "1px solid #e2dfd8", borderRadius: 10,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
              transition: "all .15s", textAlign: "left",
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = "#1a1916"; e.currentTarget.style.background = "#f7f6f3"; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2dfd8"; e.currentTarget.style.background = "#fff"; }}
          >
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${u.color}88,${u.color})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {u.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.nombre}</div>
              <div style={{ fontSize: 12, color: "#9c9a92" }}>{ROL_CFG[u.rol].label} · {u.email}</div>
            </div>
            <span style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, flexShrink: 0 }}>Entrar →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── RECUPERAR CONTRASEÑA ─────────────────────────────────────────────────────
function ForgotView({ onBack }) {
  const [step, setStep]   = useState(1); // 1=email, 2=codigo, 3=nueva, 4=ok
  const [email, setEmail] = useState("");
  const [code, setCode]   = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);

  const next = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setStep(s => s + 1);
  };

  return (
    <div style={{ width: "100%", maxWidth: 400 }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b6860", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: 28 }}>
        ← Volver al inicio de sesión
      </button>

      {/* Steps indicator */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
        {["Email","Código","Nueva clave","Listo"].map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{ width: "100%", height: 3, borderRadius: 99, background: step > i ? "#1a1916" : "#e2dfd8", transition: "background .3s" }} />
            <span style={{ fontSize: 11, color: step > i ? "#1a1916" : "#9c9a92", fontWeight: step === i + 1 ? 700 : 400 }}>{s}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 6 }}>¿Olvidaste tu contraseña?</div>
          <div style={{ fontSize: 13.5, color: "#6b6860", marginBottom: 22, lineHeight: 1.6 }}>Ingresa tu correo y te enviaremos un código de verificación de 6 dígitos.</div>
          <Input label="Correo electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@taller.com" icon="📧" />
          <button onClick={next} disabled={!email || loading}
            style={{ width: "100%", padding: "11px", background: !email || loading ? "#9c9a92" : "#1a1916", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: !email || loading ? "not-allowed" : "pointer", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <><span style={{ display:"inline-block",width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite" }} />Enviando…</> : "Enviar código →"}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 6 }}>Código de verificación</div>
          <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 9, marginBottom: 18, fontSize: 13, color: "#15803d" }}>
            ✅ Código enviado a <strong>{email}</strong>. Revisa tu bandeja de entrada.
          </div>
          {/* 6-digit input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#6b6860", display: "block", marginBottom: 8 }}>Código de 6 dígitos</label>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {[0,1,2,3,4,5].map(i => (
                <input key={i} type="text" maxLength={1}
                  value={code[i] || ""}
                  onChange={e => {
                    const arr = code.split("");
                    arr[i] = e.target.value.replace(/\D/g, "");
                    setCode(arr.join(""));
                    if (e.target.value && e.target.nextSibling) e.target.nextSibling.focus();
                  }}
                  style={{ width: 44, height: 52, textAlign: "center", fontSize: 22, fontWeight: 700, fontFamily: "monospace", border: `2px solid ${code[i] ? "#1a1916" : "#e2dfd8"}`, borderRadius: 10, outline: "none", background: "#fff", transition: "border-color .15s" }}
                />
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 12.5, color: "#9c9a92" }}>
              Demo: usa el código <strong style={{ fontFamily: "monospace", color: "#1a1916", letterSpacing: "0.2em" }}>123456</strong>
            </div>
          </div>
          <button onClick={next} disabled={code.length < 6 || loading}
            style={{ width: "100%", padding: "11px", background: code.length < 6 || loading ? "#9c9a92" : "#1a1916", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: code.length < 6 || loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <><span style={{ display:"inline-block",width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite" }} />Verificando…</> : "Verificar código →"}
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 6 }}>Nueva contraseña</div>
          <div style={{ fontSize: 13.5, color: "#6b6860", marginBottom: 20, lineHeight: 1.6 }}>Crea una contraseña segura de al menos 8 caracteres.</div>
          <Input label="Nueva contraseña" type="password" value={pass1} onChange={e => setPass1(e.target.value)} placeholder="Mínimo 8 caracteres" icon="🔒" />
          <Input label="Confirmar contraseña" type="password" value={pass2} onChange={e => setPass2(e.target.value)} placeholder="Repite la contraseña" icon="🔒"
            error={pass2 && pass1 !== pass2 ? "Las contraseñas no coinciden" : ""} />

          {/* Indicador fortaleza */}
          {pass1 && (
            <div style={{ marginBottom: 16, marginTop: -8 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                {["#dc2626","#d97706","#15803d"].map((c, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: pass1.length > i * 4 + 3 ? c : "#e2dfd8", transition: "background .3s" }} />
                ))}
              </div>
              <span style={{ fontSize: 11.5, color: pass1.length < 6 ? "#dc2626" : pass1.length < 10 ? "#d97706" : "#15803d" }}>
                {pass1.length < 6 ? "⚠ Contraseña débil" : pass1.length < 10 ? "⚡ Contraseña moderada" : "✅ Contraseña fuerte"}
              </span>
            </div>
          )}

          <button onClick={next} disabled={!pass1 || pass1 !== pass2 || pass1.length < 8 || loading}
            style={{ width: "100%", padding: "11px", background: !pass1 || pass1 !== pass2 || pass1.length < 8 || loading ? "#9c9a92" : "#1a1916", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <><span style={{ display:"inline-block",width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite" }} />Guardando…</> : "Cambiar contraseña →"}
          </button>
        </>
      )}

      {step === 4 && (
        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <div style={{ width: 60, height: 60, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 8 }}>¡Contraseña actualizada!</div>
          <div style={{ fontSize: 13.5, color: "#6b6860", marginBottom: 24, lineHeight: 1.6 }}>Tu contraseña se ha cambiado correctamente. Ya puedes iniciar sesión con tu nueva contraseña.</div>
          <button onClick={onBack}
            style={{ width: "100%", padding: "11px", background: "#1a1916", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
            Ir al inicio de sesión →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── BIENVENIDA (post-login) ──────────────────────────────────────────────────
function WelcomeView({ user, onEnter }) {
  const [animating, setAnimating] = useState(false);
  const rol = ROL_CFG[user.rol];

  const handleEnter = async () => {
    setAnimating(true);
    await new Promise(r => setTimeout(r, 700));
    onEnter();
  };

  return (
    <div style={{ width: "100%", maxWidth: 440, textAlign: "center", opacity: animating ? 0 : 1, transition: "opacity .4s", transform: animating ? "scale(0.97)" : "scale(1)" }}>
      {/* Avatar grande */}
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${user.color}88,${user.color})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 auto 18px", boxShadow: `0 8px 24px ${user.color}40` }}>
        {user.avatar}
      </div>
      <div style={{ fontSize: 13, color: "#9c9a92", marginBottom: 4 }}>Bienvenido de nuevo</div>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 6 }}>{user.nombre}</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 99, background: rol.bg, marginBottom: 28 }}>
        <span>{rol.icon}</span>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: rol.color }}>{rol.label}</span>
      </div>

      {/* Permisos del rol */}
      <div style={{ background: "#f7f6f3", borderRadius: 14, padding: "16px 20px", marginBottom: 28, textAlign: "left" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#9c9a92", letterSpacing: ".3px", marginBottom: 12 }}>TU ACCESO INCLUYE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(user.rol === "admin"
            ? ["Control total del sistema","Gestión de usuarios y permisos","Reportes financieros completos","Auditoría de todos los cambios","Configuración del sistema"]
            : user.rol === "suministro"
            ? ["Cotizar y aprobar pedidos","Editar precios y valores","Gestionar proveedores","Ver reportes de período","Registrar devoluciones"]
            : ["Crear solicitudes de repuestos","Ver estado de mis pedidos","Adjuntar fotos de evidencia","Marcar urgencias","Comentarios internos"]
          ).map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5 }}>
              <span style={{ color: rol.color, fontSize: 14, flexShrink: 0 }}>✓</span>
              <span style={{ color: "#1a1916" }}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleEnter}
        style={{ width: "100%", padding: "12px", background: "#1a1916", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onMouseEnter={e => { e.currentTarget.style.background = "#2d2b26"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#1a1916"; e.currentTarget.style.transform = "translateY(0)"; }}
      >
        Entrar al sistema →
      </button>
    </div>
  );
}

// ─── AUTH WRAPPER (componente principal) ──────────────────────────────────────
export default function AuthSystem({ onAuthenticated }) {
  const [view, setView] = useState("login");   // login | forgot | welcome
  const [user, setUser] = useState(null);

  const handleSuccess = (u) => {
    setUser(u);
    setView("welcome");
  };

  const handleEnter = () => {
    if (onAuthenticated) onAuthenticated(user);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f7f6f3", fontFamily: "'DM Sans',system-ui,sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Fondo decorativo */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(26,25,22,0.04),transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -100, left: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,0.04),transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", left: "20%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(21,128,61,0.03),transparent 70%)" }} />
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: view === "welcome" ? 480 : 440,
        background: "#fff", borderRadius: 20,
        border: "1px solid #e2dfd8",
        boxShadow: "0 20px 60px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04)",
        padding: "36px 36px 32px",
        position: "relative", zIndex: 1,
        animation: "fadeIn .35s ease",
      }}>
        {view === "login"   && <LoginView onSuccess={handleSuccess} onForgot={() => setView("forgot")} />}
        {view === "forgot"  && <ForgotView onBack={() => setView("login")} />}
        {view === "welcome" && user && <WelcomeView user={user} onEnter={handleEnter} />}
      </div>

      {/* Footer */}
      <div style={{ position: "fixed", bottom: 20, fontSize: 12, color: "#9c9a92", textAlign: "center", zIndex: 1 }}>
        RepuestosPRO © 2026 · Plataforma de gestión de repuestos para talleres técnicos
      </div>
    </div>
  );
}
