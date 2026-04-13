const express = require('express');
const router = express.Router();
const CiudadController = require('../controllers/ciudad.controller');
// [BACKEND-FIX] B1: Proteger rutas de escritura con auth + isAdministrador
const { auth, isAdministrador } = require('../middlewares/auth');

// GET públicas (necesarias para formularios de registro)
router.get('/', CiudadController.getAll);
router.get('/:id', CiudadController.getById);

// Escritura solo para administradores
router.post('/', auth, isAdministrador, CiudadController.create);
router.put('/:id', auth, isAdministrador, CiudadController.update);
router.delete('/:id', auth, isAdministrador, CiudadController.delete);

module.exports = router;
