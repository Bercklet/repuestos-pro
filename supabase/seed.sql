-- ============================================================
-- RepuestosPRO — Seed Data
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================
-- IMPORTANTE: Primero crea los usuarios en Supabase Auth:
--   Dashboard → Authentication → Users → Add User
--   admin@taller.com      / Admin123!
--   suministro@taller.com / Sumi123!
--   tecnico@taller.com    / Tecnico123!
-- Los perfiles se crean automáticamente via trigger.
-- O actualiza los UUIDs abajo con los IDs reales de auth.users.

-- ── PROVEEDORES ──────────────────────────────────────────────
INSERT INTO proveedores (id, nombre, tipo, ciudad, contacto, telefono, email, rating, estado, categorias, comentario, historial_pagos, precios_competitivos) VALUES
('a1000000-0000-0000-0000-000000000001', 'TechParts Colombia',    'Mayorista',    'Bogotá',   'Roberto Gómez',  '+57 310 234 5678', 'ventas@techparts.co',       4.8, 'activo',  ARRAY['Display','Batería','Conector','Cámara'], 'Proveedor principal. Excelente calidad y tiempos.', 'Al día', TRUE),
('a1000000-0000-0000-0000-000000000002', 'Repuestos Global SAS',  'Distribuidor', 'Medellín', 'Sandra Ríos',    '+57 314 876 5432', 'info@repuestosglobal.co',   4.5, 'activo',  ARRAY['Display','Flex','Tapa trasera'],         'Buenos precios pero tiempos variables.',            'Al día', TRUE),
('a1000000-0000-0000-0000-000000000003', 'DistriMovil SAS',       'Minorista',    'Medellín', 'Camilo Torres',  '+57 300 123 4567', 'camilo@distrimovil.co',     4.2, 'activo',  ARRAY['Conector','Flex','Batería'],             'Bueno para piezas pequeñas y económicas.',          'Al día', FALSE),
('a1000000-0000-0000-0000-000000000004', 'CelPartes Express',     'Mayorista',    'Cali',     'Lucía Bermúdez', '+57 315 999 8877', 'lucia@celpartes.co',        3.9, 'pausado', ARRAY['Display','Batería'],                     'Tiempos de entrega irregulares. En evaluación.',   'Pendiente verificación', TRUE);

-- ── REPUESTOS ────────────────────────────────────────────────
INSERT INTO repuestos (id, nombre, marca, modelo, categoria, calidad, precio_actual, precio_min, precio_max, solicitudes, proveedor_id, stock, tags, aliases) VALUES
('b1000000-0000-0000-0000-000000000001', 'Pantalla Samsung A54',     'Samsung',  'Galaxy A54',  'Display',   'Original',  145000, 108000, 158000, 18, 'a1000000-0000-0000-0000-000000000001', 'disponible', ARRAY['display','amoled','original','a54'],       ARRAY['Pantalla Galaxy A54','Display Samsung A54','Módulo pantalla A54']),
('b1000000-0000-0000-0000-000000000002', 'Batería iPhone 13',        'Apple',    'iPhone 13',   'Batería',   'OEM',        92000,  82000, 105000, 14, 'a1000000-0000-0000-0000-000000000003', 'disponible', ARRAY['bateria','apple','iphone13','oem'],        ARRAY['Battery iPhone 13','Pila iPhone 13']),
('b1000000-0000-0000-0000-000000000003', 'Pantalla Oppo A79 5G',     'Oppo',     'A79 5G',      'Display',   'Genérico',  115000, 100000, 130000, 11, 'a1000000-0000-0000-0000-000000000002', 'disponible', ARRAY['display','oppo','a79','generico'],         ARRAY['Oppo A79 pantalla','Display A79','Pantalla Oppo A79']),
('b1000000-0000-0000-0000-000000000004', 'Flex carga USB-C universal','Genérico', 'Universal',   'Conector',  'Genérico',   18000,  12000,  22000,  9, 'a1000000-0000-0000-0000-000000000003', 'disponible', ARRAY['flex','usbc','carga','conector'],          ARRAY['Conector USB-C','Puerto carga USB']),
('b1000000-0000-0000-0000-000000000005', 'Cámara trasera Xiaomi 12T','Xiaomi',   '12T',         'Cámara',    'OEM',        78000,  65000,  92000,  7, 'a1000000-0000-0000-0000-000000000001', 'agotado',    ARRAY['camara','xiaomi','12t','oem'],             ARRAY['Camera Xiaomi 12T','Módulo cámara 12T']),
('b1000000-0000-0000-0000-000000000006', 'Batería Samsung Galaxy S23','Samsung', 'Galaxy S23',  'Batería',   'Original',   85000,  75000,  98000,  6, 'a1000000-0000-0000-0000-000000000001', 'disponible', ARRAY['bateria','samsung','s23','original'],      ARRAY['Batería S23','Pila Samsung S23']),
('b1000000-0000-0000-0000-000000000007', 'Conector carga iPhone 14', 'Apple',    'iPhone 14',   'Conector',  'OEM',        65000,  52000,  75000,  5, 'a1000000-0000-0000-0000-000000000003', 'disponible', ARRAY['conector','apple','iphone14','oem'],       ARRAY['Puerto carga iPhone 14','Lightning iPhone 14']);

-- ── HISTORIAL DE PRECIOS ─────────────────────────────────────
INSERT INTO historial_precios (repuesto_id, precio, mes, created_at) VALUES
('b1000000-0000-0000-0000-000000000001', 158000, 'Dic', NOW() - INTERVAL '5 months'),
('b1000000-0000-0000-0000-000000000001', 150000, 'Ene', NOW() - INTERVAL '4 months'),
('b1000000-0000-0000-0000-000000000001', 108000, 'Feb', NOW() - INTERVAL '3 months'),
('b1000000-0000-0000-0000-000000000001', 140000, 'Mar', NOW() - INTERVAL '2 months'),
('b1000000-0000-0000-0000-000000000001', 142000, 'Abr', NOW() - INTERVAL '1 month'),
('b1000000-0000-0000-0000-000000000001', 145000, 'May', NOW()),
('b1000000-0000-0000-0000-000000000002', 105000, 'Dic', NOW() - INTERVAL '5 months'),
('b1000000-0000-0000-0000-000000000002',  98000, 'Ene', NOW() - INTERVAL '4 months'),
('b1000000-0000-0000-0000-000000000002',  82000, 'Feb', NOW() - INTERVAL '3 months'),
('b1000000-0000-0000-0000-000000000002',  88000, 'Mar', NOW() - INTERVAL '2 months'),
('b1000000-0000-0000-0000-000000000002',  90000, 'Abr', NOW() - INTERVAL '1 month'),
('b1000000-0000-0000-0000-000000000002',  92000, 'May', NOW()),
('b1000000-0000-0000-0000-000000000003', 130000, 'Dic', NOW() - INTERVAL '5 months'),
('b1000000-0000-0000-0000-000000000003', 125000, 'Ene', NOW() - INTERVAL '4 months'),
('b1000000-0000-0000-0000-000000000003', 100000, 'Feb', NOW() - INTERVAL '3 months'),
('b1000000-0000-0000-0000-000000000003', 118000, 'Mar', NOW() - INTERVAL '2 months'),
('b1000000-0000-0000-0000-000000000003', 120000, 'Abr', NOW() - INTERVAL '1 month'),
('b1000000-0000-0000-0000-000000000003', 115000, 'May', NOW());

-- ── COMPARADOR PRECIOS ───────────────────────────────────────
INSERT INTO comparador_precios (repuesto_id, proveedor_id, precio, calidad, tiempo_entrega, stock) VALUES
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 145000, 'Original',  '1–2 días', 'disponible'),
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 138000, 'OEM',       '2–3 días', 'disponible'),
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 132000, 'Genérico',  '4–5 días', 'bajo'),
('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 124000, 'Genérico',  '2–3 días', 'disponible'),
('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 130000, 'OEM',       '1–2 días', 'disponible'),
('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 115000, 'Genérico',  '3 días',   'bajo');

-- NOTA: Los pedidos NO se insertan aquí porque requieren
-- UUIDs reales de auth.users (tecnico_id).
-- Crea los usuarios primero, luego usa el dashboard o el app
-- para crear pedidos de prueba.
