const express = require('express');
const router = express.Router();
const AsistenciaController = require('../controllers/asistencia.controller');
const { auth, isOrganizadorOGerente } = require('../middlewares/auth');
const auditoriaMiddleware = require('../middlewares/auditoria.middleware');

router.get('/codigo-checkin/:id_evento', auth, isOrganizadorOGerente, AsistenciaController.obtenerCodigoCheckin);
router.post('/checkin', auth, AsistenciaController.registrarCheckin);
router.post('/codigo', auth, isOrganizadorOGerente, auditoriaMiddleware('POST'), AsistenciaController.registrarAsistenciaPorCodigo);

router.get('/mis-asistencias', auth, AsistenciaController.obtenerMisAsistencias);

router.get('/evento/:id_evento', auth, isOrganizadorOGerente, AsistenciaController.obtenerAsistenciasEvento);

// Registro manual del organizador: crea o sobrescribe la asistencia de un participante
// :id = id de la inscripción; body: { estado: 'Presente' | 'Ausente' }
router.patch('/:id/manual', auth, isOrganizadorOGerente, auditoriaMiddleware('PATCH'), AsistenciaController.registrarAsistenciaManual);

module.exports = router;
