const express = require('express');
const router = express.Router();
const RecomendacionController = require('../controllers/recomendacion.controller');
const { auth, isOrganizadorOGerente } = require('../middlewares/auth');

router.get('/sugerencias', auth, isOrganizadorOGerente, RecomendacionController.sugerirConfiguracion);
router.post('/estimar', auth, isOrganizadorOGerente, RecomendacionController.estimarEvento);

module.exports = router;
