// src/hooks/useRealtime.js
// Hook reutilizable para suscribirse a cualquier tabla en tiempo real
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useRealtime — escucha cambios INSERT/UPDATE/DELETE en una tabla
 *
 * @param {string}   table     - nombre de la tabla
 * @param {function} onInsert  - callback cuando llega un INSERT
 * @param {function} onUpdate  - callback cuando llega un UPDATE
 * @param {function} onDelete  - callback cuando llega un DELETE
 * @param {string}   filter    - filtro opcional, ej: "estado=eq.pendiente"
 * @param {string}   channelId - ID único del canal (por defecto: table)
 */
export function useRealtime({
  table,
  onInsert,
  onUpdate,
  onDelete,
  filter,
  channelId,
  enabled = true,
}) {
  const channelRef = useRef(null);
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete });

  // Mantener callbacks actualizados sin re-suscribir
  useEffect(() => {
    callbacksRef.current = { onInsert, onUpdate, onDelete };
  });

  useEffect(() => {
    if (!enabled) return;

    const id = channelId || `realtime_${table}_${Math.random().toString(36).slice(2)}`;
    const config = { event: '*', schema: 'public', table };
    if (filter) config.filter = filter;

    channelRef.current = supabase
      .channel(id)
      .on('postgres_changes', config, (payload) => {
        const { eventType, new: nuevo, old } = payload;
        if (eventType === 'INSERT' && callbacksRef.current.onInsert) {
          callbacksRef.current.onInsert(nuevo);
        } else if (eventType === 'UPDATE' && callbacksRef.current.onUpdate) {
          callbacksRef.current.onUpdate(nuevo, old);
        } else if (eventType === 'DELETE' && callbacksRef.current.onDelete) {
          callbacksRef.current.onDelete(old);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelRef.current);
    };
  }, [table, filter, channelId, enabled]);
}

/**
 * useRealtimeList — mantiene una lista sincronizada en tiempo real
 * Retorna [items, setItems] con auto-merge de cambios realtime
 */
export function useRealtimeList({ table, items, setItems, idField = 'id', filter, enabled = true }) {
  const handleInsert = useCallback((nuevo) => {
    setItems(prev => {
      if (prev.find(x => x[idField] === nuevo[idField])) return prev;
      return [nuevo, ...prev];
    });
  }, [setItems, idField]);

  const handleUpdate = useCallback((nuevo) => {
    setItems(prev => prev.map(x => x[idField] === nuevo[idField] ? { ...x, ...nuevo } : x));
  }, [setItems, idField]);

  const handleDelete = useCallback((old) => {
    setItems(prev => prev.filter(x => x[idField] !== old[idField]));
  }, [setItems, idField]);

  useRealtime({ table, onInsert: handleInsert, onUpdate: handleUpdate, onDelete: handleDelete, filter, enabled });
}
