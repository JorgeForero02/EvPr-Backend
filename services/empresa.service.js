const { Empresa, Usuario, AdministradorEmpresa, Asistente, Pais, Ciudad, Evento, Actividad, Inscripcion, Asistencia, PresupuestoItem, Encuesta, RespuestaEncuesta, sequelize } = require('../models');
const { Op } = require('sequelize');
const { MENSAJES, ESTADOS, ROLES } = require('../constants/empresa.constants');

class EmpresaService {
    async obtenerPorRol(rol, rolData, incluirPendientes) {
        const whereClause = this._construirWhereClause(rol, incluirPendientes);

        if (rol === 'administrador') {
            return await Empresa.findAll({
                where: whereClause,
                order: [['id', 'ASC']]
            });
        }

        if (rol === 'gerente' || rol === 'organizador') {
            return await Empresa.findAll({
                where: {
                    id: rolData.id_empresa,
                    ...whereClause
                },
                order: [['id', 'ASC']]
            });
        }

        return [];
    }

    async buscarPorId(id) {
        return await Empresa.findByPk(id);
    }

    async crear(datos, rol, usuarioId) {
        const estado = rol === 'asistente' ? ESTADOS.PENDIENTE : ESTADOS.ACTIVO;

        // [BACKEND-FIX] B3: Whitelist de campos para prevenir mass-assignment
        const camposPermitidos = ['nit', 'nombre', 'direccion', 'telefono', 'correo', 'id_pais', 'id_ciudad'];
        const datosFiltrados = {};
        camposPermitidos.forEach(campo => {
            if (datos[campo] !== undefined) {
                datosFiltrados[campo] = datos[campo];
            }
        });

        const empresaData = {
            ...datosFiltrados,
            estado,
            ...(rol === 'asistente' && { id_creador: usuarioId })
        };

        // [BACKEND-FIX] B11: Validar existencia de FK y unicidad de NIT antes de crear
        if (datosFiltrados.id_pais) {
            const pais = await Pais.findByPk(datosFiltrados.id_pais);
            if (!pais) {
                throw new Error('El país especificado no existe');
            }
        }
        if (datosFiltrados.id_ciudad) {
            const ciudad = await Ciudad.findByPk(datosFiltrados.id_ciudad);
            if (!ciudad) {
                throw new Error('La ciudad especificada no existe');
            }
        }
        if (datosFiltrados.nit) {
            const empresaExistente = await Empresa.findOne({ where: { nit: datosFiltrados.nit } });
            if (empresaExistente) {
                throw new Error('Ya existe una empresa registrada con este NIT');
            }
        }

        const empresa = await Empresa.create(empresaData);

        let usuario = null;
        if (rol === 'asistente') {
            usuario = await Usuario.findByPk(usuarioId);
        }

        const mensaje = rol === 'asistente'
            ? MENSAJES.CREADA_PENDIENTE
            : MENSAJES.CREADA;

        return { empresa, usuario, mensaje };
    }

    async actualizar(id, datos) {
        const empresa = await this.buscarPorId(id);

        if (!empresa) {
            return {
                exito: false,
                mensaje: MENSAJES.NO_ENCONTRADA
            };
        }

        // [BACKEND-FIX] B3: Whitelist de campos para prevenir mass-assignment
        const camposPermitidos = ['nit', 'nombre', 'direccion', 'telefono', 'correo', 'id_pais', 'id_ciudad'];
        const datosFiltrados = {};
        camposPermitidos.forEach(campo => {
            if (datos[campo] !== undefined) {
                datosFiltrados[campo] = datos[campo];
            }
        });

        const datosAnteriores = { ...empresa.toJSON() };
        await empresa.update(datosFiltrados);

        return {
            exito: true,
            empresa,
            datosAnteriores,
            datosNuevos: empresa.toJSON()
        };
    }

    async eliminar(id) {
        const empresa = await this.buscarPorId(id);

        if (!empresa) {
            return {
                exito: false,
                mensaje: MENSAJES.NO_ENCONTRADA
            };
        }

        await empresa.destroy();

        return { exito: true };
    }

    async obtenerEquipo(empresaId) {
        const equipo = await AdministradorEmpresa.findAll({
            where: { id_empresa: empresaId },
            include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'nombre', 'cedula', 'telefono', 'correo']
            }],
            order: [['es_Gerente', 'DESC'], ['id', 'ASC']]
        });

        return equipo.map(miembro => ({
            id: miembro.id,
            usuario: miembro.usuario,
            rol: miembro.es_Gerente === ROLES.GERENTE ? 'gerente' : 'organizador'
        }));
    }

    async obtenerPendientes() {
        return await Empresa.findAll({
            where: { estado: ESTADOS.PENDIENTE },
            include: [{
                model: Usuario,
                as: 'creador',
                attributes: ['id', 'nombre', 'correo', 'telefono']
            }],
            order: [['id', 'DESC']]
        });
    }

    async obtenerAprobadas() {
        return await Empresa.findAll({
            where: { estado: ESTADOS.ACTIVO },
            order: [['id', 'DESC']]
        });
    }

    async obtenerRechazadas() {
        return await Empresa.findAll({
            where: { estado: ESTADOS.RECHAZADO },
            order: [['id', 'DESC']]
        });
    }

    async procesarAprobacion(id, aprobar, motivo) {
        const empresa = await Empresa.findByPk(id);

        if (!empresa) {
            return {
                exito: false,
                mensaje: MENSAJES.NO_ENCONTRADA,
                codigoEstado: 404
            };
        }

        if (empresa.estado !== ESTADOS.PENDIENTE) {
            return {
                exito: false,
                mensaje: MENSAJES.YA_PROCESADA,
                codigoEstado: 400
            };
        }

        // [BACKEND-FIX] B12: Coerción booleana explícita para evitar que "false" (string) sea truthy
        const aprobado = aprobar === true || aprobar === 'true';
        const nuevoEstado = aprobado ? ESTADOS.ACTIVO : ESTADOS.RECHAZADO;

        let creador = null;

        await sequelize.transaction(async (t) => {
            await empresa.update({ estado: nuevoEstado }, { transaction: t });

            if (empresa.id_creador) {
                creador = await Usuario.findByPk(empresa.id_creador, { transaction: t });
            }

            // Ascender al asistente a gerente cuando la empresa es aprobada
            if (aprobado && empresa.id_creador) {
                // Eliminar la fila de Asistente
                await Asistente.destroy({
                    where: { id_usuario: empresa.id_creador },
                    transaction: t
                });

                // Registrar como gerente de la empresa recién aprobada
                await AdministradorEmpresa.create({
                    id_usuario: empresa.id_creador,
                    id_empresa: empresa.id,
                    es_Gerente: ROLES.GERENTE
                }, { transaction: t });
            }
        });

        const mensaje = aprobado ? MENSAJES.APROBADA : MENSAJES.RECHAZADA;

        return {
            exito: true,
            empresa,
            creador,
            mensaje
        };
    }

    async reporteDesempenho(empresaId, filtros = {}) {
        const empresa = await Empresa.findByPk(empresaId);
        if (!empresa) {
            return { exito: false, mensaje: 'Empresa no encontrada', codigoEstado: 404 };
        }

        const whereEvento = { id_empresa: empresaId };
        if (filtros.fechaInicio) whereEvento.fecha_inicio = { [Op.gte]: filtros.fechaInicio };
        if (filtros.fechaFin) whereEvento.fecha_fin = { [Op.lte]: filtros.fechaFin };
        if (filtros.estado !== undefined) whereEvento.estado = filtros.estado;

        const eventos = await Evento.findAll({
            where: whereEvento,
            attributes: ['id', 'titulo', 'estado', 'modalidad', 'fecha_inicio', 'fecha_fin', 'cupos'],
            order: [['fecha_inicio', 'DESC']]
        });

        const eventoIds = eventos.map(e => e.id);

        const [
            totalInscripciones,
            totalConfirmadas,
            totalAsistencias,
            totalEncuestasEnviadas,
            totalEncuestasCompletadas,
            totalActividades
        ] = eventoIds.length > 0 ? await Promise.all([
            Inscripcion.count({ where: { id_evento: { [Op.in]: eventoIds } } }),
            Inscripcion.count({ where: { id_evento: { [Op.in]: eventoIds }, estado: 'Confirmada' } }),
            Asistencia.count({
                include: [{ model: Inscripcion, as: 'inscripcionInfo', required: true, where: { id_evento: { [Op.in]: eventoIds } } }]
            }),
            RespuestaEncuesta.count({
                include: [{ model: Encuesta, as: 'encuesta', required: true, where: { id_evento: { [Op.in]: eventoIds } } }]
            }),
            RespuestaEncuesta.count({
                where: { estado: 'completada' },
                include: [{ model: Encuesta, as: 'encuesta', required: true, where: { id_evento: { [Op.in]: eventoIds } } }]
            }),
            Actividad.count({ where: { id_evento: { [Op.in]: eventoIds } } })
        ]) : [0, 0, 0, 0, 0, 0];

        const presupuestoItems = eventoIds.length > 0
            ? await PresupuestoItem.findAll({ where: { id_evento: { [Op.in]: eventoIds } } })
            : [];

        const totalIngresos = presupuestoItems
            .filter(i => i.tipo === 'ingreso')
            .reduce((acc, i) => acc + parseFloat(i.monto), 0);
        const totalGastos = presupuestoItems
            .filter(i => i.tipo === 'gasto')
            .reduce((acc, i) => acc + parseFloat(i.monto), 0);

        return {
            exito: true,
            reporte: {
                empresa: { id: empresa.id, nombre: empresa.nombre, nit: empresa.nit },
                total_eventos: eventos.length,
                eventos_por_estado: {
                    programados: eventos.filter(e => e.estado === 0).length,
                    activos: eventos.filter(e => e.estado === 1).length,
                    finalizados: eventos.filter(e => e.estado === 2).length,
                    cancelados: eventos.filter(e => e.estado === 3).length
                },
                total_actividades: totalActividades,
                inscripciones: {
                    total: totalInscripciones,
                    confirmadas: totalConfirmadas,
                    asistencias: totalAsistencias,
                    tasa_asistencia: totalConfirmadas > 0
                        ? Math.round((totalAsistencias / totalConfirmadas) * 100)
                        : 0
                },
                encuestas: {
                    total_enviadas: totalEncuestasEnviadas,
                    total_completadas: totalEncuestasCompletadas,
                    tasa_respuesta: totalEncuestasEnviadas > 0
                        ? Math.round((totalEncuestasCompletadas / totalEncuestasEnviadas) * 100)
                        : 0
                },
                presupuesto: {
                    total_ingresos: totalIngresos.toFixed(2),
                    total_gastos: totalGastos.toFixed(2),
                    balance: (totalIngresos - totalGastos).toFixed(2)
                },
                eventos
            }
        };
    }

    async obtenerEstadisticasOcupacion(empresaId) {
        const { Lugar, LugarActividad, Actividad, Inscripcion } = require('../models');

        const empresa = await Empresa.findByPk(empresaId);
        if (!empresa) {
            return { exito: false, mensaje: 'Empresa no encontrada', codigoEstado: 404 };
        }

        const lugares = await Lugar.findAll({
            where: { id_empresa: empresaId },
            attributes: ['id', 'nombre', 'capacidad']
        });

        const resultado = [];

        for (const lugar of lugares) {
            const asignaciones = await LugarActividad.findAll({
                where: { id_lugar: lugar.id },
                include: [{
                    model: Actividad,
                    as: 'actividad',
                    attributes: ['id_actividad', 'id_evento']
                }]
            });

            const eventoIds = [...new Set(asignaciones
                .filter(a => a.actividad)
                .map(a => a.actividad.id_evento))];

            let ocupacionesEvento = [];
            for (const eventoId of eventoIds) {
                const inscritos = await Inscripcion.count({
                    where: { id_evento: eventoId, estado: 'Confirmada' }
                });
                if (lugar.capacidad && lugar.capacidad > 0) {
                    ocupacionesEvento.push(Math.min(100, Math.round((inscritos / lugar.capacidad) * 100)));
                }
            }

            const ocupacionPromedio = ocupacionesEvento.length > 0
                ? Math.round(ocupacionesEvento.reduce((a, b) => a + b, 0) / ocupacionesEvento.length)
                : 0;

            resultado.push({
                id: lugar.id,
                nombre: lugar.nombre,
                capacidad: lugar.capacidad,
                eventos_realizados: eventoIds.length,
                ocupacion_promedio: ocupacionPromedio
            });
        }

        const ocupacionGlobal = resultado.length > 0
            ? Math.round(resultado.reduce((a, b) => a + b.ocupacion_promedio, 0) / resultado.length)
            : 0;

        return {
            exito: true,
            data: {
                empresa: { id: empresa.id, nombre: empresa.nombre },
                ocupacion_global_promedio: ocupacionGlobal,
                salas: resultado
            }
        };
    }

    _construirWhereClause(rol, incluirPendientes) {
        if (rol === 'administrador') {
            return incluirPendientes === 'true' ? {} : { estado: ESTADOS.ACTIVO };
        }
        return { estado: ESTADOS.ACTIVO };
    }
}

module.exports = new EmpresaService();