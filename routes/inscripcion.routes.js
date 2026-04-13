const express = require('express');
const router = express.Router();
const InscripcionController = require('../controllers/inscripcion.controller');
const { auth, isOrganizadorOGerente } = require('../middlewares/auth');
const auditoriaMiddleware = require('../middlewares/auditoria.middleware');

router.get(
    '/eventos-disponibles',
    InscripcionController.obtenerEventosDisponibles
);


router.post(
    '/',
    auth,
    auditoriaMiddleware('POST'),
    InscripcionController.inscribirEvento
);

router.get(
    '/mis-inscripciones',
    auth,
    InscripcionController.obtenerMisInscripciones
);

router.post(
    '/inscribir-equipo',
    auth,
    isOrganizadorOGerente, 
    auditoriaMiddleware('POST'),
    InscripcionController.inscribirEquipo
);

router.get(
    '/confirmar/:codigo',
    InscripcionController.confirmarInscripcion
);

// RF56 — Cancelar inscripción (solo el asistente dueño, antes del inicio del evento)
router.patch(
    '/:id/cancelar',
    auth,
    auditoriaMiddleware('PUT'),
    InscripcionController.cancelarInscripcion
);

module.exports = router;