const express = require('express');
const router = express.Router();
const NotificacionController = require('../controllers/notificacion.controller');
const { auth } = require('../middlewares/auth');

router.get('/mis-notificaciones', auth, NotificacionController.obtenerMisNotificaciones);

router.get('/:notificacionId', auth, NotificacionController.obtenerPorId);

router.put('/:notificacionId/marcar-leida', auth, NotificacionController.marcarComoLeida);

router.delete('/:notificacionId', auth, NotificacionController.eliminarNotificacion);

module.exports = router;
