const { Lugar, Ubicacion, Empresa, LugarActividad, Actividad, Evento } = require('../models');
const { Op } = require('sequelize');
const { MENSAJES } = require('../constants/lugar.constants');

class LugarService {
    crearTransaccion() {
        return Lugar.sequelize.transaction();
    }

    async crear(datosLugar, transaction) {
        const [empresa, ubicacion] = await Promise.all([
            Empresa.findByPk(datosLugar.id_empresa),
            Ubicacion.findOne({
                where: {
                    id: datosLugar.id_ubicacion,
                    id_empresa: datosLugar.id_empresa
                }
            })
        ]);

        // [BACKEND-FIX] B14: Validar existencia de FK antes de crear
        if (!empresa) {
            throw new Error('La empresa especificada no existe');
        }
        if (!ubicacion) {
            throw new Error('La ubicación especificada no existe o no pertenece a esta empresa');
        }

        const lugar = await Lugar.create(datosLugar, { transaction });
        return {
            lugar,
            empresa,
            ubicacion
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

        const lugares = await Lugar.findAll({
            where: { id_empresa: empresaId, activo: 1 },
            include: [{
                model: Ubicacion,
                as: 'ubicacion',
                attributes: ['id', 'direccion', 'lugar']
            }],
            order: [['nombre', 'ASC']]
        });

        return {
            exito: true,
            lugares
        };
    }

    async buscarPorId(lugarId, transaction = null) {
        return await Lugar.findByPk(lugarId, {
            include: [
                {
                    model: Ubicacion,
                    as: 'ubicacion',
                    attributes: ['id', 'direccion', 'lugar', 'id_empresa']
                },
                {
                    model: Empresa,
                    as: 'empresa',
                    attributes: ['id', 'nombre']
                }
            ],
            ...(transaction && { transaction })
        });
    }

    construirActualizaciones({ nombre, descripcion, capacidad }) {
        const actualizaciones = {};
        if (nombre !== undefined) actualizaciones.nombre = nombre;
        if (descripcion !== undefined) actualizaciones.descripcion = descripcion;
        if (capacidad !== undefined) actualizaciones.capacidad = capacidad;
        return actualizaciones;
    }

    async toggleEstado(lugarId, transaction) {
        const lugar = await Lugar.findByPk(lugarId, { transaction });
        if (!lugar) return { exito: false, mensaje: MENSAJES.NO_ENCONTRADO, codigoEstado: 404 };

        // Si se va a deshabilitar, verificar que no tenga actividades en eventos futuros activos
        if (lugar.activo === 1) {
            const hoy = new Date().toISOString().split('T')[0];
            const actividadFutura = await LugarActividad.findOne({
                where: { id_lugar: lugarId },
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
                const todasBloqueantes = await LugarActividad.findAll({
                    where: { id_lugar: lugarId },
                    include: [{
                        model: Actividad,
                        as: 'actividad',
                        required: true,
                        where: { fecha_actividad: { [Op.gte]: hoy } },
                        attributes: ['id_actividad', 'titulo', 'fecha_actividad', 'hora_inicio', 'hora_fin'],
                        include: [{
                            model: Evento,
                            as: 'evento',
                            required: true,
                            where: { estado: { [Op.in]: [0, 1] } },
                            attributes: ['id', 'titulo', 'fecha_inicio', 'fecha_fin']
                        }]
                    }],
                    transaction
                });

                const eventosBloqueantes = [...new Map(
                    todasBloqueantes
                        .filter(la => la.actividad?.evento)
                        .map(la => [la.actividad.evento.id, {
                            id: la.actividad.evento.id,
                            titulo: la.actividad.evento.titulo,
                            fecha_inicio: la.actividad.evento.fecha_inicio,
                            fecha_fin: la.actividad.evento.fecha_fin
                        }])
                ).values()];

                return { exito: false, mensaje: MENSAJES.TIENE_ACTIVIDADES_FUTURAS, codigoEstado: 409, eventosBloqueantes };
            }
        }

        const nuevoEstado = lugar.activo === 1 ? 0 : 1;
        await lugar.update({ activo: nuevoEstado }, { transaction });
        return { exito: true, lugar, habilitado: nuevoEstado === 1 };
    }

    async verificarActividadesAsociadas(lugarId, transaction) {
        const lugarEnActividades = await LugarActividad.findOne({
            where: { id_lugar: lugarId },
            transaction
        });
        return !!lugarEnActividades;
    }
}

module.exports = new LugarService();
