require('dotenv').config();
const db = require('./models');

// ─── DATOS SEMILLA ────────────────────────────────────────────────────────────

const PAISES = [
  { nombre: 'Colombia' },
  { nombre: 'México' },
  { nombre: 'Argentina' },
  { nombre: 'Chile' },
  { nombre: 'Perú' },
  { nombre: 'Ecuador' },
  { nombre: 'Venezuela' },
  { nombre: 'Bolivia' },
  { nombre: 'Paraguay' },
  { nombre: 'Uruguay' },
  { nombre: 'España' },
  { nombre: 'Estados Unidos' },
];

// Ciudades por nombre de país
const CIUDADES_POR_PAIS = {
  Colombia: [
    { nombre: 'Bogotá',         codigo_postal: '110111' },
    { nombre: 'Medellín',       codigo_postal: '050001' },
    { nombre: 'Cali',           codigo_postal: '760001' },
    { nombre: 'Barranquilla',   codigo_postal: '080001' },
    { nombre: 'Cartagena',      codigo_postal: '130001' },
    { nombre: 'Bucaramanga',    codigo_postal: '680001' },
    { nombre: 'Pereira',        codigo_postal: '660001' },
    { nombre: 'Manizales',      codigo_postal: '170001' },
    { nombre: 'Santa Marta',    codigo_postal: '470001' },
    { nombre: 'Cúcuta',         codigo_postal: '540001' },
    { nombre: 'Ibagué',         codigo_postal: '730001' },
    { nombre: 'Pasto',          codigo_postal: '520001' },
    { nombre: 'Armenia',        codigo_postal: '630001' },
    { nombre: 'Villavicencio',  codigo_postal: '500001' },
    { nombre: 'Montería',       codigo_postal: '230001' },
  ],
  México: [
    { nombre: 'Ciudad de México', codigo_postal: '01000' },
    { nombre: 'Guadalajara',      codigo_postal: '44100' },
    { nombre: 'Monterrey',        codigo_postal: '64000' },
    { nombre: 'Puebla',           codigo_postal: '72000' },
    { nombre: 'Tijuana',          codigo_postal: '22000' },
    { nombre: 'León',             codigo_postal: '37000' },
    { nombre: 'Mérida',           codigo_postal: '97000' },
    { nombre: 'Cancún',           codigo_postal: '77500' },
  ],
  Argentina: [
    { nombre: 'Buenos Aires', codigo_postal: 'C1000' },
    { nombre: 'Córdoba',      codigo_postal: 'X5000' },
    { nombre: 'Rosario',      codigo_postal: 'S2000' },
    { nombre: 'Mendoza',      codigo_postal: 'M5500' },
    { nombre: 'Tucumán',      codigo_postal: 'T4000' },
    { nombre: 'Mar del Plata',codigo_postal: 'B7600' },
  ],
  Chile: [
    { nombre: 'Santiago',     codigo_postal: '8320000' },
    { nombre: 'Valparaíso',   codigo_postal: '2340000' },
    { nombre: 'Concepción',   codigo_postal: '4070000' },
    { nombre: 'Antofagasta',  codigo_postal: '1240000' },
    { nombre: 'Temuco',       codigo_postal: '4780000' },
  ],
  Perú: [
    { nombre: 'Lima',      codigo_postal: '15001' },
    { nombre: 'Arequipa', codigo_postal: '04001' },
    { nombre: 'Trujillo', codigo_postal: '13001' },
    { nombre: 'Cusco',    codigo_postal: '08001' },
    { nombre: 'Piura',    codigo_postal: '20001' },
  ],
  Ecuador: [
    { nombre: 'Quito',      codigo_postal: '170150' },
    { nombre: 'Guayaquil',  codigo_postal: '090150' },
    { nombre: 'Cuenca',     codigo_postal: '010150' },
    { nombre: 'Ambato',     codigo_postal: '180150' },
  ],
  Venezuela: [
    { nombre: 'Caracas',    codigo_postal: '1010' },
    { nombre: 'Maracaibo',  codigo_postal: '4001' },
    { nombre: 'Valencia',   codigo_postal: '2001' },
    { nombre: 'Barquisimeto',codigo_postal: '3001' },
  ],
  Bolivia: [
    { nombre: 'La Paz',      codigo_postal: null },
    { nombre: 'Santa Cruz',  codigo_postal: null },
    { nombre: 'Cochabamba',  codigo_postal: null },
  ],
  Paraguay: [
    { nombre: 'Asunción',     codigo_postal: null },
    { nombre: 'Ciudad del Este', codigo_postal: null },
  ],
  Uruguay: [
    { nombre: 'Montevideo', codigo_postal: '11000' },
    { nombre: 'Salto',      codigo_postal: '50000' },
  ],
  España: [
    { nombre: 'Madrid',    codigo_postal: '28001' },
    { nombre: 'Barcelona', codigo_postal: '08001' },
    { nombre: 'Valencia',  codigo_postal: '46001' },
    { nombre: 'Sevilla',   codigo_postal: '41001' },
    { nombre: 'Málaga',    codigo_postal: '29001' },
  ],
  'Estados Unidos': [
    { nombre: 'Nueva York',    codigo_postal: '10001' },
    { nombre: 'Los Ángeles',   codigo_postal: '90001' },
    { nombre: 'Miami',         codigo_postal: '33101' },
    { nombre: 'Chicago',       codigo_postal: '60601' },
    { nombre: 'Houston',       codigo_postal: '77001' },
  ],
};

const TIPOS_NOTIFICACION = [
  { nombre: 'Recordatorio de actividad', descripcion: 'Notificación de recordatorio para actividades programadas próximamente' },
  { nombre: 'Inscripción confirmada',     descripcion: 'Confirmación de inscripción exitosa a un evento' },
  { nombre: 'Inscripción cancelada',      descripcion: 'Notificación de cancelación de una inscripción' },
  { nombre: 'Empresa aprobada',           descripcion: 'La solicitud de afiliación empresarial fue aprobada' },
  { nombre: 'Empresa rechazada',          descripcion: 'La solicitud de afiliación empresarial fue rechazada' },
  { nombre: 'Empresa pendiente',          descripcion: 'Nueva solicitud de afiliación empresarial pendiente de revisión' },
  { nombre: 'Evento publicado',           descripcion: 'Un nuevo evento fue publicado y está disponible' },
  { nombre: 'Evento cancelado',           descripcion: 'Un evento fue cancelado' },
  { nombre: 'Evento actualizado',         descripcion: 'Los detalles de un evento han sido modificados' },
  { nombre: 'Sistema',                    descripcion: 'Notificación general del sistema' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const log = (msg) => console.log(`  ${msg}`);
const sep = () => console.log('─'.repeat(55));

// ─── SEED PRINCIPAL ───────────────────────────────────────────────────────────

const seed = async () => {
  try {
    sep();
    console.log(' SEED: Poblando datos de referencia');
    sep();

    // ── 1. PAÍSES ──────────────────────────────────────────────────────────
    console.log('\n[1/3] Países...');
    const paisesCreados = {};

    for (const datos of PAISES) {
      const [pais, created] = await db.Pais.findOrCreate({
        where: { nombre: datos.nombre },
        defaults: datos,
      });
      paisesCreados[datos.nombre] = pais.id;
      log(created ? `✔ Creado  : ${datos.nombre}` : `  Ya existe: ${datos.nombre} (id=${pais.id})`);
    }

    // ── 2. CIUDADES ────────────────────────────────────────────────────────
    console.log('\n[2/3] Ciudades...');
    let totalCiudades = 0;

    for (const [paisNombre, ciudades] of Object.entries(CIUDADES_POR_PAIS)) {
      const id_pais = paisesCreados[paisNombre];
      if (!id_pais) {
        log(`! País "${paisNombre}" no encontrado, saltando sus ciudades.`);
        continue;
      }
      for (const ciudad of ciudades) {
        const [, created] = await db.Ciudad.findOrCreate({
          where: { nombre: ciudad.nombre, id_pais },
          defaults: { ...ciudad, id_pais },
        });
        if (created) totalCiudades++;
        log(created ? `✔ ${paisNombre} › ${ciudad.nombre}` : `  Ya existe: ${ciudad.nombre}`);
      }
    }

    // ── 3. TIPOS DE NOTIFICACIÓN ───────────────────────────────────────────
    console.log('\n[3/3] Tipos de notificación...');
    let totalTipos = 0;

    for (const datos of TIPOS_NOTIFICACION) {
      const [, created] = await db.TipoNotificacion.findOrCreate({
        where: { nombre: datos.nombre },
        defaults: datos,
      });
      if (created) totalTipos++;
      log(created ? `✔ Creado  : ${datos.nombre}` : `  Ya existe: ${datos.nombre}`);
    }

    // ── RESUMEN ────────────────────────────────────────────────────────────
    sep();
    console.log(' SEED COMPLETADO');
    console.log(`  Países           : ${Object.keys(paisesCreados).length}`);
    console.log(`  Ciudades nuevas  : ${totalCiudades}`);
    console.log(`  Tipos notif.     : ${totalTipos}`);
    sep();

    process.exit(0);
  } catch (error) {
    console.error('\n ERROR EN EL SEED:');
    console.error('   Mensaje:', error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error('    -', e.message));
    }
    console.error('\n');
    process.exit(1);
  }
};

// ─── ARRANQUE ─────────────────────────────────────────────────────────────────

db.sequelize.sync().then(seed).catch((error) => {
  console.error('Error al conectar con la base de datos:', error.message);
  process.exit(1);
});
