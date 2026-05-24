-- ============================================================
-- MIGRACIÓN 002 — Pagos, Cotizaciones y Balance
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. TABLA DE PAGOS POR PEDIDO ──────────────────────────────
-- Registra cada abono realizado contra un pedido.
-- Permite llevar el saldo pendiente por pedido.
CREATE TABLE IF NOT EXISTS pagos_pedido (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id       UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  monto           NUMERIC(12,0) NOT NULL CHECK (monto > 0),
  proveedor_id    UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  metodo          TEXT DEFAULT 'efectivo', -- efectivo, transferencia, nequi, daviplata
  referencia      TEXT,                    -- número de comprobante / referencia
  notas           TEXT,
  registrado_por  UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX pagos_pedido_idx ON pagos_pedido(pedido_id, created_at DESC);

-- ── 2. TABLA DE COTIZACIONES POR PROVEEDOR ────────────────────
-- Múltiples proveedores cotizan el mismo repuesto.
-- Permite comparar y elegir el mejor precio.
CREATE TABLE IF NOT EXISTS cotizaciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id       UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  -- Referencia del repuesto (puede ser libre o vinculada)
  marca           TEXT,
  modelo          TEXT,
  repuesto        TEXT NOT NULL,
  calidad         TEXT DEFAULT 'OEM',       -- Original, OEM, Genérico
  -- Proveedor y precio
  proveedor_id    UUID NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
  precio          NUMERIC(12,0) NOT NULL,
  tiempo_entrega  TEXT,                     -- '1 día', '2-3 días', 'Inmediato'
  disponible      BOOLEAN DEFAULT TRUE,
  notas           TEXT,
  -- Control
  seleccionada    BOOLEAN DEFAULT FALSE,    -- La cotización que se eligió
  registrado_por  UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX cotizaciones_pedido_idx   ON cotizaciones(pedido_id);
CREATE INDEX cotizaciones_repuesto_idx ON cotizaciones(marca, modelo, repuesto);

-- ── 3. COLUMNA pagado EN PEDIDOS ─────────────────────────────
-- Indica si el repuesto ya fue pagado al proveedor
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pagado        BOOLEAN DEFAULT FALSE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS total_pagado  NUMERIC(12,0) DEFAULT 0;

-- ── 4. VISTA: balance por pedido ─────────────────────────────
-- Calcula en tiempo real: valor total - total pagado = saldo pendiente
CREATE OR REPLACE VIEW v_balance_pedidos AS
SELECT
  p.id,
  p.numero,
  p.repuesto,
  p.marca,
  p.modelo,
  p.estado,
  p.cantidad,
  p.unitario,
  (p.unitario * p.cantidad)                                        AS valor_total,
  COALESCE(SUM(pg.monto), 0)                                       AS total_pagado,
  (p.unitario * p.cantidad) - COALESCE(SUM(pg.monto), 0)           AS saldo_pendiente,
  CASE
    WHEN (p.unitario * p.cantidad) = 0 THEN FALSE
    WHEN COALESCE(SUM(pg.monto), 0) >= (p.unitario * p.cantidad) THEN TRUE
    ELSE FALSE
  END                                                              AS pagado_completo,
  p.tecnico_id,
  p.proveedor_id,
  p.created_at
FROM pedidos p
LEFT JOIN pagos_pedido pg ON pg.pedido_id = p.id
WHERE p.estado = 'entregado'
GROUP BY p.id, p.numero, p.repuesto, p.marca, p.modelo, p.estado, p.cantidad, p.unitario, p.tecnico_id, p.proveedor_id, p.created_at;

-- ── 5. VISTA: historial de precios por repuesto ───────────────
-- Promedio, mínimo y máximo por marca+modelo+repuesto
CREATE OR REPLACE VIEW v_precios_repuesto AS
SELECT
  c.marca,
  c.modelo,
  c.repuesto,
  c.calidad,
  COUNT(*)                    AS total_cotizaciones,
  MIN(c.precio)               AS precio_minimo,
  MAX(c.precio)               AS precio_maximo,
  ROUND(AVG(c.precio))        AS precio_promedio,
  -- Último precio registrado
  (SELECT precio FROM cotizaciones c2
   WHERE c2.marca = c.marca AND c2.modelo = c.modelo AND c2.repuesto = c.repuesto
   ORDER BY c2.created_at DESC LIMIT 1) AS ultimo_precio,
  -- Proveedor más barato
  (SELECT pr.nombre FROM cotizaciones c3
   JOIN proveedores pr ON pr.id = c3.proveedor_id
   WHERE c3.marca = c.marca AND c3.modelo = c.modelo AND c3.repuesto = c.repuesto
   ORDER BY c3.precio ASC LIMIT 1) AS proveedor_mas_barato,
  MAX(c.created_at)           AS ultima_actualizacion
FROM cotizaciones c
GROUP BY c.marca, c.modelo, c.repuesto, c.calidad;

-- ── 6. RLS — Row Level Security ───────────────────────────────
ALTER TABLE pagos_pedido  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones   ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden leer
CREATE POLICY "Ver pagos"        ON pagos_pedido  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Ver cotizaciones" ON cotizaciones   FOR SELECT TO authenticated USING (TRUE);

-- Solo suministro/admin puede insertar/editar
CREATE POLICY "Gestionar pagos"        ON pagos_pedido  FOR ALL TO authenticated
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin','suministro'));
CREATE POLICY "Gestionar cotizaciones" ON cotizaciones   FOR ALL TO authenticated
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin','suministro'));
