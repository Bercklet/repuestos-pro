// src/context/AuthContext.jsx
// Contexto global: sesión de usuario, perfil y rol en tiempo real
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(undefined); // undefined = cargando
  const [perfil,  setPerfil]    = useState(null);
  const [loading, setLoading]   = useState(true);

  // Carga el perfil desde la tabla `perfiles`
  const cargarPerfil = useCallback(async (userId) => {
    if (!userId) { setPerfil(null); return; }
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) {
      setPerfil(data);
      // Actualizar último acceso
      await supabase
        .from('perfiles')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id', userId);
    }
  }, []);

  useEffect(() => {
    // 1. Sesión inicial (puede existir si el token sigue válido)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      cargarPerfil(session?.user?.id).finally(() => setLoading(false));
    });

    // 2. Escuchar cambios de auth en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        await cargarPerfil(newSession?.user?.id);
        setLoading(false);
      }
    );

    // 3. Suscripción realtime: si el perfil cambia (rol, nombre, activo)
    let perfilSub = null;
    if (session?.user?.id) {
      perfilSub = supabase
        .channel('perfil_propio')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'perfiles',
          filter: `id=eq.${session.user.id}`,
        }, ({ new: nuevo }) => {
          setPerfil(nuevo);
          // Si el admin desactivó el usuario, forzar logout
          if (!nuevo.activo) supabase.auth.signOut();
        })
        .subscribe();
    }

    return () => {
      subscription.unsubscribe();
      perfilSub?.unsubscribe();
    };
  }, []); // eslint-disable-line

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setPerfil(null);
    setSession(null);
  };

  const recuperarPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  // Helpers de rol
  const esAdmin      = perfil?.rol === 'admin';
  const esSuministro = perfil?.rol === 'admin' || perfil?.rol === 'suministro';
  const esTecnico    = perfil?.rol === 'tecnico';

  const value = {
    session,
    perfil,
    loading,
    user: session?.user ?? null,
    esAdmin,
    esSuministro,
    esTecnico,
    login,
    logout,
    recuperarPassword,
    recargarPerfil: () => cargarPerfil(session?.user?.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};
