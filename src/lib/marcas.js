// src/lib/marcas.js
// Catálogo de marcas y modelos de celulares reconocidos
// Fuente: mercado colombiano (los más solicitados en talleres)

export const MARCAS_MODELOS = {
  Samsung: [
    // Galaxy S (Flagship)
    'Galaxy S24 Ultra','Galaxy S24+','Galaxy S24',
    'Galaxy S23 Ultra','Galaxy S23+','Galaxy S23','Galaxy S23 FE',
    'Galaxy S22 Ultra','Galaxy S22+','Galaxy S22',
    'Galaxy S21 Ultra','Galaxy S21+','Galaxy S21','Galaxy S21 FE',
    'Galaxy S20 Ultra','Galaxy S20+','Galaxy S20','Galaxy S20 FE',
    'Galaxy S10+','Galaxy S10','Galaxy S10e','Galaxy S10 5G',
    'Galaxy S9+','Galaxy S9','Galaxy S8+','Galaxy S8',
    // Galaxy A (Mid-range) — los más comunes en taller
    'Galaxy A55','Galaxy A54','Galaxy A53','Galaxy A52','Galaxy A52s','Galaxy A51',
    'Galaxy A35','Galaxy A34','Galaxy A33','Galaxy A32','Galaxy A31',
    'Galaxy A25','Galaxy A24','Galaxy A23','Galaxy A22','Galaxy A21s',
    'Galaxy A15','Galaxy A14','Galaxy A13','Galaxy A12','Galaxy A11','Galaxy A10',
    'Galaxy A05s','Galaxy A05','Galaxy A04s','Galaxy A04',
    'Galaxy A73','Galaxy A72','Galaxy A71','Galaxy A70',
    // Galaxy M
    'Galaxy M54','Galaxy M34','Galaxy M14','Galaxy M12',
    // Galaxy Note
    'Galaxy Note 20 Ultra','Galaxy Note 20','Galaxy Note 10+','Galaxy Note 10',
    'Galaxy Note 9','Galaxy Note 8',
    // Galaxy Z
    'Galaxy Z Fold 5','Galaxy Z Fold 4','Galaxy Z Fold 3',
    'Galaxy Z Flip 5','Galaxy Z Flip 4','Galaxy Z Flip 3',
  ],

  iPhone: [
    // iPhone 15
    'iPhone 15 Pro Max','iPhone 15 Pro','iPhone 15 Plus','iPhone 15',
    // iPhone 14
    'iPhone 14 Pro Max','iPhone 14 Pro','iPhone 14 Plus','iPhone 14',
    // iPhone 13
    'iPhone 13 Pro Max','iPhone 13 Pro','iPhone 13 Mini','iPhone 13',
    // iPhone 12
    'iPhone 12 Pro Max','iPhone 12 Pro','iPhone 12 Mini','iPhone 12',
    // iPhone 11
    'iPhone 11 Pro Max','iPhone 11 Pro','iPhone 11',
    // iPhone X / XS / XR
    'iPhone XS Max','iPhone XS','iPhone XR','iPhone X',
    // iPhone SE
    'iPhone SE (3ra gen)','iPhone SE (2da gen)','iPhone SE (1ra gen)',
    // iPhone 8 / 7 / 6
    'iPhone 8 Plus','iPhone 8','iPhone 7 Plus','iPhone 7',
    'iPhone 6s Plus','iPhone 6s','iPhone 6 Plus','iPhone 6',
  ],

  Xiaomi: [
    // Redmi Note (los más frecuentes en taller)
    'Redmi Note 13 Pro+','Redmi Note 13 Pro','Redmi Note 13','Redmi Note 13 5G',
    'Redmi Note 12 Pro+','Redmi Note 12 Pro','Redmi Note 12','Redmi Note 12 5G',
    'Redmi Note 11 Pro+','Redmi Note 11 Pro','Redmi Note 11','Redmi Note 11s',
    'Redmi Note 10 Pro','Redmi Note 10','Redmi Note 10s',
    'Redmi Note 9 Pro','Redmi Note 9','Redmi Note 9s',
    'Redmi Note 8 Pro','Redmi Note 8',
    // Redmi
    'Redmi 13C','Redmi 12','Redmi 12C','Redmi 10C','Redmi 10','Redmi 9C','Redmi 9A','Redmi 9',
    // Mi / Poco / 13
    'Xiaomi 13 Pro','Xiaomi 13','Xiaomi 12 Pro','Xiaomi 12',
    'POCO X6 Pro','POCO X6','POCO X5 Pro','POCO X5','POCO X4 Pro','POCO X3 Pro',
    'POCO M6 Pro','POCO M5','POCO M4 Pro','POCO M3',
    'POCO F5 Pro','POCO F5','POCO F4','POCO F3',
  ],

  Motorola: [
    // Moto G (muy comunes en taller)
    'Moto G84','Moto G73','Moto G72','Moto G62','Moto G52','Moto G42','Moto G32',
    'Moto G54','Moto G34','Moto G14','Moto G13',
    'Moto G Stylus 2024','Moto G Stylus 2023',
    'Moto G Power 2023','Moto G Power 2022',
    'Moto G Play 2023','Moto G Play 2022',
    // Moto Edge
    'Moto Edge 40 Pro','Moto Edge 40','Moto Edge 30 Ultra','Moto Edge 30 Pro','Moto Edge 30',
    // Moto E
    'Moto E13','Moto E32','Moto E40','Moto E20',
    // Razr
    'Moto Razr 40 Ultra','Moto Razr 40',
  ],

  Huawei: [
    'P60 Pro','P50 Pro','P50','P40 Pro+','P40 Pro','P40',
    'P30 Pro','P30','P20 Pro','P20',
    'Mate 60 Pro','Mate 50 Pro','Mate 40 Pro','Mate 30 Pro','Mate 20 Pro','Mate 20',
    'Nova 12 Pro','Nova 11','Nova 10 Pro','Nova 9','Nova 8','Nova 7','Nova 5T',
    'Y9 Prime','Y9','Y7p','Y6p','Y5p',
    'Honor 90','Honor 70','Honor 50','Honor Magic5 Pro',
  ],

  LG: [
    'Velvet','Wing','V60 ThinQ','V50 ThinQ','V40 ThinQ',
    'G8 ThinQ','G7 ThinQ','G6','G5',
    'K71','K61','K51s','K42','K41s','K31',
    'Q70','Q60','Q52','Q51',
    'Stylo 6','Stylo 5','Stylo 4',
    'K52','K22','K12 Plus',
  ],

  Oppo: [
    'Find X6 Pro','Find X5 Pro','Find X5','Find N3 Flip',
    'Reno 10 Pro+','Reno 10 Pro','Reno 10','Reno 8 Pro','Reno 8','Reno 8T',
    'Reno 7 Pro','Reno 7','Reno 6 Pro','Reno 6',
    'A98','A78','A77','A57','A55','A54','A53','A52',
    'A17','A16','A15',
  ],

  Vivo: [
    'X90 Pro','X80 Pro','X70 Pro',
    'V29 Pro','V29','V27 Pro','V27','V25 Pro','V25',
    'Y100','Y78','Y55','Y35','Y22','Y21',
    'T2x','T1 Pro','T1',
  ],

  Realme: [
    'GT 5 Pro','GT5','GT 3 Pro','GT 2 Pro','GT Neo 5',
    '11 Pro+','11 Pro','11','10 Pro+','10 Pro','10',
    '9 Pro+','9 Pro','9i','8 Pro','8','8i',
    'C55','C53','C35','C33','C30','C25Y',
    'Narzo 60 Pro','Narzo 50 Pro','Narzo 50',
  ],

  Sony: [
    'Xperia 1 V','Xperia 1 IV','Xperia 1 III',
    'Xperia 5 V','Xperia 5 IV','Xperia 5 III',
    'Xperia 10 V','Xperia 10 IV','Xperia 10 III',
    'Xperia Pro-I',
  ],

  Nokia: [
    'G42','G21','G20','G11','G10',
    'C31','C21 Plus','C21','C12','C11',
    'XR21','X30','X20','X10',
    '8.3 5G','7.2','6.2','5.4','3.4','2.4',
  ],

  Tecno: [
    'Phantom X2 Pro','Phantom V Flip',
    'Camon 20 Pro','Camon 20','Camon 19 Pro','Camon 19',
    'Spark 20 Pro','Spark 20','Spark 10 Pro','Spark 10',
    'Pop 7 Pro','Pop 7','Pop 6 Pro',
  ],

  Infinix: [
    'Zero 30','Zero 20','Note 30 Pro','Note 30','Note 12 Pro',
    'Hot 40 Pro','Hot 40','Hot 30','Hot 20','Hot 12 Pro',
    'Smart 8','Smart 7','Smart 6',
  ],

  Itel: [
    'A70','A58','A48','A25 Pro',
    'P40+','P38 Pro','P36 Pro',
    'S23+','S20',
  ],
};

// ── Componentes/partes que se piden con frecuencia ─────────────
export const COMPONENTES = [
  'Pantalla completa (LCD + táctil)',
  'Pantalla OLED completa',
  'Táctil / Digitalizador',
  'Batería',
  'Tapa trasera',
  'Marco / Chasis',
  'Conector de carga',
  'Puerto USB-C',
  'Puerto Lightning',
  'Cámara trasera principal',
  'Cámara trasera ultra gran angular',
  'Cámara trasera teleobjetivo',
  'Cámara frontal / Selfie',
  'Módulo de cámara completo',
  'Altavoz / Bocina principal',
  'Auricular / Bocina de llamadas',
  'Micrófono',
  'Botón de encendido',
  'Botón de volumen',
  'Botón Home / Huella dactilar',
  'Lector de huellas bajo pantalla',
  'Sensor de proximidad',
  'Sensor Face ID / Face Unlock',
  'Placa base / Motherboard',
  'Flex de carga',
  'Flex de pantalla',
  'Antena NFC',
  'Antena WiFi / Bluetooth',
  'Vibrador / Motor háptico',
  'Lente de cámara (vidrio)',
  'Vidrio trasero',
  'Cristal frontal (sin táctil)',
  'Marco de pantalla',
  'Conector de audífonos 3.5mm',
  'Bandeja SIM',
  'Módulo 5G',
  'Condensadores / Componentes SMD',
];

// ── Todas las marcas como array ────────────────────────────────
export const MARCAS = Object.keys(MARCAS_MODELOS);

// ── Buscar modelos de una marca ────────────────────────────────
export function getModelos(marca) {
  return MARCAS_MODELOS[marca] || [];
}

// ── Buscar sugerencias de marca por texto ──────────────────────
export function sugerirMarcas(texto) {
  if (!texto) return MARCAS;
  const q = texto.toLowerCase();
  return MARCAS.filter(m => m.toLowerCase().includes(q));
}

// ── Buscar sugerencias de modelo por texto y marca ────────────
export function sugerirModelos(marca, texto) {
  const modelos = marca ? getModelos(marca) : Object.values(MARCAS_MODELOS).flat();
  if (!texto) return modelos.slice(0, 10);
  const q = texto.toLowerCase();
  return modelos.filter(m => m.toLowerCase().includes(q)).slice(0, 12);
}

// ── Buscar sugerencias de componente ──────────────────────────
export function sugerirComponentes(texto) {
  if (!texto) return COMPONENTES.slice(0, 8);
  const q = texto.toLowerCase();
  return COMPONENTES.filter(c => c.toLowerCase().includes(q)).slice(0, 10);
}

// ── Generar clave de agrupación para un pedido ────────────────
// Normaliza marca+modelo+componente para agrupar pedidos similares
export function claveAgrupacion(marca, modelo, repuesto) {
  const norm = s => (s || '').toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u');

  return `${norm(marca)}|${norm(modelo)}|${norm(repuesto)}`;
}
