const express = require('express');
const router = express.Router();
const IAController = require('../controllers/ia.controller');
const { auth, isOrganizadorOGerente } = require('../middlewares/auth');

router.post('/generar-mensaje', auth, isOrganizadorOGerente, IAController.generarMensaje);
router.post('/generar-descripcion', auth, isOrganizadorOGerente, IAController.generarDescripcion);
router.post('/planificar-evento', auth, isOrganizadorOGerente, IAController.planificarEvento);

module.exports = router;
