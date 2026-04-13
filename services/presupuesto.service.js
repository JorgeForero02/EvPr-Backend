const { PresupuestoItem, Evento, Actividad } = require('../models');
const { Op } = require('sequelize');

class PresupuestoService {
    async crear({ id_evento, id_actividad, concepto, monto, tipo, descripcion }) {
        const evento = await Evento.findByPk(id_evento);
        if (!evento) {
            return { exito: false, mensaje: 'Evento no encontrado', codigoEstado: 404 };
        }

        if (id_actividad) {
            const actividad = await Actividad.findByPk(id_actividad);
            if (!actividad || actividad.id_evento !== id_evento) {
                return { exito: false, mensaje: 'Actividad no encontrada o no pertenece a este evento', codigoEstado: 400 };
            }
        }

        const item = await PresupuestoItem.create({
            id_evento,
            id_actividad: id_actividad || null,
            concepto: concepto.trim(),
            monto: parseFloat(monto),
            tipo,
            descripcion: descripcion || null,
            fecha_registro: new Date()
        });

        return { exito: true, item };
    }

    async obtenerPorEvento(id_evento) {
        const items = await PresupuestoItem.findAll({
            where: { id_evento },
            include: [
                { model: Actividad, as: 'actividad', attributes: ['id_actividad', 'titulo'], required: false }
            ],
            order: [['fecha_registro', 'DESC']]
        });

        const total_ingresos = items
            .filter(i => i.tipo === 'ingreso')
            .reduce((acc, i) => acc + parseFloat(i.monto), 0);

        const total_gastos = items
            .filter(i => i.tipo === 'gasto')
            .reduce((acc, i) => acc + parseFloat(i.monto), 0);

        return {
            items,
            resumen: {
                total_ingresos: total_ingresos.toFixed(2),
                total_gastos: total_gastos.toFixed(2),
                balance: (total_ingresos - total_gastos).toFixed(2)
            }
        };
    }

    async buscarPorId(id) {
        return await PresupuestoItem.findByPk(id, {
            include: [
                { model: Evento, as: 'evento', attributes: ['id', 'titulo'] },
                { model: Actividad, as: 'actividad', attributes: ['id_actividad', 'titulo'], required: false }
            ]
        });
    }

    async actualizar(id, { concepto, monto, tipo, descripcion, id_actividad }) {
        const item = await PresupuestoItem.findByPk(id);
        if (!item) {
            return { exito: false, mensaje: 'Ítem de presupuesto no encontrado', codigoEstado: 404 };
        }

        if (id_actividad !== undefined) {
            if (id_actividad !== null) {
                const actividad = await Actividad.findByPk(id_actividad);
                if (!actividad || actividad.id_evento !== item.id_evento) {
                    return { exito: false, mensaje: 'Actividad no válida para este evento', codigoEstado: 400 };
                }
            }
        }

        const actualizaciones = {};
        if (concepto !== undefined) actualizaciones.concepto = concepto.trim();
        if (monto !== undefined) actualizaciones.monto = parseFloat(monto);
        if (tipo !== undefined) actualizaciones.tipo = tipo;
        if (descripcion !== undefined) actualizaciones.descripcion = descripcion;
        if (id_actividad !== undefined) actualizaciones.id_actividad = id_actividad;

        await item.update(actualizaciones);
        return { exito: true, item };
    }

    async eliminar(id) {
        const item = await PresupuestoItem.findByPk(id);
        if (!item) {
            return { exito: false, mensaje: 'Ítem de presupuesto no encontrado', codigoEstado: 404 };
        }

        await item.destroy();
        return { exito: true };
    }
}

module.exports = new PresupuestoService();
