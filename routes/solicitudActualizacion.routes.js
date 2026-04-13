const express = require('express');
const router = express.Router({ mergeParams: true });
const SolicitudActualizacionController = require('../controllers/solicitudActualizacion.controller');
const { auth, isAdministrador, isGerenteOrAdmin } = require('../middlewares/auth');

router.post(
    '/',
    auth,
    SolicitudActualizacionController.crear
);

router.get(
    '/',
    auth,
    SolicitudActualizacionController.obtenerPorEmpresa
);

module.exports = router;
