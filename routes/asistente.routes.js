const express = require('express');
const router = express.Router();
const RecomendacionController = require('../controllers/recomendacion.controller');
const { auth, isAsistente } = require('../middlewares/auth');
router.get('/recomendaciones-sesiones', auth, isAsistente, RecomendacionController.recomendarSesiones);
module.exports = router;
