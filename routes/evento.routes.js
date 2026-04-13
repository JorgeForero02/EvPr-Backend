const express = require('express');
const router = express.Router();
const { auth, isOrganizadorOGerente } = require('../middlewares/auth');
const auditoriaMiddleware = require('../middlewares/auditoria.middleware');
const {
    verificarPermisoEvento,
    verificarPermisoEdicionEvento
} = require('../middlewares/verificarPermisos');
const eventoController = require('../controllers/evento.controller');

const actividadController = require('../controllers/actividad.controller');
const presupuestoController = require('../controllers/presupuesto.controller');
const InscripcionController = require('../controllers/inscripcion.controller');

// POST - Crear evento
router.post('/', auth, isOrganizadorOGerente, verificarPermisoEvento, auditoriaMiddleware('POST'), eventoController.crearEvento);

// GET - Obtener todos los eventos
router.get('/', auth, auditoriaMiddleware('GET'), eventoController.obtenerEventos);


// GET - Obtener evento por ID
router.get('/:eventoId', auth, auditoriaMiddleware('GET'), eventoController.obtenerEventoById);

// PUT - Actualizar evento
router.put('/:eventoId', auth, isOrganizadorOGerente, verificarPermisoEdicionEvento, auditoriaMiddleware('PUT'), eventoController.actualizarEvento);

// DELETE - Eliminar evento (cancelar)
router.delete('/:eventoId', auth, isOrganizadorOGerente, verificarPermisoEdicionEvento, auditoriaMiddleware('DELETE'), eventoController.eliminarEvento);

// --- RUTAS ANIDADAS PARA ACTIVIDADES ---
router.post(
    '/:eventoId/actividades',
    auth,
    isOrganizadorOGerente,
    verificarPermisoEdicionEvento, 
    auditoriaMiddleware('POST'),
    actividadController.crearActividad
);

router.get(
    '/:eventoId/actividades',
    auth,
    auditoriaMiddleware('GET'),
    actividadController.obtenerActividadesPorEvento
);

// Lista de inscritos por evento (para el organizador)
router.get(
    '/:eventoId/inscritos',
    auth,
    isOrganizadorOGerente,
    InscripcionController.obtenerInscritosPorEvento
);

// B10: Exportar lista de inscritos como CSV
router.get(
    '/:eventoId/inscritos/exportar-csv',
    auth,
    isOrganizadorOGerente,
    InscripcionController.exportarInscritosCSV
);

// RF80 — Reporte de evento
router.get(
    '/:eventoId/reporte',
    auth,
    isOrganizadorOGerente,
    eventoController.obtenerReporte
);

// RF80 — Exportar reporte de evento como CSV
router.get(
    '/:eventoId/reporte/exportar-csv',
    auth,
    isOrganizadorOGerente,
    eventoController.exportarReporteCSV
);

// Grupo F — Mensaje manual del Organizador Líder a todos los inscritos
router.post(
    '/:eventoId/notificaciones-manuales',
    auth,
    isOrganizadorOGerente,
    verificarPermisoEdicionEvento,
    auditoriaMiddleware('POST'),
    eventoController.enviarNotificacionManual
);

// RF81 — Presupuesto total del evento
router.get(
    '/:eventoId/presupuesto',
    auth,
    eventoController.obtenerPresupuesto
);

// --- ÍTEMS DE PRESUPUESTO (ingresos y gastos por evento) ---
router.post(
    '/:eventoId/presupuesto-items',
    auth,
    isOrganizadorOGerente,
    verificarPermisoEdicionEvento,
    presupuestoController.crear
);

router.get(
    '/:eventoId/presupuesto-items',
    auth,
    isOrganizadorOGerente,
    presupuestoController.obtenerPorEvento
);

router.put(
    '/:eventoId/presupuesto-items/:id',
    auth,
    isOrganizadorOGerente,
    verificarPermisoEdicionEvento,
    presupuestoController.actualizar
);

router.delete(
    '/:eventoId/presupuesto-items/:id',
    auth,
    isOrganizadorOGerente,
    verificarPermisoEdicionEvento,
    presupuestoController.eliminar
);

module.exports = router;
