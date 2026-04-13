const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No se proporcionó token de autenticación'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

const isAdministrador = async (req, res, next) => {
    if (req.usuario.rol !== 'administrador') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de administrador del sistema'
        });
    }
    next();
};

const isGerente = async (req, res, next) => {
    if (req.usuario.rol !== 'gerente') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de gerente'
        });
    }
    next();
};

const isOrganizador = async (req, res, next) => {
    if (req.usuario.rol !== 'organizador') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de organizador'
        });
    }
    next();
};

const isPonente = async (req, res, next) => {
    if (req.usuario.rol !== 'ponente') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de ponente'
        });
    }
    next();
};

const isAsistente = async (req, res, next) => {
    if (req.usuario.rol !== 'asistente') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de asistente'
        });
    }
    next();
};

const isGerenteOrOrganizador = async (req, res, next) => {
    if (req.usuario.rol !== 'gerente' && req.usuario.rol !== 'organizador') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de gerente u organizador'
        });
    }
    next();
};

const isGerenteOrAdmin = async (req, res, next) => {
    if (req.usuario.rol !== 'administrador' && req.usuario.rol !== 'gerente') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de administrador o gerente'
        });
    }
    next();
};

// NUEVO: Middleware para Admin, Gerente u Organizador
const isAdminGerenteOrOrganizador = async (req, res, next) => {
    const rolesPermitidos = ['administrador', 'gerente', 'organizador'];
    if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de administrador, gerente u organizador'
        });
    }
    next();
};

// AsistenteAdministrador
const isAsistenteAdministrador = async (req, res, next) => {
    const rolesPermitidos = ['asistente', 'administrador'];
    if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de asistente o administrador'
        });
    }
    next();
};

const isOrganizadorOGerente = async (req, res, next) => {
    const rolesPermitidos = ['organizador', 'gerente'];
    if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de organizador o gerente'
        });
    }
    next();
};

const isAdminGerenteOrganizadorOrPonente = async (req, res, next) => {
    const rolesPermitidos = ['administrador', 'gerente', 'organizador', 'ponente'];
    if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de administrador, gerente, organizador o ponente'
        });
    }
    next();
};

module.exports = {
    auth,
    isAdministrador,
    isGerente,
    isOrganizador,
    isPonente,
    isAsistente,
    isGerenteOrOrganizador,
    isGerenteOrAdmin,
    isAdminGerenteOrOrganizador,
    isAsistenteAdministrador,
    isOrganizadorOGerente,
    isAdminGerenteOrganizadorOrPonente
};
