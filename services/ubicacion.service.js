const { Ubicacion, Ciudad, Empresa, Lugar, LugarActividad, Actividad, Evento } = require('../models');
const { Op } = require('sequelize');
const { MENSAJES } = require('../constants/ubicacion.constants');

class UbicacionService {
    crearTransaccion() {
        return Ubicacion.sequelize.transaction();
    }

    async crear(datosUbicacion, transaction) {
        const [empresa, ciudad] = await Promise.all([
            Empresa.findByPk(datosUbicacion.id_empresa),
            Ciudad.findByPk(datosUbicacion.id_ciudad)
        ]);

        // [BACKEND-FIX] B14: Validar existencia de FK antes de crear
        if (!empresa) {
            throw new Error('La empresa especificada no existe');
        }
        if (!ciudad) {
            throw new Error('La ciudad especificada no existe');
        }

        const ubicacion = await Ubicacion.create(datosUbicacion, { transaction });
        return {
            ubicacion,
            empresa,
            ciudad
        };
    }

    async obtenerPorEmpresa(empresaId) {
        const empresa = await Empresa.findByPk(empresaId);
        if (!empresa) {
            return {
                exito: false,
                mensaje: MENSAJES.EMPRESA_NO_ENCONTRADA
            };
        }

        const ubicaciones = await Ubicacion.findAll({
            where: { id_empresa: empresaId, activo: 1 },
            include: [{
                model: Ciudad,
                as: 'ciudad',
                attributes: ['id', 'nombre']
            }],
            order: [['direccion', 'ASC']]
        });

        return {
            exito: true,
            ubicaciones
        };
    }

    async buscarPorId(ubicacionId, transaction = null) {
        return await Ubicacion.findByPk(ubicacionId, {
            include: [
                { model: Ciudad, as: 'ciudad', attributes: ['id', 'nombre'] },
                { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] }
            ],
            ...(transaction && { transaction })
        });
    }

    async toggleEstado(ubicacionId, transaction) {
        const ubicacion = await Ubicacion.findByPk(ubicacionId, { transaction });
        if (!ubicacion) return { exito: false, mensaje: MENSAJES.NO_ENCONTRADA, codigoEstado: 404 };

        // Si se va a deshabilitar, verificar que no tenga salas con actividades en eventos futuros
        if (ubicacion.activo === 1) {
            const hoy = new Date().toISOString().split('T')[0];
            const lugares = await Lugar.findAll({ where: { id_ubicacion: ubicacionId }, attributes: ['id'], transaction });
            const lugarIds = lugares.map(l => l.id);

            if (lugarIds.length > 0) {
                const actividadFutura = await LugarActividad.findOne({
                    where: { id_lugar: { [Op.in]: lugarIds } },
                    include: [{
                        model: Actividad,
                        as: 'actividad',
                        required: true,
                        where: { fecha_actividad: { [Op.gte]: hoy } },
                        include: [{
                            model: Evento,
                            as: 'evento',
                            required: true,
                            where: { estado: { [Op.in]: [0, 1] } }
                        }]
                    }],
                    transaction
                });

                if (actividadFutura) {
                    return { exito: false, mensaje: MENSAJES.TIENE_EVENTOS_FUTUROS, codigoEstado: 400 };
                }
            }
        }

        const nuevoEstado = ubicacion.activo === 1 ? 0 : 1;
        await ubicacion.update({ activo: nuevoEstado }, { transaction });
        return { exito: true, ubicacion, habilitada: nuevoEstado === 1 };
    }

    async obtenerStats(empresaId) {
        const empresa = await Empresa.findByPk(empresaId);
        if (!empresa) return { exito: false, mensaje: MENSAJES.EMPRESA_NO_ENCONTRADA };

        const hoy = new Date().toISOString().split('T')[0];

        const ubicaciones = await Ubicacion.findAll({
            where: { id_empresa: empresaId },
            include: [{ model: Ciudad, as: 'ciudad', attributes: ['id', 'nombre'] }],
            order: [['direccion', 'ASC']]
        });

        const lugares = await Lugar.findAll({ where: { id_empresa: empresaId } });

        // Contar actividades por sala en una sola query
        const lugarIds = lugares.map(l => l.id);
        const asignaciones = lugarIds.length > 0
            ? await LugarActividad.findAll({ where: { id_lugar: { [Op.in]: lugarIds } } })
            : [];

        const actividadIds = [...new Set(asignaciones.map(a => a.id_actividad))];
        const actividadesProximas = actividadIds.length > 0
            ? await Actividad.findAll({
                where: { id_actividad: { [Op.in]: actividadIds }, fecha_actividad: { [Op.gte]: hoy } },
                include: [{ model: Evento, as: 'evento', required: true, where: { estado: { [Op.in]: [0, 1] } }, attributes: [] }],
                attributes: ['id_actividad']
            })
            : [];
        const actividadesProximasSet = new Set(actividadesProximas.map(a => a.id_actividad));

        const lugarMap = new Map();
        for (const l of lugares) {
            const asig = asignaciones.filter(a => a.id_lugar === l.id);
            lugarMap.set(l.id, {
                id: l.id,
                nombre: l.nombre,
                capacidad: l.capacidad,
                activo: l.activo,
                id_ubicacion: l.id_ubicacion,
                total_actividades_historicas: asig.length,
                actividades_proximas: asig.filter(a => actividadesProximasSet.has(a.id_actividad)).length
            });
        }

        const stats = ubicaciones.map(u => {
            const ub = u.toJSON();
            const salas = [...lugarMap.values()].filter(l => l.id_ubicacion === ub.id);
            return {
                id: ub.id,
                direccion: ub.direccion,
                lugar: ub.lugar,
                activo: ub.activo,
                ciudad: ub.ciudad,
                salas,
                total_salas: salas.length,
                salas_activas: salas.filter(s => s.activo === 1).length
            };
        });

        return { exito: true, stats };
    }

    construirActualizaciones({ lugar, direccion, descripcion }) {
        const actualizaciones = {};
        if (lugar !== undefined) actualizaciones.lugar = lugar;
        if (direccion !== undefined) actualizaciones.direccion = direccion;
        if (descripcion !== undefined) actualizaciones.descripcion = descripcion;
        return actualizaciones;
    }
}

module.exports = new UbicacionService();
