const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const {
    Inscripcion,
    Asistente,
    Evento,
    Empresa,
    Usuario,
    Lugar,
    Actividad,
    AdministradorEmpresa,
    Administrador,
    Ponente,
    sequelize
} = require('../models');
const { MENSAJES, ESTADOS } = require('../constants/inscripcion.constants');
const NotificacionService = require('./notificacion.service');

class InscripcionService {
    crearTransaccion() {
        return sequelize.transaction();
    }

    _obtenerFechaHoy() {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return formatter.format(new Date());
    }

    async obtenerEventosDisponibles({ modalidad, empresa, palabras_clave, fecha_inicio, fecha_fin } = {}) {
        const whereClause = { estado: 1 };
        if (modalidad) whereClause.modalidad = modalidad;
        if (empresa) whereClause.id_empresa = empresa;
        if (palabras_clave) {
            whereClause[Op.or] = [
                { titulo: { [Op.like]: `%${palabras_clave}%` } },
                { descripcion: { [Op.like]: `%${palabras_clave}%` } }
            ];
        }
        if (fecha_inicio) whereClause.fecha_inicio = { [Op.gte]: fecha_inicio };

        const fechaFinConditions = { [Op.gte]: this._obtenerFechaHoy() };
        if (fecha_fin) fechaFinConditions[Op.lte] = fecha_fin;
        whereClause.fecha_fin = fechaFinConditions;

        const eventos = await Evento.findAll({
            where: whereClause,
            attributes: [
                'id', 'titulo', 'descripcion', 'modalidad', 'hora', 'cupos',
                'fecha_inicio', 'fecha_fin',
                [
                    sequelize.literal('(SELECT COUNT(*) FROM Inscripcion WHERE Inscripcion.id_evento = Evento.id)'),
                    'inscritos'
                ]
            ],
            include: [
                {
                    model: Empresa,
                    as: 'empresa',
                    attributes: ['id', 'nombre']
                },
                {
                    model: Actividad,
                    as: 'actividades',
                    attributes: ['id_actividad'],
                    limit: 1,
                    include: [{
                        model: Lugar,
                        as: 'lugares',
                        attributes: ['nombre'],
                        through: { attributes: [] }
                    }]
                }
            ],
            order: [['fecha_inicio', 'ASC']]
        });

        return this._formatearEventosDisponibles(eventos);
    }

    async inscribir(eventoId, usuarioId, transaction) {
        const asistente = await this._encontrarOCrearAsistente(usuarioId, transaction);

        const evento = await Evento.findByPk(eventoId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!evento) {
            return {
                exito: false,
                mensaje: MENSAJES.EVENTO_NO_ENCONTRADO,
                codigoEstado: 404
            };
        }

        if (evento.estado !== 1) {
            return {
                exito: false,
                mensaje: MENSAJES.EVENTO_NO_DISPONIBLE,
                codigoEstado: 400
            };
        }

        const fechaHoy = this._obtenerFechaHoy();
        if (fechaHoy > evento.fecha_fin) {
            return {
                exito: false,
                mensaje: MENSAJES.EVENTO_FINALIZADO,
                codigoEstado: 400
            };
        }

        const inscripcionExistente = await Inscripcion.findOne({
            where: { id_asistente: asistente.id_asistente, id_evento: eventoId },
            transaction
        });

        if (inscripcionExistente) {
            return {
                exito: false,
                mensaje: MENSAJES.YA_INSCRITO,
                codigoEstado: 409
            };
        }

        const hayCupos = await this._verificarCuposDisponibles(eventoId, 1, transaction);

        if (!hayCupos) {
            return {
                exito: false,
                mensaje: MENSAJES.EVENTO_LLENO,
                codigoEstado: 400
            };
        }

        const inscripcion = await Inscripcion.create({
            fecha: this._obtenerFechaHoy(),
            codigo: uuidv4(),
            estado: ESTADOS.CONFIRMADA,
            id_asistente: asistente.id_asistente,
            id_evento: eventoId
        }, { transaction });

        return {
            exito: true,
            inscripcion,
            evento
        };
    }

    async obtenerPorUsuario(usuarioId) {
        const asistente = await Asistente.findOne({
            where: { id_usuario: usuarioId }
        });

        if (!asistente) {
            return [];
        }

        return await Inscripcion.findAll({
            where: { id_asistente: asistente.id_asistente },
            include: [{
                model: Evento,
                as: 'evento',
                attributes: ['id', 'titulo', 'fecha_inicio', 'fecha_fin', 'modalidad', 'hora']
            }],
            order: [['fecha', 'DESC']]
        });
    }

    async obtenerInscritosPorEvento(eventoId) {
        const evento = await Evento.findByPk(eventoId);
        if (!evento) {
            return { exito: false, mensaje: 'Evento no encontrado', codigoEstado: 404 };
        }

        const inscripciones = await Inscripcion.findAll({
            where: { id_evento: eventoId },
            include: [{
                model: Asistente,
                as: 'asistente',
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'correo', 'cedula', 'telefono']
                }]
            }],
            order: [['fecha', 'DESC']]
        });

        return { exito: true, evento, inscripciones };
    }

    async inscribirEquipo(eventoId, cedulas, gerente, transaction) {
        const cedulasString = cedulas.map(c => String(c));

        const evento = await Evento.findByPk(eventoId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!evento) {
            return {
                exito: false,
                mensaje: MENSAJES.EVENTO_NO_ENCONTRADO,
                codigoEstado: 404
            };
        }

        if (evento.estado !== 1) {
            return {
                exito: false,
                mensaje: MENSAJES.EVENTO_NO_DISPONIBLE,
                codigoEstado: 400
            };
        }

        const fechaHoy = this._obtenerFechaHoy();
        if (fechaHoy > evento.fecha_fin) {
            return {
                exito: false,
                mensaje: MENSAJES.EVENTO_FINALIZADO,
                codigoEstado: 400
            };
        }

        if (evento.id_empresa !== gerente.rolData.id_empresa) {
            return {
                exito: false,
                mensaje: MENSAJES.SOLO_EVENTOS_PROPIA_EMPRESA,
                codigoEstado: 403
            };
        }

        const usuarios = await this._obtenerUsuariosPorCedulas(cedulasString, transaction);
        const usuariosValidos = await this._filtrarUsuariosValidos(
            usuarios,
            cedulasString,
            gerente.rolData.id_empresa,
            transaction
        );

        const hayCupos = await this._verificarCuposDisponibles(
            eventoId,
            usuariosValidos.usuariosParaInscribir.length,
            transaction
        );

        if (!hayCupos) {
            const inscritosCount = await Inscripcion.count({ where: { id_evento: eventoId }, transaction });
            const cuposDisponibles = evento.cupos - inscritosCount;

            return {
                exito: false,
                mensaje: `No hay suficientes cupos. Disponibles: ${cuposDisponibles}, Intentando inscribir: ${usuariosValidos.usuariosParaInscribir.length}`,
                codigoEstado: 400
            };
        }

        const resultados = await this._procesarInscripcionesEquipo(
            usuariosValidos.usuariosParaInscribir,
            eventoId,
            evento,
            gerente,
            transaction
        );

        return {
            exito: true,
            resultados: {
                exitosas: resultados.exitosas,
                fallidas: [...usuariosValidos.fallidas, ...resultados.fallidas]
            }
        };
    }

    async confirmarPorCodigo(codigo, transaction) {
        const inscripcion = await Inscripcion.findOne({
            where: { codigo },
            include: {
                model: Evento,
                as: 'evento'
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!inscripcion) {
            return {
                exito: false,
                mensaje: MENSAJES.ENLACE_INVALIDO,
                codigoEstado: 404
            };
        }

        if (inscripcion.estado === ESTADOS.CONFIRMADA) {
            return {
                exito: false,
                mensaje: MENSAJES.YA_CONFIRMADA,
                codigoEstado: 400
            };
        }

        if (inscripcion.estado !== ESTADOS.PENDIENTE) {
            return {
                exito: false,
                mensaje: `Esta inscripción no se puede confirmar (Estado: ${inscripcion.estado}).`,
                codigoEstado: 400
            };
        }

        const fechaHoy = this._obtenerFechaHoy();
        if (fechaHoy > inscripcion.evento.fecha_fin) {
            return {
                exito: false,
                mensaje: MENSAJES.EVENTO_FINALIZADO,
                codigoEstado: 400
            };
        }

        const hayCupos = await this._verificarCuposConfirmados(
            inscripcion.evento.id,
            inscripcion.evento.cupos,
            transaction
        );

        if (!hayCupos) {
            return {
                exito: false,
                mensaje: MENSAJES.CUPO_ALCANZADO_CONFIRMACION,
                codigoEstado: 400
            };
        }

        await inscripcion.update({ estado: ESTADOS.CONFIRMADA }, { transaction });

        return {
            exito: true,
            evento: inscripcion.evento
        };
    }

    async cancelar(inscripcionId, usuarioId, transaction) {
        const inscripcion = await Inscripcion.findByPk(inscripcionId, {
            include: [{ model: Evento, as: 'evento' }],
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!inscripcion) {
            return { exito: false, mensaje: MENSAJES.INSCRIPCION_NO_ENCONTRADA, codigoEstado: 404 };
        }

        // Verificar que la inscripción pertenece al usuario autenticado
        const asistente = await Asistente.findOne({ where: { id_usuario: usuarioId }, transaction });
        if (!asistente || inscripcion.id_asistente !== asistente.id_asistente) {
            return { exito: false, mensaje: MENSAJES.SIN_PERMISO_CANCELAR, codigoEstado: 403 };
        }

        if (inscripcion.estado !== ESTADOS.CONFIRMADA) {
            return { exito: false, mensaje: MENSAJES.ESTADO_NO_CANCELABLE, codigoEstado: 400 };
        }

        const fechaHoy = this._obtenerFechaHoy();
        const fechaLimite = inscripcion.evento.fecha_limite_cancelacion;
        if (fechaLimite) {
            if (fechaHoy > fechaLimite) {
                return { exito: false, mensaje: MENSAJES.PLAZO_CANCELACION_VENCIDO, codigoEstado: 400 };
            }
        } else if (fechaHoy >= inscripcion.evento.fecha_inicio) {
            return { exito: false, mensaje: MENSAJES.EVENTO_YA_INICIO, codigoEstado: 400 };
        }

        await inscripcion.update({ estado: ESTADOS.CANCELADA }, { transaction });

        try {
            const usuarioAsistente = await Usuario.findByPk(usuarioId, { attributes: ['nombre'] });
            const nombreAsistente = usuarioAsistente?.nombre ?? 'Desconocido';
            await NotificacionService.crearNotificacionCancelacionInscripcion(
                { inscripcion, evento: inscripcion.evento, nombreAsistente },
                transaction
            );
        } catch (notifError) {
            console.error('Error al notificar cancelación de inscripción:', notifError);
        }

        return { exito: true, inscripcion, evento: inscripcion.evento };
    }

    async _encontrarOCrearAsistente(usuarioId, transaction) {
        let asistente = await Asistente.findOne({
            where: { id_usuario: usuarioId },
            transaction
        });

        if (!asistente) {
            asistente = await Asistente.create(
                { id_usuario: usuarioId },
                { transaction }
            );
        }

        return asistente;
    }

    async _verificarCuposDisponibles(eventoId, cantidadRequerida, transaction) {
        const evento = await Evento.findByPk(eventoId, { transaction });

        if (evento.cupos === null) return true;

        // [BACKEND-FIX] B7: Solo contar inscripciones Confirmadas para cupo (excluir Pendiente/Cancelada)
        const inscritosCount = await Inscripcion.count({
            where: { id_evento: eventoId, estado: ESTADOS.CONFIRMADA },
            transaction
        });

        return (evento.cupos - inscritosCount) >= cantidadRequerida;
    }

    async _verificarCuposConfirmados(eventoId, cuposEvento, transaction) {
        if (cuposEvento === null) return true;

        const inscritosConfirmados = await Inscripcion.count({
            where: { id_evento: eventoId, estado: ESTADOS.CONFIRMADA },
            transaction
        });

        return inscritosConfirmados < cuposEvento;
    }

    async _obtenerUsuariosPorCedulas(cedulas, transaction) {
        return await Usuario.findAll({
            where: { cedula: { [Op.in]: cedulas } },
            attributes: ['id', 'correo', 'nombre', 'cedula'],
            transaction
        });
    }

    async _filtrarUsuariosValidos(usuarios, cedulas, empresaIdGerente, transaction) {
        const mapUsuarios = new Map(usuarios.map(u => [u.cedula, u]));
        const idsUsuarios = usuarios.map(u => u.id);

        const [admins, adminEmpresas, ponentes] = await Promise.all([
            Administrador.findAll({
                where: { id_usuario: { [Op.in]: idsUsuarios } },
                attributes: ['id_usuario'],
                transaction
            }),
            AdministradorEmpresa.findAll({
                where: { id_usuario: { [Op.in]: idsUsuarios } },
                attributes: ['id_usuario', 'id_empresa'],
                transaction
            }),
            Ponente.findAll({
                where: { id_usuario: { [Op.in]: idsUsuarios } },
                attributes: ['id_usuario'],
                transaction
            })
        ]);

        const mapAdmins = new Set(admins.map(u => u.id_usuario));
        const mapPonentes = new Set(ponentes.map(u => u.id_usuario));
        const mapAdminEmpresas = new Map(adminEmpresas.map(u => [u.id_usuario, u.id_empresa]));

        const usuariosParaInscribir = [];
        const fallidas = [];

        for (const cedula of cedulas) {
            const usuario = mapUsuarios.get(cedula);

            if (!usuario) {
                fallidas.push({ cedula, motivo: 'Cédula no encontrada' });
                continue;
            }

            if (mapAdmins.has(usuario.id) || mapPonentes.has(usuario.id)) {
                fallidas.push({
                    cedula: usuario.cedula,
                    nombre: usuario.nombre,
                    motivo: 'No se puede invitar a un Administrador o Ponente externo.'
                });
                continue;
            }

            const idEmpresaDelUsuario = mapAdminEmpresas.get(usuario.id);

            if (idEmpresaDelUsuario && idEmpresaDelUsuario !== empresaIdGerente) {
                fallidas.push({
                    cedula: usuario.cedula,
                    nombre: usuario.nombre,
                    motivo: 'Este usuario pertenece a otra empresa.'
                });
                continue;
            }

            usuariosParaInscribir.push(usuario);
        }

        return { usuariosParaInscribir, fallidas };
    }

    async _procesarInscripcionesEquipo(usuarios, eventoId, evento, gerente, transaction) {
        const exitosas = [];
        const fallidas = [];

        for (const usuario of usuarios) {
            const asistente = await this._encontrarOCrearAsistente(usuario.id, transaction);

            const inscripcionExistente = await Inscripcion.findOne({
                where: {
                    id_asistente: asistente.id_asistente,
                    id_evento: eventoId
                },
                transaction
            });

            if (inscripcionExistente) {
                fallidas.push({
                    cedula: usuario.cedula,
                    nombre: usuario.nombre,
                    motivo: 'Ya está inscrito'
                });
                continue;
            }

            const inscripcion = await Inscripcion.create({
                fecha: this._obtenerFechaHoy(),
                codigo: uuidv4(),
                estado: ESTADOS.PENDIENTE,
                id_asistente: asistente.id_asistente,
                id_evento: eventoId
            }, { transaction });

            try {
                await EmailService.enviarInvitacionInscripcion(
                    usuario.correo,
                    usuario.nombre,
                    gerente.nombre,
                    evento.titulo,
                    inscripcion.codigo
                );

                exitosas.push({
                    cedula: usuario.cedula,
                    nombre: usuario.nombre,
                    estado: 'Invitación enviada'
                });
            } catch (emailError) {
                console.error('Error enviando email:', emailError);
                fallidas.push({
                    cedula: usuario.cedula,
                    nombre: usuario.nombre,
                    motivo: 'Inscrito, pero falló el envío de email'
                });
            }
        }

        return { exitosas, fallidas };
    }

    _formatearEventosDisponibles(eventos) {
        return eventos.map(evento => {
            const data = evento.toJSON();
            const cuposDisponibles = data.cupos - data.inscritos;
            const estadoEvento = cuposDisponibles <= 0 ? 'Lleno' : 'Disponible';
            const lugarNombre = data.actividades?.[0]?.lugares?.[0]?.nombre || null;

            return {
                id: data.id,
                titulo: data.titulo,
                descripcion: data.descripcion,
                modalidad: data.modalidad,
                hora: data.hora,
                fecha_inicio: data.fecha_inicio,
                fecha_fin: data.fecha_fin,
                lugar: lugarNombre,
                cupo_total: data.cupos,
                cupos_disponibles: cuposDisponibles,
                estado_evento: estadoEvento,
                empresa: data.empresa.nombre
            };
        });
    }
}

module.exports = new InscripcionService();
