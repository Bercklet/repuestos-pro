// supabase/functions/whatsapp-pedido/index.ts
// Edge Function — se invoca vía Database Webhook cuando se inserta en "pedidos"
//
// Variables de entorno (Supabase Dashboard → Settings → Edge Functions → Secrets):
//   WHATSAPP_TOKEN       → Token permanente de Meta (no el temporal de 24h)
//   WHATSAPP_PHONE_ID    → Phone Number ID de Meta Business
//   WHATSAPP_TEMPLATE    → Nombre de la plantilla aprobada, ej: "nuevo_pedido_rep"
//   NOTIFY_PHONES        → Números separados por coma: 573232400625,573001234567
//   WEBHOOK_SECRET       → Cadena secreta para verificar que viene de Supabase
//   SUPABASE_URL         → URL del proyecto (automática en Edge Functions)
//   SUPABASE_SERVICE_KEY → Service role key (automática en Edge Functions)

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Helpers ───────────────────────────────────────────────────
const PRIORIDAD: Record<string,string> = {
  urgente: '🔴 URGENTE',
  alta:    '🟡 Alta',
  normal:  '🟢 Normal',
};

const fmtNum  = (n: number) => `#${String(n).padStart(4,'0')}`;
const fmtCOP  = (n: number) => new Intl.NumberFormat('es-CO',{ style:'currency', currency:'COP', maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string) => new Date(s).toLocaleString('es-CO',{
  timeZone:'America/Bogota', day:'2-digit', month:'2-digit',
  year:'numeric', hour:'2-digit', minute:'2-digit', hour12:false,
});

// ── Enviar mensaje de plantilla via Meta API ──────────────────
async function enviarMensaje(
  toPhone : string,
  template: string,
  params  : string[],
): Promise<{ ok: boolean; msgId?: string; error?: string }> {
  const token   = Deno.env.get('WHATSAPP_TOKEN');
  const phoneId = Deno.env.get('WHATSAPP_PHONE_ID');
  if (!token || !phoneId) return { ok: false, error: 'Faltan WHATSAPP_TOKEN / WHATSAPP_PHONE_ID' };

  const body = {
    messaging_product: 'whatsapp',
    to: toPhone,
    type: 'template',
    template: {
      name: template,
      language: { code: 'es' },
      components: [{
        type: 'body',
        parameters: params.map(text => ({ type: 'text', text })),
      }],
    },
  };

  const res  = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method : 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body   : JSON.stringify(body),
  });
  const json = await res.json();

  if (!res.ok) {
    const err = json?.error?.message || JSON.stringify(json);
    console.error('[whatsapp] Error Meta API:', err);
    return { ok: false, error: err };
  }
  return { ok: true, msgId: json?.messages?.[0]?.id };
}

// ── Handler ───────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  // Validar secret para que solo Supabase pueda invocar esta función
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== Deno.env.get('WEBHOOK_SECRET')) {
    console.warn('[whatsapp] Secret inválido — petición rechazada');
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload || payload.type !== 'INSERT' || payload.table !== 'pedidos') {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const pedido = payload.record;

  // Cliente Supabase con privilegios de service role
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_KEY')!,
  );

  // Obtener perfil del técnico
  const { data: tecnico } = await supabase
    .from('perfiles')
    .select('nombre, rol')
    .eq('id', pedido.tecnico_id)
    .single();

  const template = Deno.env.get('WHATSAPP_TEMPLATE') || 'nuevo_pedido_rep';

  // Parámetros inyectados en la plantilla (mismo orden que en Meta)
  // Plantilla sugerida (para registrar en Meta):
  // "🔔 *Nuevo pedido {{1}}*
  //  Repuesto: {{2}}
  //  Marca/Modelo: {{3}}
  //  Tipo: {{4}}  |  Cantidad: {{5}}
  //  Técnico: {{6}}
  //  Prioridad: {{7}}
  //  Observaciones: {{8}}
  //  Fecha: {{9}}
  //  RepuestosPRO ✅"
  const params: string[] = [
    fmtNum(pedido.numero),                                                              // {{1}}
    pedido.repuesto,                                                                    // {{2}}
    `${pedido.marca || ''} ${pedido.modelo || ''}`.trim() || 'Sin especificar',         // {{3}}
    pedido.tipo  || 'OEM',                                                             // {{4}}
    String(pedido.cantidad),                                                            // {{5}}
    tecnico?.nombre || 'Desconocido',                                                   // {{6}}
    PRIORIDAD[pedido.prioridad] || pedido.prioridad,                                    // {{7}}
    pedido.observaciones?.slice(0, 100) || 'Sin observaciones',                         // {{8}}
    fmtDate(pedido.created_at),                                                         // {{9}}
  ];

  // Enviar a todos los números configurados
  const destinos = (Deno.env.get('NOTIFY_PHONES') || '').split(',').map(p => p.trim()).filter(Boolean);
  if (destinos.length === 0) {
    console.warn('[whatsapp] NOTIFY_PHONES no configurado');
    return new Response(JSON.stringify({ error: 'NOTIFY_PHONES vacío' }), { status: 500 });
  }

  const resultados = await Promise.allSettled(
    destinos.map(phone => enviarMensaje(phone, template, params)),
  );

  const errores = resultados
    .filter(r => r.status === 'fulfilled' && !r.value.ok)
    .map(r => r.status === 'fulfilled' ? r.value.error : '');

  const exitosos = resultados.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<{ok:boolean}>).value.ok).length;

  // Registrar en auditoría
  const detalleAudit = exitosos > 0
    ? `WhatsApp enviado a ${exitosos}/${destinos.length} número(s) — Pedido ${fmtNum(pedido.numero)} · ${pedido.repuesto}`
    : `Error al enviar WhatsApp — Pedido ${fmtNum(pedido.numero)}: ${errores.join(', ')}`;

  await supabase.from('auditoria').insert({
    tipo   : 'sistema',
    modulo : 'whatsapp',
    accion : exitosos > 0 ? 'Notificación WhatsApp enviada' : 'Error notificación WhatsApp',
    detalle: detalleAudit,
  });

  console.log(`[whatsapp] ${detalleAudit}`);
  return new Response(JSON.stringify({ exitosos, total: destinos.length, errores }), {
    status : exitosos > 0 ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  });
});
