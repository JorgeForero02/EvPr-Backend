const express = require('express');
const router = express.Router();
const gestion_usuarios = require('../controllers/gestion_usuarios.controller');
const { auth, isAdministrador, isGerenteOrAdmin } = require('../middlewares/auth');

// [BACKEND-FIX] B2: Middleware para verificar que el usuario accede a su propio recurso o es admin
const isOwnerOrAdmin = (req, res, next) => {
    const paramId = parseInt(req.params.id);
    if (req.usuario.id !== paramId && req.usuario.rol !== 'administrador') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo puede modificar su propia información.'
        });
    }
    next();
};

router.get('/', auth, isAdministrador, gestion_usuarios.getAllUsersComplete);
router.get('/:id', auth, isOwnerOrAdmin, gestion_usuarios.getUserComplete);
router.put('/:id/profile', auth, isOwnerOrAdmin, gestion_usuarios.updateProfile);
router.put('/:id/role-data', auth, isOwnerOrAdmin, gestion_usuarios.updateRoleData);
router.put('/:id/company', auth, isGerenteOrAdmin, gestion_usuarios.changeCompany);
router.put('/:id/password', auth, isOwnerOrAdmin, gestion_usuarios.changePassword);
router.patch('/:id/status', auth, isAdministrador, gestion_usuarios.toggleUserStatus);

router.post('/', auth, isAdministrador, gestion_usuarios.createUser);

module.exports = router;
