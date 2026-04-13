const express = require('express');
const router = express.Router(); 
const { auth, isOrganizadorOGerente } = require('../middlewares/auth');
const auditoriaMiddleware = require('../middlewares/auditoria.middleware');
// [BACKEND-FIX] B4: Importar middleware de ownership para actividades
const { verificarPermisoActividad } = require('../middlewares/verificarPermisos');
const actividadController = require('../controllers/actividad.controller');

router.get(
    '/:actividadId',
    auth,
    auditoriaMiddleware('GET'),
    actividadController.obtenerActividadPorId
);

router.get(
    '/:actividadId/lugares',
    auth,
    actividadController.obtenerLugaresDeActividad
);

router.put(
    '/:actividadId',
    auth,
    isOrganizadorOGerente,
    verificarPermisoActividad,
    auditoriaMiddleware('PUT'),
    actividadController.actualizarActividad
);

router.delete(
    '/:actividadId',
    auth,
    isOrganizadorOGerente,
    verificarPermisoActividad,
    auditoriaMiddleware('DELETE'),
    actividadController.eliminarActividad
);

module.exports = router;