// src/hooks/useNotificaciones.js
// Notificaciones en tiempo real: propias + broadcast
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useNotificaciones(userId) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas]             = useState(0);
  const [loading, setLoading]               = useState(true);

  const cargar = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .or(`usuario_id.eq.${userId},usuario_id.is.null`) // propias + broadcast
      .order('created_at', { ascending: false })
      .limit(30);
    setNotificaciones(data || []);
    setNoLeidas((data || []).filter(n => !n.leida).length);
    setLoading(false);
  }, [userId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Suscripción realtime a notificaciones nuevas
  useEffect(() => {
    if (!userId) return;
    const canal = supabase
      .channel(`notif_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
      }, ({ new: nueva }) => {
        // Solo mostrar si es para mí o broadcast
        if (nueva.usuario_id === null || nueva.usuario_id === userId) {
          setNotificaciones(prev => [nueva, ...prev].slice(0, 30));
          setNoLeidas(prev => prev + 1);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [userId]);

  const marcarLeida = async (id) => {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    setNoLeidas(prev => Math.max(0, prev - 1));
  };

  const marcarTodasLeidas = async () => {
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .or(`usuario_id.eq.${userId},usuario_id.is.null`)
      .eq('leida', false);
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setNoLeidas(0);
  };

  return { notificaciones, noLeidas, loading, marcarLeida, marcarTodasLeidas };
}
