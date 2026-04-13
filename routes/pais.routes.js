const express = require('express');
const router = express.Router();
const PaisController = require('../controllers/pais.controller');
// [BACKEND-FIX] B1: Proteger rutas de escritura con auth + isAdministrador
const { auth, isAdministrador } = require('../middlewares/auth');

// GET públicas (necesarias para formularios de registro)
router.get('/', PaisController.getAll);
router.get('/:id', PaisController.getById);

// Escritura solo para administradores
router.post('/', auth, isAdministrador, PaisController.create);
router.put('/:id', auth, isAdministrador, PaisController.update);
router.delete('/:id', auth, isAdministrador, PaisController.delete);

module.exports = router;
