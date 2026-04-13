const express = require('express');
const router = express.Router();
const AuditoriaController = require('../controllers/auditoria.controller');
const { auth, isAdministrador } = require('../middlewares/auth');

router.get('/', auth, isAdministrador, AuditoriaController.getAll);

module.exports = router;
