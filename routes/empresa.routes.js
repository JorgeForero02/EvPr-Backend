const express = require('express');
const router = express.Router();
const EmpresaController = require('../controllers/empresa.controller');
const UbicacionController = require('../controllers/ubicacion.controller');
const LugarController = require('../controllers/lugar.controller');
const { auth, isAdministrador, isGerenteOrAdmin, isAdminGerenteOrOrganizador, isAsistenteAdministrador, isOrganizadorOGerente } = require('../middlewares/auth');
const auditoriaMiddleware = require('../middlewares/auditoria.middleware');
const verificarEmpresaAprobada = require('../middlewares/verificarEmpresaAprobada');

router.get('/', auth, isAdminGerenteOrOrganizador, EmpresaController.getAll);
router.get('/pendientes', auth, isAdministrador, EmpresaController.getPendientes);
router.get('/aprobadas', auth, isAdministrador, EmpresaController.getAprobadas);
router.get('/rechazadas', auth, isAdministrador, EmpresaController.getRechazadas);
router.get('/:id', auth, isAdminGerenteOrOrganizador, EmpresaController.getById);
router.post('/', auth, isAsistenteAdministrador, EmpresaController.create);
router.patch('/:id/aprobar', auth, isAdministrador, EmpresaController.aprobarEmpresa);
router.put('/:id', auth, isGerenteOrAdmin, EmpresaController.update);
router.delete('/:id', auth, isAdministrador, EmpresaController.delete);
router.get('/:id/equipo', auth, isAdminGerenteOrOrganizador, EmpresaController.getEquipo);

// RF28 — Estadísticas de uso de ubicaciones y salas
router.get(
    '/:empresaId/ubicaciones/stats',
    auth,
    isGerenteOrAdmin,
    verificarEmpresaAprobada,
    UbicacionController.obtenerStatsUbicaciones
);

// --- RUTAS NUEVAS PARA UBICACIONES ANIDADAS ---
router.post(
    '/:empresaId/ubicaciones',
    auth,
    isOrganizadorOGerente,
    verificarEmpresaAprobada,
    auditoriaMiddleware('POST'),
    UbicacionController.crearUbicacion
);

router.get(
    '/:empresaId/ubicaciones',
    auth,
    isAdminGerenteOrOrganizador,
    verificarEmpresaAprobada,
    auditoriaMiddleware('GET'),
    UbicacionController.obtenerUbicacionesEmpresa
);

router.post(
    '/:empresaId/lugares',
    auth,
    isOrganizadorOGerente,
    verificarEmpresaAprobada,
    auditoriaMiddleware('POST'),
    LugarController.crearLugar
);

router.get(
    '/:empresaId/lugares',
    auth,
    isAdminGerenteOrOrganizador,
    verificarEmpresaAprobada,
    auditoriaMiddleware('GET'),
    LugarController.obtenerLugaresEmpresa
);

// RF — Reporte de desempeño de empresa
router.get(
    '/:empresaId/reporte-desempenho',
    auth,
    isGerenteOrAdmin,
    EmpresaController.reporteDesempenho
);

// RF — Exportar reporte de desempeño de empresa como CSV
router.get(
    '/:empresaId/reporte-desempenho/exportar-csv',
    auth,
    isGerenteOrAdmin,
    EmpresaController.exportarReporteDesempenhoCSV
);

// B11: Estadísticas de ocupación promedio por sala
router.get(
    '/:empresaId/estadisticas-ocupacion',
    auth,
    isGerenteOrAdmin,
    EmpresaController.estadisticasOcupacion
);

// --- RUTAS SOLICITUDES DE ACTUALIZACIÓN ---
const solicitudActualizacionRouter = require('./solicitudActualizacion.routes');
router.use('/:id_empresa/solicitudes-actualizacion', solicitudActualizacionRouter);

module.exports = router;