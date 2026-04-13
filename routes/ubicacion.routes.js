const express = require('express');
const router = express.Router(); 
const { auth, isOrganizadorOGerente, isAdministrador, isAdminGerenteOrOrganizador } = require('../middlewares/auth'); // <-- Se añade isAdminGerenteOrOrganizador
const auditoriaMiddleware = require('../middlewares/auditoria.middleware');
const ubicacionController = require('../controllers/ubicacion.controller');
const verificarEmpresaAprobada = require('../middlewares/verificarEmpresaAprobada');

router.get(
    '/:ubicacionId',
    auth,
    isAdminGerenteOrOrganizador,
    verificarEmpresaAprobada,
    auditoriaMiddleware('GET'),
    ubicacionController.obtenerUbicacionById
);

router.put(
    '/:ubicacionId',
    auth,
    isOrganizadorOGerente,
    verificarEmpresaAprobada,
    auditoriaMiddleware('PUT'),
    ubicacionController.actualizarUbicacion
);

router.delete(
    '/:ubicacionId',
    auth,
    isOrganizadorOGerente,
    verificarEmpresaAprobada,
    auditoriaMiddleware('DELETE'),
    ubicacionController.eliminarUbicacion
);

// RF24 — Deshabilitar/habilitar ubicación sin borrar histórico
router.patch(
    '/:ubicacionId/toggle-estado',
    auth,
    isOrganizadorOGerente,
    verificarEmpresaAprobada,
    ubicacionController.toggleEstadoUbicacion
);

module.exports = router;