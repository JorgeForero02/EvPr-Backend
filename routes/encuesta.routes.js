const express = require('express');
const router = express.Router();
const EncuestaController = require('../controllers/encuesta.controller');
const { auth, isAdminGerenteOrOrganizador, isAdminGerenteOrganizadorOrPonente, isPonente, isOrganizadorOGerente } = require('../middlewares/auth');
const { 
    validarPermisoLecturaEncuestas, 
    validarPermiso,
    validarPermisoCreacionEncuesta
} = require('../validators/encuesta.validator');
router.post(
    '/',
    auth,
    isAdminGerenteOrganizadorOrPonente,
    validarPermisoCreacionEncuesta,
    EncuestaController.crearEncuesta
);

router.get(
    '/',
    auth,
    EncuestaController.obtenerEncuestas
);

// [BACKEND-FIX] B10: Rutas literales ANTES de rutas con :encuestaId para evitar que Express las capture como parámetro
router.get(
    '/respuestas/asistentes',
    auth,
    EncuestaController.obtenerRespuestasEncuestaAsistentes
);

router.post(
    '/completar',
    auth,
    EncuestaController.completarEncuesta
);

// Encuesta rápida del ponente (solo ponente, activa de inmediato)
router.post(
    '/rapida',
    auth,
    isPonente,
    EncuestaController.crearEncuestaRapida
);

router.get(
    '/:encuestaId',
    auth,
    validarPermiso,
    EncuestaController.obtenerEncuestaPorId
);

router.put(
    '/:encuestaId',
    auth,
    isAdminGerenteOrganizadorOrPonente,
    validarPermiso,
    EncuestaController.actualizarEncuesta
);

router.delete(
    '/:encuestaId',
    auth,
    isAdminGerenteOrganizadorOrPonente,
    validarPermiso,
    EncuestaController.eliminarEncuesta
);

router.post(
    '/:encuestaId/enviar',
    auth,
    isAdminGerenteOrganizadorOrPonente,
    validarPermiso,
    EncuestaController.enviarEncuesta
);

router.get(
    '/:encuestaId/estadisticas',
    auth,
    isAdminGerenteOrganizadorOrPonente,
    validarPermiso,
    EncuestaController.obtenerEstadisticas
);

router.get('/:encuestaId/exportar-csv', auth, EncuestaController.exportarResultadosCSV);

// Habilitar encuesta para el ponente de una actividad
router.patch(
    '/:encuestaId/habilitar-ponente',
    auth,
    isOrganizadorOGerente,
    EncuestaController.habilitarParaPonente
);

module.exports = router;
