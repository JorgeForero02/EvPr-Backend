const jwt = require('jsonwebtoken');
const UsuarioService = require('./usuario.service');
const { MENSAJES_AUTH } = require('../constants/auth.constants');

class TokenService {
    generarAccessToken(payload) {
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '24h'
        });
    }

    generarRefreshToken(payload) {
        return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
            expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
        });
    }

    generarTokens(payload) {
        return {
            accessToken: this.generarAccessToken(payload),
            refreshToken: this.generarRefreshToken(payload)
        };
    }

    verificarToken(token, esRefreshToken = false) {
        const secret = esRefreshToken ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;

        try {
            return jwt.verify(token, secret);
        } catch (error) {
            return null;
        }
    }

    async refrescarToken(refreshToken) {
        const decoded = this.verificarToken(refreshToken, true);

        if (!decoded) {
            return {
                exito: false,
                mensaje: MENSAJES_AUTH.REFRESH_TOKEN_INVALIDO
            };
        }

        const { rol, rolData } = await UsuarioService.buscarRolUsuario(decoded.id);

        const nuevoPayload = {
            id: decoded.id,
            correo: decoded.correo,
            nombre: decoded.nombre,
            rol,
            rolData
        };

        return {
            exito: true,
            accessToken: this.generarAccessToken(nuevoPayload)
        };
    }
}

module.exports = new TokenService();
