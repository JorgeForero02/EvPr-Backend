const express = require('express');
const router = express.Router();
const PonenteActividadController = require('../controllers/ponenteActividad.controller');
const { auth, isAdminGerenteOrOrganizador } = require('../middlewares/auth');

router.post('/', auth, isAdminGerenteOrOrganizador, PonenteActividadController.asignarPonente);

router.get('/actividad/:actividadId', auth, PonenteActividadController.obtenerPorActividad);

router.get('/ponente/:ponenteId', auth, PonenteActividadController.obtenerPorPonente);

router.get('/ponentes', auth, isAdminGerenteOrOrganizador, PonenteActividadController.obtenerPonentesDisponibles);

router.put('/:ponenteId/:actividadId/responder-invitacion', auth, PonenteActividadController.responderInvitacion);

router.post('/:ponenteId/:actividadId/solicitar-cambio', auth, PonenteActividadController.solicitarCambio);

router.put('/:ponenteId/:actividadId/procesar-solicitud', auth, isAdminGerenteOrOrganizador, PonenteActividadController.procesarSolicitud);

router.get('/:ponenteId/:actividadId', auth, PonenteActividadController.obtenerAsignacion);

router.put('/:ponenteId/:actividadId', auth, isAdminGerenteOrOrganizador, PonenteActividadController.actualizarAsignacion);

router.delete('/:ponenteId/:actividadId', auth, isAdminGerenteOrOrganizador, PonenteActividadController.eliminarAsignacion);

module.exports = router;
