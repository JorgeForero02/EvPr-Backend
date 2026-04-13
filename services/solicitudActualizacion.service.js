const { SolicitudActualizacionEmpresa, Empresa, Usuario } = require('../models');
const { Op } = require('sequelize');

class SolicitudActualizacionService {
    async crear({ id_empresa, id_solicitante, datos_propuestos, justificacion }) {
        if (!justificacion || justificacion.trim() === '') {
            return { exito: false, mensaje: 'La justificación es obligatoria', codigoEstado: 400 };
        }

        const empresa = await Empresa.findByPk(id_empresa);
        if (!empresa) {
            return { exito: false, mensaje: 'Empresa no encontrada', codigoEstado: 404 };
        }

        const solicitud = await SolicitudActualizacionEmpresa.create({
            id_empresa,
            id_solicitante,
            datos_propuestos,
            justificacion: justificacion.trim(),
            estado: 'pendiente',
            fecha_solicitud: new Date()
        });

        return { exito: true, solicitud };
    }

    async obtenerPorEmpresa(id_empresa) {
        return await SolicitudActualizacionEmpresa.findAll({
            where: { id_empresa },
            include: [
                { model: Usuario, as: 'solicitante', attributes: ['id', 'nombre', 'correo'] },
                { model: Usuario, as: 'adminDecision', attributes: ['id', 'nombre'] },
                { model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'nit', 'direccion', 'telefono', 'correo'] }
            ],
            order: [['fecha_solicitud', 'DESC']]
        });
    }

    async obtenerTodas(estado = null) {
        const where = {};
        if (estado) where.estado = estado;

        return await SolicitudActualizacionEmpresa.findAll({
            where,
            include: [
                { model: Usuario, as: 'solicitante', attributes: ['id', 'nombre', 'correo'] },
                { model: Usuario, as: 'adminDecision', attributes: ['id', 'nombre'] },
                { model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'nit', 'direccion', 'telefono', 'correo'] }
            ],
            order: [['fecha_solicitud', 'DESC']]
        });
    }

    async buscarPorId(id) {
        return await SolicitudActualizacionEmpresa.findByPk(id, {
            include: [
                { model: Usuario, as: 'solicitante', attributes: ['id', 'nombre', 'correo'] },
                { model: Usuario, as: 'adminDecision', attributes: ['id', 'nombre'] },
                { model: Empresa, as: 'empresa' }
            ]
        });
    }

    async procesar({ id, aprobar, motivo_rechazo, id_admin }) {
        const solicitud = await this.buscarPorId(id);

        if (!solicitud) {
            return { exito: false, mensaje: 'Solicitud no encontrada', codigoEstado: 404 };
        }

        if (solicitud.estado !== 'pendiente') {
            return { exito: false, mensaje: 'Esta solicitud ya fue procesada', codigoEstado: 400 };
        }

        if (!aprobar && (!motivo_rechazo || motivo_rechazo.trim() === '')) {
            return { exito: false, mensaje: 'El motivo de rechazo es obligatorio', codigoEstado: 400 };
        }

        const nuevoEstado = aprobar ? 'aprobada' : 'rechazada';

        await solicitud.update({
            estado: nuevoEstado,
            motivo_rechazo: aprobar ? null : motivo_rechazo.trim(),
            id_admin_decision: id_admin,
            fecha_decision: new Date()
        });

        if (aprobar) {
            const camposPermitidos = ['direccion', 'telefono', 'correo', 'nombre'];
            const actualizaciones = {};
            const propuestos = solicitud.datos_propuestos || {};
            camposPermitidos.forEach(campo => {
                if (propuestos[campo] !== undefined) {
                    actualizaciones[campo] = propuestos[campo];
                }
            });

            if (Object.keys(actualizaciones).length > 0) {
                await solicitud.empresa.update(actualizaciones);
            }
        }

        return { exito: true, solicitud };
    }
}

module.exports = new SolicitudActualizacionService();
