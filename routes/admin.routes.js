const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const SolicitudActualizacionController = require('../controllers/solicitudActualizacion.controller');
const { auth, isAdministrador } = require('../middlewares/auth');

// RF10/RF13 — Estadísticas del dashboard del administrador
router.get('/dashboard/stats', auth, isAdministrador, AdminController.obtenerDashboardStats);
router.get('/dashboard/exportar-csv', auth, isAdministrador, AdminController.exportarDashboardCSV);

// B4: Gestión de roles del sistema
router.get('/roles', auth, isAdministrador, AdminController.listarRoles);
router.post('/roles', auth, isAdministrador, AdminController.crearRol);
router.patch('/roles/:tipo/toggle-estado', auth, isAdministrador, AdminController.toggleRolEstado);

// Solicitudes de actualización de empresa — para el admin
router.get('/solicitudes-actualizacion', auth, isAdministrador, SolicitudActualizacionController.obtenerTodas);
router.get('/solicitudes-actualizacion/:id', auth, isAdministrador, SolicitudActualizacionController.obtenerPorId);
router.patch('/solicitudes-actualizacion/:id/procesar', auth, isAdministrador, SolicitudActualizacionController.procesar);

module.exports = router;
