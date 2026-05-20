-- ============================================================
-- RepuestosPRO — Supabase Schema Completo
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── EXTENSIONES ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- búsqueda fuzzy

-- ── ENUMS ────────────────────────────────────────────────────
CREATE TYPE rol_usuario    AS ENUM ('admin', 'suministro', 'tecnico');
CREATE TYPE estado_pedido  AS ENUM ('pendiente', 'pedido', 'entregado', 'devuelto', 'no_consigue');
CREATE TYPE prioridad      AS ENUM ('urgente', 'alta', 'normal');
CREATE TYPE calidad_rep    AS ENUM ('Original', 'OEM', 'Genérico', 'Recuperado');
CREATE TYPE stock_estado   AS ENUM ('disponible', 'bajo', 'agotado');
CREATE TYPE estado_prov    AS ENUM ('activo', 'pausado', 'inactivo');
CREATE TYPE tipo_prov      AS ENUM ('Mayorista', 'Distribuidor', 'Minorista');
CREATE TYPE tipo_notif     AS ENUM ('pedido', 'precio', 'devolucion', 'usuario', 'sistema', 'alerta');
CREATE TYPE tipo_auditoria AS ENUM ('crear', 'editar', 'estado', 'usuario', 'devolucion', 'sesion', 'alerta');

-- ──────────────────────────────────────────────────────────────
-- TABLA: perfiles (extiende auth.users de Supabase)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE perfiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  rol         rol_usuario NOT NULL DEFAULT 'tecnico',
  avatar      TEXT,          -- iniciales "JM"
  color       TEXT DEFAULT '#7c3aed',
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- TABLA: proveedores
-- ──────────────────────────────────────────────────────────────
CREATE TABLE proveedores (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre              TEXT NOT NULL,
  tipo                tipo_prov NOT NULL DEFAULT 'Mayorista',
  ciudad              TEXT,
  contacto            TEXT,
  telefono            TEXT,
  email               TEXT,
  rating              NUMERIC(3,1) DEFAULT 5.0 CHECK (rating BETWEEN 0 AND 5),
  estado              estado_prov NOT NULL DEFAULT 'activo',
  categorias          TEXT[] DEFAULT '{}',
  comentario          TEXT,
  historial_pagos     TEXT,
  precios_competitivos BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- TABLA: repuestos (catálogo)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE repuestos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          TEXT NOT NULL,
  marca           TEXT,
  modelo          TEXT,
  categoria       TEXT,
  calidad         calidad_rep DEFAULT 'OEM',
  precio_actual   NUMERIC(12,0) DEFAULT 0,
  precio_min      NUMERIC(12,0) DEFAULT 0,
  precio_max      NUMERIC(12,0) DEFAULT 0,
  solicitudes     INT DEFAULT 0,
  proveedor_id    UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  stock           stock_estado DEFAULT 'disponible',
  tags            TEXT[] DEFAULT '{}',
  aliases         TEXT[] DEFAULT '{}',
  -- búsqueda full-text
  fts  TSVECTOR GENERATED ALWAYS AS (
  to_tsvector('english',
      coalesce(nombre,'') || ' ' ||
      coalesce(marca,'')  || ' ' ||
      coalesce(modelo,'') || ' ' ||
      coalesce(categoria,'') || ' ' ||
      coalesce(array_to_string(tags,'    '),'') || ' ' ||
      coalesce(array_to_string(aliases,' '),'')
    )
  ) STORED,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX repuestos_fts_idx   ON repuestos USING GIN(fts);
CREATE INDEX repuestos_trgm_idx  ON repuestos USING GIN(nombre gin_trgm_ops);
CREATE INDEX repuestos_prov_idx  ON repuestos(proveedor_id);
CREATE INDEX repuestos_cat_idx   ON repuestos(categoria);

-- ──────────────────────────────────────────────────────────────
-- TABLA: historial_precios
-- ──────────────────────────────────────────────────────────────
CREATE TABLE historial_precios (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repuesto_id UUID NOT NULL REFERENCES repuestos(id) ON DELETE CASCADE,
  precio      NUMERIC(12,0) NOT NULL,
  mes         TEXT,          -- "Ene", "Feb"...
  cambiado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX hist_precios_rep_idx ON historial_precios(repuesto_id, created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- TABLA: pedidos
-- ──────────────────────────────────────────────────────────────
CREATE TABLE pedidos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero          SERIAL UNIQUE,          -- #0481, #0482...
  repuesto        TEXT NOT NULL,
  repuesto_id     UUID REFERENCES repuestos(id) ON DELETE SET NULL,
  marca           TEXT,
  modelo          TEXT,
  tipo            calidad_rep DEFAULT 'OEM',
  cantidad        INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  unitario        NUMERIC(12,0) DEFAULT 0,
  tecnico_id      UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
  prioridad       prioridad NOT NULL DEFAULT 'normal',
  estado          estado_pedido NOT NULL DEFAULT 'pendiente',
  proveedor_id    UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  observaciones   TEXT,
  devueltos       INT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX pedidos_estado_idx    ON pedidos(estado);
CREATE INDEX pedidos_tecnico_idx   ON pedidos(tecnico_id);
CREATE INDEX pedidos_created_idx   ON pedidos(created_at DESC);
CREATE INDEX pedidos_prioridad_idx ON pedidos(prioridad);

-- ──────────────────────────────────────────────────────────────
-- TABLA: comentarios_pedido
-- ──────────────────────────────────────────────────────────────
CREATE TABLE comentarios_pedido (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id   UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  autor_id    UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  texto       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX comentarios_pedido_idx ON comentarios_pedido(pedido_id, created_at);

-- ──────────────────────────────────────────────────────────────
-- TABLA: devoluciones
-- ──────────────────────────────────────────────────────────────
CREATE TABLE devoluciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id       UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  repuesto        TEXT NOT NULL,
  cantidad        INT NOT NULL DEFAULT 1,
  motivo          TEXT,
  monto_descuento NUMERIC(12,0) DEFAULT 0,
  registrado_por  UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX devoluciones_pedido_idx ON devoluciones(pedido_id);

-- ──────────────────────────────────────────────────────────────
-- TABLA: comparador_precios (cotizaciones por repuesto/proveedor)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE comparador_precios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repuesto_id   UUID NOT NULL REFERENCES repuestos(id) ON DELETE CASCADE,
  proveedor_id  UUID NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
  precio        NUMERIC(12,0) NOT NULL,
  calidad       calidad_rep DEFAULT 'OEM',
  tiempo_entrega TEXT,
  stock         stock_estado DEFAULT 'disponible',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(repuesto_id, proveedor_id)
);

CREATE INDEX comparador_rep_idx  ON comparador_precios(repuesto_id);
CREATE INDEX comparador_prov_idx ON comparador_precios(proveedor_id);

-- ──────────────────────────────────────────────────────────────
-- TABLA: notificaciones
-- ──────────────────────────────────────────────────────────────
CREATE TABLE notificaciones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID REFERENCES perfiles(id) ON DELETE CASCADE,  -- NULL = broadcast
  tipo        tipo_notif NOT NULL DEFAULT 'sistema',
  titulo      TEXT NOT NULL,
  mensaje     TEXT NOT NULL,
  leida       BOOLEAN DEFAULT FALSE,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notif_usuario_idx  ON notificaciones(usuario_id, leida, created_at DESC);
CREATE INDEX notif_created_idx  ON notificaciones(created_at DESC);

-- ──────────────────────────────────────────────────────────────
-- TABLA: auditoria
-- ──────────────────────────────────────────────────────────────
CREATE TABLE auditoria (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  tipo        tipo_auditoria NOT NULL,
  accion      TEXT NOT NULL,
  detalle     TEXT,
  modulo      TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX auditoria_usuario_idx ON auditoria(usuario_id);
CREATE INDEX auditoria_created_idx ON auditoria(created_at DESC);
CREATE INDEX auditoria_modulo_idx  ON auditoria(modulo);

-- ──────────────────────────────────────────────────────────────
-- TRIGGERS: updated_at automático
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_perfiles_upd     BEFORE UPDATE ON perfiles     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_proveedores_upd  BEFORE UPDATE ON proveedores  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_repuestos_upd    BEFORE UPDATE ON repuestos    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pedidos_upd      BEFORE UPDATE ON pedidos      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────────
-- TRIGGER: auto-crear perfil al registrar usuario en auth
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION crear_perfil_nuevo_usuario()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO perfiles (id, nombre, email, rol, avatar, color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'rol')::rol_usuario, 'tecnico'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', UPPER(LEFT(split_part(NEW.email, '@', 1), 2))),
    COALESCE(NEW.raw_user_meta_data->>'color', '#7c3aed')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auth_usuario_nuevo
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION crear_perfil_nuevo_usuario();

-- ──────────────────────────────────────────────────────────────
-- TRIGGER: auditoria automática en pedidos
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auditar_pedido()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria(usuario_id, tipo, accion, detalle, modulo)
    VALUES (NEW.tecnico_id, 'crear', 'Pedido creado',
            NEW.repuesto || ' · Prioridad: ' || NEW.prioridad, 'Pedidos');
    -- notificación broadcast
    INSERT INTO notificaciones(tipo, titulo, mensaje, metadata)
    VALUES ('pedido', 'Nuevo pedido',
            NEW.repuesto || ' · ' || NEW.prioridad,
            jsonb_build_object('pedido_id', NEW.id, 'numero', NEW.numero));
  ELSIF TG_OP = 'UPDATE' AND OLD.estado <> NEW.estado THEN
    INSERT INTO auditoria(usuario_id, tipo, accion, detalle, modulo)
    VALUES (NEW.tecnico_id, 'estado', 'Estado cambiado',
            '#' || LPAD(NEW.numero::TEXT,4,'0') || ': ' || OLD.estado || ' → ' || NEW.estado, 'Pedidos');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auditar_pedido
  AFTER INSERT OR UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION auditar_pedido();

-- ──────────────────────────────────────────────────────────────
-- TRIGGER: historial de precios automático
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION registrar_cambio_precio()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.precio_actual <> NEW.precio_actual THEN
    INSERT INTO historial_precios(repuesto_id, precio, mes)
    VALUES (NEW.id, NEW.precio_actual, TO_CHAR(NOW(), 'Mon'));
    INSERT INTO notificaciones(tipo, titulo, mensaje, metadata)
    VALUES ('precio', 'Precio actualizado',
            NEW.nombre || ': $' || OLD.precio_actual || ' → $' || NEW.precio_actual,
            jsonb_build_object('repuesto_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_historial_precio
  AFTER UPDATE ON repuestos
  FOR EACH ROW EXECUTE FUNCTION registrar_cambio_precio();

-- ──────────────────────────────────────────────────────────────
-- TRIGGER: solicitudes counter en repuestos al crear pedido
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION incrementar_solicitudes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.repuesto_id IS NOT NULL THEN
    UPDATE repuestos SET solicitudes = solicitudes + 1 WHERE id = NEW.repuesto_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_solicitudes_rep
  AFTER INSERT ON pedidos
  FOR EACH ROW EXECUTE FUNCTION incrementar_solicitudes();

-- ──────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE perfiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE repuestos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_precios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE devoluciones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparador_precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria          ENABLE ROW LEVEL SECURITY;

-- Función helper: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION mi_rol()
RETURNS rol_usuario LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT rol FROM perfiles WHERE id = auth.uid();
$$;

-- ── perfiles ──
CREATE POLICY "perfiles_select" ON perfiles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "perfiles_update_own" ON perfiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR mi_rol() = 'admin');
CREATE POLICY "perfiles_insert_admin" ON perfiles FOR INSERT TO authenticated
  WITH CHECK (mi_rol() = 'admin');

-- ── proveedores ──
CREATE POLICY "prov_select" ON proveedores FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "prov_insert" ON proveedores FOR INSERT TO authenticated
  WITH CHECK (mi_rol() IN ('admin','suministro'));
CREATE POLICY "prov_update" ON proveedores FOR UPDATE TO authenticated
  USING (mi_rol() IN ('admin','suministro'));
CREATE POLICY "prov_delete" ON proveedores FOR DELETE TO authenticated
  USING (mi_rol() = 'admin');

-- ── repuestos ──
CREATE POLICY "rep_select" ON repuestos FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "rep_insert" ON repuestos FOR INSERT TO authenticated
  WITH CHECK (mi_rol() IN ('admin','suministro'));
CREATE POLICY "rep_update" ON repuestos FOR UPDATE TO authenticated
  USING (mi_rol() IN ('admin','suministro'));
CREATE POLICY "rep_delete" ON repuestos FOR DELETE TO authenticated
  USING (mi_rol() = 'admin');

-- ── historial_precios ──
CREATE POLICY "hist_select" ON historial_precios FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "hist_insert" ON historial_precios FOR INSERT TO authenticated
  WITH CHECK (mi_rol() IN ('admin','suministro'));

-- ── pedidos ──
CREATE POLICY "ped_select" ON pedidos FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "ped_insert" ON pedidos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL); -- cualquier rol puede crear
CREATE POLICY "ped_update_suministro" ON pedidos FOR UPDATE TO authenticated
  USING (
    mi_rol() IN ('admin','suministro') OR  -- suministro/admin editan todo
    (mi_rol() = 'tecnico' AND tecnico_id = auth.uid() AND estado = 'pendiente') -- técnico solo sus pendientes
  );

-- ── comentarios_pedido ──
CREATE POLICY "com_select" ON comentarios_pedido FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "com_insert" ON comentarios_pedido FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid());

-- ── devoluciones ──
CREATE POLICY "dev_select" ON devoluciones FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "dev_insert" ON devoluciones FOR INSERT TO authenticated
  WITH CHECK (mi_rol() IN ('admin','suministro'));

-- ── comparador_precios ──
CREATE POLICY "comp_select" ON comparador_precios FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "comp_insert" ON comparador_precios FOR INSERT TO authenticated
  WITH CHECK (mi_rol() IN ('admin','suministro'));
CREATE POLICY "comp_update" ON comparador_precios FOR UPDATE TO authenticated
  USING (mi_rol() IN ('admin','suministro'));

-- ── notificaciones ──
CREATE POLICY "notif_select" ON notificaciones FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR usuario_id IS NULL); -- propias o broadcast
CREATE POLICY "notif_update_own" ON notificaciones FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid() OR usuario_id IS NULL);

-- ── auditoria ──
CREATE POLICY "audit_select" ON auditoria FOR SELECT TO authenticated
  USING (mi_rol() IN ('admin','suministro'));
CREATE POLICY "audit_insert" ON auditoria FOR INSERT TO authenticated
  WITH CHECK (TRUE); -- triggers insertan con SECURITY DEFINER

-- ──────────────────────────────────────────────────────────────
-- REALTIME: habilitar suscripciones en tablas clave
-- ──────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE repuestos;
ALTER PUBLICATION supabase_realtime ADD TABLE proveedores;
ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE perfiles;
ALTER PUBLICATION supabase_realtime ADD TABLE comentarios_pedido;
ALTER PUBLICATION supabase_realtime ADD TABLE historial_precios;
ALTER PUBLICATION supabase_realtime ADD TABLE auditoria;

-- ──────────────────────────────────────────────────────────────
-- DATOS INICIALES (seed) — ejecutar después del schema
-- ──────────────────────────────────────────────────────────────
-- Ver archivo: supabase/seed.sql
