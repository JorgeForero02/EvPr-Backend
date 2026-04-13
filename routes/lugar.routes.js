const express = require('express');
const router = express.Router(); 
const { auth, isOrganizadorOGerente, isAdminGerenteOrOrganizador } = require('../middlewares/auth');
const auditoriaMiddleware = require('../middlewares/auditoria.middleware');
const lugarController = require('../controllers/lugar.controller');
const verificarEmpresaAprobada = require('../middlewares/verificarEmpresaAprobada');

router.get(
    '/:lugarId',
    auth,
    isAdminGerenteOrOrganizador,
    verificarEmpresaAprobada,
    auditoriaMiddleware('GET'),
    lugarController.obtenerLugarById
);

router.put(
    '/:lugarId',
    auth,
    isOrganizadorOGerente,
    verificarEmpresaAprobada,
    auditoriaMiddleware('PUT'),
    lugarController.actualizarLugar
);

router.delete(
    '/:lugarId',
    auth,
    isOrganizadorOGerente,
    verificarEmpresaAprobada,
    auditoriaMiddleware('DELETE'),
    lugarController.eliminarLugar
);

// RF27 — Deshabilitar/habilitar sala sin borrar histórico
router.patch(
    '/:lugarId/toggle-estado',
    auth,
    isOrganizadorOGerente,
    verificarEmpresaAprobada,
    lugarController.toggleEstadoLugar
);

module.exports = router;