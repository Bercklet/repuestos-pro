// src/hooks/useData.js
// Hooks especializados: cargan datos desde Supabase + realtime automático
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useRealtimeList } from './useRealtime';

// ─────────────────────────────────────────────────────────────
// usePedidos — lista completa de pedidos con realtime
// ─────────────────────────────────────────────────────────────
export function usePedidos({ filtros = {} } = {}) {
  const [pedidos, setPedidos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase
      .from('pedidos')
      .select(`
        *,
        tecnico:perfiles!pedidos_tecnico_id_fkey(id, nombre, avatar, color, rol),
        proveedor:proveedores(id, nombre, ciudad, rating)
      `)
      .order('created_at', { ascending: false });

    if (filtros.estado)   q = q.eq('estado', filtros.estado);
    if (filtros.prioridad) q = q.eq('prioridad', filtros.prioridad);
    if (filtros.tecnicoId) q = q.eq('tecnico_id', filtros.tecnicoId);
    if (filtros.busqueda) q = q.ilike('repuesto', `%${filtros.busqueda}%`);

    const { data, error: err } = await q;
    if (err) setError(err.message);
    else setPedidos(data || []);
    setLoading(false);
  }, [JSON.stringify(filtros)]); // eslint-disable-line

  useEffect(() => { cargar(); }, [cargar]);

  // Realtime: INSERT/UPDATE/DELETE se reflejan sin recargar todo
  useRealtimeList({
    table: 'pedidos',
    items: pedidos,
    setItems: setPedidos,
    idField: 'id',
    // Cuando llega un update parcial, re-fetch el row completo con joins
    enabled: true,
  });

  const crearPedido = async (datos) => {
    const { data, error } = await supabase
      .from('pedidos')
      .insert([datos])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  };

  const actualizarEstado = async (id, estado) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado })
      .eq('id', id);
    if (error) throw error;
  };

  const actualizarPedido = async (id, cambios) => {
    const { error } = await supabase
      .from('pedidos')
      .update(cambios)
      .eq('id', id);
    if (error) throw error;
  };

  const eliminarPedido = async (id) => {
    const { error } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  };

  // Estadísticas calculadas en memoria desde los datos ya cargados
  const stats = {
    total:       pedidos.length,
    pendientes:  pedidos.filter(p => p.estado === 'pendiente').length,
    pedidos_est: pedidos.filter(p => p.estado === 'pedido').length,
    entregados:  pedidos.filter(p => p.estado === 'entregado').length,
    urgentes:    pedidos.filter(p => p.prioridad === 'urgente').length,
    gasto_total: pedidos.reduce((acc, p) => acc + (p.unitario * p.cantidad), 0),
  };

  return {
    pedidos,
    loading,
    error,
    stats,
    cargar,
    crearPedido,
    actualizarEstado,
    actualizarPedido,
    eliminarPedido,
  };
}

// ─────────────────────────────────────────────────────────────
// useRepuestos — catálogo con historial de precios + realtime
// ─────────────────────────────────────────────────────────────
export function useRepuestos({ busqueda = '' } = {}) {
  const [repuestos, setRepuestos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('repuestos')
      .select(`
        *,
        proveedor:proveedores(id, nombre, rating, ciudad),
        historial:historial_precios(precio, mes, created_at)
      `)
      .order('solicitudes', { ascending: false });

    if (busqueda) {
      // Búsqueda full-text en Supabase
      q = q.or(`nombre.ilike.%${busqueda}%,marca.ilike.%${busqueda}%,modelo.ilike.%${busqueda}%`);
    }

    const { data, error: err } = await q;
    if (err) setError(err.message);
    else setRepuestos(data || []);
    setLoading(false);
  }, [busqueda]);

  useEffect(() => { cargar(); }, [cargar]);

  useRealtimeList({ table: 'repuestos', items: repuestos, setItems: setRepuestos });

  const actualizarPrecio = async (id, precio_actual) => {
    const { error } = await supabase
      .from('repuestos')
      .update({ precio_actual })
      .eq('id', id);
    if (error) throw error;
  };

  const crearRepuesto = async (datos) => {
    const { data, error } = await supabase
      .from('repuestos')
      .insert([datos])
      .select('*, proveedor:proveedores(id, nombre)')
      .single();
    if (error) throw error;
    return data;
  };

  const actualizarRepuesto = async (id, cambios) => {
    const { error } = await supabase
      .from('repuestos')
      .update(cambios)
      .eq('id', id);
    if (error) throw error;
  };

  return {
    repuestos,
    loading,
    error,
    cargar,
    actualizarPrecio,
    crearRepuesto,
    actualizarRepuesto,
  };
}

// ─────────────────────────────────────────────────────────────
// useProveedores — lista con estadísticas + realtime
// ─────────────────────────────────────────────────────────────
export function useProveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('proveedores')
      .select(`
        *,
        pedidos:pedidos(id, unitario, cantidad, devueltos, created_at),
        productos:comparador_precios(
          precio, calidad, tiempo_entrega, stock,
          repuesto:repuestos(nombre)
        )
      `)
      .order('rating', { ascending: false });
    if (err) setError(err.message);
    else setProveedores(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useRealtimeList({ table: 'proveedores', items: proveedores, setItems: setProveedores });

  const crearProveedor = async (datos) => {
    const { data, error } = await supabase
      .from('proveedores')
      .insert([datos])
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const actualizarProveedor = async (id, cambios) => {
    const { error } = await supabase
      .from('proveedores')
      .update(cambios)
      .eq('id', id);
    if (error) throw error;
  };

  const eliminarProveedor = async (id) => {
    const { error } = await supabase
      .from('proveedores')
      .delete()
      .eq('id', id);
    if (error) throw error;
  };

  return {
    proveedores,
    loading,
    error,
    cargar,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
  };
}

// ─────────────────────────────────────────────────────────────
// useComparador — precios de proveedores para un repuesto
// ─────────────────────────────────────────────────────────────
export function useComparador(repuestoId) {
  const [comparador, setComparador] = useState([]);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (!repuestoId) return;
    setLoading(true);
    supabase
      .from('comparador_precios')
      .select(`*, proveedor:proveedores(id, nombre, rating, ciudad, tiempo_entrega)`)
      .eq('repuesto_id', repuestoId)
      .order('precio')
      .then(({ data }) => { setComparador(data || []); setLoading(false); });
  }, [repuestoId]);

  useRealtimeList({
    table: 'comparador_precios',
    items: comparador,
    setItems: setComparador,
    filter: repuestoId ? `repuesto_id=eq.${repuestoId}` : undefined,
    enabled: !!repuestoId,
  });

  return { comparador, loading };
}

// ─────────────────────────────────────────────────────────────
// useUsuarios — lista de perfiles (solo admin/suministro)
// ─────────────────────────────────────────────────────────────
export function useUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('perfiles')
      .select('*, pedidos:pedidos(id)')
      .order('created_at');
    // Enriquecer con conteo de pedidos
    const enriched = (data || []).map(u => ({
      ...u,
      pedidos_count: u.pedidos?.length || 0,
    }));
    setUsuarios(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useRealtimeList({ table: 'perfiles', items: usuarios, setItems: setUsuarios });

  const actualizarUsuario = async (id, cambios) => {
    const { error } = await supabase
      .from('perfiles')
      .update(cambios)
      .eq('id', id);
    if (error) throw error;
  };

  return { usuarios, loading, cargar, actualizarUsuario };
}

// ─────────────────────────────────────────────────────────────
// useAuditoria — log de actividad
// ─────────────────────────────────────────────────────────────
export function useAuditoria({ limite = 50 } = {}) {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('auditoria')
      .select('*, usuario:perfiles(nombre, rol, avatar, color)')
      .order('created_at', { ascending: false })
      .limit(limite)
      .then(({ data }) => { setRegistros(data || []); setLoading(false); });
  }, [limite]);

  useRealtimeList({ table: 'auditoria', items: registros, setItems: setRegistros });

  return { registros, loading };
}

// ─────────────────────────────────────────────────────────────
// useDashboardStats — estadísticas en tiempo real calculadas en DB
// ─────────────────────────────────────────────────────────────
export function useDashboardStats() {
  const [stats, setStats]         = useState(null);
  const [actividad, setActividad] = useState([]);
  const [loading, setLoading]     = useState(true);

  const cargar = useCallback(async () => {
    try {
      const [
        { count: total },
        { count: pendientes },
        { count: urgentes },
        { data: gastoData },
        { data: actividadData },
      ] = await Promise.all([
        supabase.from('pedidos').select('*', { count: 'exact', head: true }),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('prioridad', 'urgente'),
        supabase.from('pedidos').select('unitario, cantidad').not('unitario', 'is', null),
        supabase
          .from('auditoria')
          .select('*, usuario:perfiles(nombre, avatar, color)')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      const gastoTotal = (gastoData || []).reduce(
        (acc, p) => acc + ((p.unitario || 0) * (p.cantidad || 1)), 0
      );

      setStats({ total: total || 0, pendientes: pendientes || 0, urgentes: urgentes || 0, gastoTotal });
      setActividad(actividadData || []);
    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const canal = supabase
      .channel('dashboard_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'auditoria' },
        () => { cargar(); }
      )
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [cargar]);

  return { stats, actividad, loading, cargar };
}

// ─────────────────────────────────────────────────────────────
// useComentariosPedido — hilo de comentarios por pedido
// ─────────────────────────────────────────────────────────────
export function useComentariosPedido(pedidoId) {
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!pedidoId) return;
    setLoading(true);
    supabase
      .from('comentarios_pedido')
      .select('*, autor:perfiles(nombre, avatar, color, rol)')
      .eq('pedido_id', pedidoId)
      .order('created_at')
      .then(({ data }) => { setComentarios(data || []); setLoading(false); });
  }, [pedidoId]);

  useRealtimeList({
    table: 'comentarios_pedido',
    items: comentarios,
    setItems: setComentarios,
    filter: pedidoId ? `pedido_id=eq.${pedidoId}` : undefined,
    enabled: !!pedidoId,
  });

  const agregarComentario = async (texto, autorId) => {
    const { error } = await supabase
      .from('comentarios_pedido')
      .insert([{ pedido_id: pedidoId, autor_id: autorId, texto }]);
    if (error) throw error;
  };

  return { comentarios, loading, agregarComentario };
}
