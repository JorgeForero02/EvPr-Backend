const express = require('express');
const router = express.Router();
const RecomendacionController = require('../controllers/recomendacion.controller');
const { auth, isPonente } = require('../middlewares/auth');
router.get('/perfil-asistentes', auth, isPonente, RecomendacionController.perfilAsistentes);
router.get('/sesiones-similares', auth, isPonente, RecomendacionController.sesionesSimilares);
module.exports = router;
