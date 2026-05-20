// src/lib/supabase.js
// Cliente único de Supabase — importar desde aquí en TODO el proyecto
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '❌ Variables de entorno faltantes.\n' +
    'Crea un archivo .env en la raíz con:\n' +
    '  VITE_SUPABASE_URL=https://xxxx.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=eyJ...'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Persistencia real en memoria de Supabase (NO localStorage)
    // Supabase usa su propio mecanismo seguro basado en cookies/token
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-app-name': 'RepuestosPRO',
    },
  },
});

// Helper: número de pedido formateado
export const fmtNumPedido = (n) => '#' + String(n).padStart(4, '0');

// Helper: formato COP
export const fmtCOP = (n) =>
  n ? '$' + Math.round(n).toLocaleString('es-CO') : '—';

// Helper: tiempo relativo
export const tiempoRelativo = (fecha) => {
  const diff = Date.now() - new Date(fecha).getTime();
  const min  = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const d    = Math.floor(diff / 86400000);
  if (min < 1)  return 'Ahora';
  if (min < 60) return `Hace ${min}m`;
  if (h   < 24) return `Hace ${h}h`;
  if (d   < 7)  return `Hace ${d} días`;
  return new Date(fecha).toLocaleDateString('es-CO');
};
