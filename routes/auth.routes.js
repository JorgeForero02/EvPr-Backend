const express = require('express');
const router = express.Router();
const {
    login,
    register,
    promoverAGerente,
    crearOrganizador,
    refresh,
    getProfile,
    recuperarContrasena,
    crearUsuarioPorAdmin
} = require('../controllers/auth.controller');
const { auth, isAdministrador, isGerenteOrAdmin } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

router.get('/profile', auth, getProfile);

router.post('/promover-gerente', auth, isAdministrador, promoverAGerente);
router.post('/crear-organizador', auth, isGerenteOrAdmin, crearOrganizador);
router.post('/recuperar-contrasena', recuperarContrasena);
router.post('/crear-usuario', auth, isAdministrador, crearUsuarioPorAdmin);

module.exports = router;
