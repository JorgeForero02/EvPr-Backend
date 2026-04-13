const { Auditoria } = require('../models');
const { Op } = require('sequelize');

class AuditoriaService {
    static async registrar({ mensaje, tipo, accion, usuario = null, entidad = null, datosAnteriores = null, datosNuevos = null, ip = null }) {
        try {
            const ahora = new Date();

            const registroAuditoria = await Auditoria.create({
                fecha: ahora.toISOString().split('T')[0],
                hora: ahora.toTimeString().split(' ')[0],
                mensaje: usuario
                    ? `${mensaje} - Usuario: ${usuario.nombre} (ID: ${usuario.id})`
                    : mensaje,
                tipo: tipo,
                accion: accion,
                id_admin: usuario ? usuario.id : null,
                entidad_afectada: entidad,
                datos_anteriores: datosAnteriores,
                datos_nuevos: datosNuevos,
                ip_address: ip
            });

            return registroAuditoria;
        } catch (error) {
            console.error('Error al registrar auditoría:', error);
            return null;
        }
    }

    static async registrarLogin(usuario, rol) {
        return await this.registrar({
            mensaje: `Login exitoso como ${rol}`,
            tipo: 'POST',
            accion: 'login',
            usuario
        });
    }

    static async registrarLogout(usuario) {
        return await this.registrar({
            mensaje: 'Usuario cerró sesión',
            tipo: 'POST',
            accion: 'logout',
            usuario
        });
    }

    static async registrarCreacion(entidad, datos, usuario = null, ip = null) {
        return await this.registrar({
            mensaje: `Creación de ${entidad}: ${JSON.stringify(datos)}`,
            tipo: 'POST',
            accion: `crear_${entidad}`,
            usuario,
            entidad,
            datosNuevos: datos,
            ip
        });
    }

    static async registrarActualizacion(entidad, id, datosAnteriores, datosNuevos, usuario = null, ip = null) {
        const cambios = this.calcularCambios(datosAnteriores, datosNuevos);
        return await this.registrar({
            mensaje: `Actualización de ${entidad} ID ${id}. Cambios: ${JSON.stringify(cambios)}`,
            tipo: 'PUT',
            accion: `actualizar_${entidad}`,
            usuario,
            entidad,
            datosAnteriores,
            datosNuevos,
            ip
        });
    }

    static async registrarEliminacion(entidad, id, usuario = null, ip = null) {
        return await this.registrar({
            mensaje: `Eliminación de ${entidad} con ID ${id}`,
            tipo: 'DELETE',
            accion: `eliminar_${entidad}`,
            usuario,
            entidad,
            ip
        });
    }

    static async registrarConsulta(entidad, detalle, usuario = null) {
        return await this.registrar({
            mensaje: `Consulta de ${entidad}: ${detalle}`,
            tipo: 'GET',
            accion: `consultar_${entidad}`,
            usuario
        });
    }

    static calcularCambios(anterior, nuevo) {
        const cambios = {};
        const todasLasClaves = new Set([
            ...Object.keys(anterior || {}),
            ...Object.keys(nuevo || {})
        ]);

        todasLasClaves.forEach(clave => {
            if (anterior[clave] !== nuevo[clave]) {
                cambios[clave] = {
                    antes: anterior[clave],
                    despues: nuevo[clave]
                };
            }
        });

        return cambios;
    }

    static async obtenerRegistros(filtros = {}) {
        try {
            const where = {};

            if (filtros.tipo) where.tipo = filtros.tipo;
            if (filtros.accion) where.accion = filtros.accion;
            if (filtros.id_admin) where.id_admin = filtros.id_admin;
            if (filtros.entidad) where.entidad_afectada = filtros.entidad;

            if (filtros.fechaInicio && filtros.fechaFin) {
                where.fecha = { [Op.between]: [filtros.fechaInicio, filtros.fechaFin] };
            } else if (filtros.fechaInicio) {
                where.fecha = { [Op.gte]: filtros.fechaInicio };
            } else if (filtros.fechaFin) {
                where.fecha = { [Op.lte]: filtros.fechaFin };
            }

            const registros = await Auditoria.findAll({
                where,
                order: [['fecha', 'DESC'], ['hora', 'DESC']],
                limit: filtros.limite || 100
            });

            return registros;
        } catch (error) {
            console.error('Error al obtener registros de auditoría:', error);
            throw error;
        }
    }
}

module.exports = AuditoriaService;
