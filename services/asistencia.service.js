const crypto = require('crypto');
const { Asistencia, Inscripcion, Evento, Asistente, Usuario, Actividad, Lugar } = require('../models');
const sequelize = require('../config/database');

class AsistenciaService {
    crearTransaccion() {
        return sequelize.transaction();
    }

    obtenerFechaHoy() {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return formatter.format(new Date());
    }

    async buscarInscripcionPorId(id, transaction) {
        return await Inscripcion.findByPk(id, {
            include: [
                {
                    model: Evento,
                    as: 'evento',
                    attributes: ['id', 'titulo', 'estado', 'fecha_inicio', 'fecha_fin']
                },
                {
                    model: Asistente,
                    as: 'asistente',
                    attributes: ['id_asistente', 'id_usuario']
                }
            ],
            transaction
        });
    }

    async buscarInscripcionPorCodigo(codigo, transaction) {
        return await Inscripcion.findOne({
            where: { codigo },
            include: [
                {
                    model: Evento,
                    as: 'evento',
                    attributes: ['id', 'titulo', 'estado', 'fecha_inicio', 'fecha_fin', 'id_creador', 'id_empresa']
                },
                {
                    model: Asistente,
                    as: 'asistente',
                    attributes: ['id_asistente', 'id_usuario']
                }
            ],
            transaction
        });
    }

    async buscarEventoPorId(eventoId) {
        return await Evento.findByPk(eventoId, {
            attributes: ['id', 'titulo', 'id_creador', 'id_empresa']
        });
    }

    async buscarAsistentePorUsuario(usuarioId) {
        return await Asistente.findOne({
            where: { id_usuario: usuarioId }
        });
    }

    async verificarAsistenciaExistente(inscripcionId, fecha, transaction) {
        const asistencia = await Asistencia.findOne({
            where: {
                inscripcion: inscripcionId,
                fecha
            },
            transaction
        });
        return !!asistencia;
    }

    async crear(datosAsistencia, transaction) {
        return await Asistencia.create(datosAsistencia, { transaction });
    }

    async obtenerInscripcionesConAsistencias(asistenteId) {
        const inscripciones = await Inscripcion.findAll({
            where: { id_asistente: asistenteId },
            attributes: ['id', 'id_evento', 'codigo', 'estado'],
            include: [
                {
                    model: Evento,
                    as: 'evento',
                    attributes: ['id', 'titulo', 'fecha_inicio', 'fecha_fin', 'modalidad', 'hora', 'lugar_id'],
                    include: [
                        {
                            model: Actividad,
                            as: 'actividades',
                            attributes: ['id_actividad', 'titulo', 'descripcion', 'hora_inicio', 'hora_fin', 'fecha_actividad']
                        },
                        {
                            model: Lugar,
                            as: 'lugar',
                            attributes: ['id', 'nombre'],
                            required: false
                        }
                    ]
                },
                {
                    model: Asistencia,
                    as: 'asistencias',
                    required: false,
                    attributes: ['id', 'fecha', 'estado']
                }
            ],
            order: [['id', 'DESC']]
        });

        // Ordenar asistencias de cada inscripción por fecha descendente manualmente
        // para evitar duplicación de filas con LEFT JOIN + ORDER en Sequelize
        inscripciones.forEach((inscripcion) => {
            if (inscripcion.asistencias && inscripcion.asistencias.length > 1) {
                inscripcion.asistencias.sort((a, b) => {
                    if (!a.fecha || !b.fecha) return 0;
                    return String(b.fecha).localeCompare(String(a.fecha));
                });
            }
        });

        return inscripciones;
    }

    // Devuelve el registro manual del organizador para esta inscripción, si existe
    async buscarAsistenciaManual(inscripcionId, transaction) {
        return await Asistencia.findOne({
            where: { inscripcion: inscripcionId, estado_manual: true },
            transaction
        });
    }

    // Inscripción con el evento incluido (campos mínimos para validar permisos)
    async buscarInscripcionConEvento(inscripcionId, transaction) {
        return await Inscripcion.findByPk(inscripcionId, {
            include: [{
                model: Evento,
                as: 'evento',
                attributes: ['id', 'titulo', 'estado', 'id_creador', 'id_empresa']
            }],
            transaction
        });
    }

    // Crea o sobrescribe la asistencia con marca de registro manual del organizador.
    // Prioridad:
    //   1. Si ya existe un registro con estado_manual=true → actualiza estado y fecha
    //   2. Si existe un registro sin marca manual para hoy → convierte a manual
    //   3. Si no existe ninguno → crea uno nuevo
    async crearOSobrescribirManual(inscripcionId, estado, fechaHoy, transaction) {
        let asistencia = await Asistencia.findOne({
            where: { inscripcion: inscripcionId, estado_manual: true },
            transaction
        });

        if (asistencia) {
            await asistencia.update(
                { estado, fecha: fechaHoy, registrado_por: 'organizador' },
                { transaction }
            );
            return asistencia;
        }

        asistencia = await Asistencia.findOne({
            where: { inscripcion: inscripcionId, fecha: fechaHoy },
            transaction
        });

        if (asistencia) {
            await asistencia.update(
                { estado, registrado_por: 'organizador', estado_manual: true },
                { transaction }
            );
            return asistencia;
        }

        return await Asistencia.create({
            inscripcion: inscripcionId,
            fecha: fechaHoy,
            estado,
            registrado_por: 'organizador',
            estado_manual: true
        }, { transaction });
    }

    generarCodigoCheckin(eventoId, fecha) {
        return crypto
            .createHash('sha256')
            .update(`checkin-${eventoId}-${fecha}`)
            .digest('hex')
            .slice(0, 6)
            .toUpperCase();
    }

    async buscarInscripcionConfirmadaPorAsistenteYEvento(asistenteId, eventoId, transaction) {
        return await Inscripcion.findOne({
            where: { id_asistente: asistenteId, id_evento: eventoId, estado: 'Confirmada' },
            include: [{
                model: Evento,
                as: 'evento',
                attributes: ['id', 'titulo', 'estado', 'fecha_inicio', 'fecha_fin']
            }],
            transaction
        });
    }

    async obtenerAsistenciasPorEvento(eventoId, fecha = null) {
        const whereAsistencia = {};
        if (fecha) {
            whereAsistencia.fecha = fecha;
        }

        const inscripciones = await Inscripcion.findAll({
            where: { id_evento: eventoId },
            include: [
                {
                    model: Asistente,
                    as: 'asistente',
                    include: [{
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['id', 'nombre', 'correo', 'cedula']
                    }]
                },
                {
                    model: Asistencia,
                    as: 'asistencias',
                    where: whereAsistencia,
                    required: false,
                    attributes: ['id', 'fecha', 'estado']
                }
            ]
        });

        // Ordenar asistencias de cada inscripción por fecha descendente manualmente
        // para evitar problemas de SQL con LEFT JOIN + ORDER en Sequelize
        const aStringFecha = (val) => {
            if (!val) return '';
            if (typeof val === 'string') return val;
            try {
                return new Date(val).toISOString().split('T')[0];
            } catch {
                return String(val);
            }
        };

        inscripciones.forEach((inscripcion) => {
            if (inscripcion.asistencias && inscripcion.asistencias.length > 1) {
                inscripcion.asistencias.sort((a, b) => {
                    const fa = aStringFecha(a.fecha);
                    const fb = aStringFecha(b.fecha);
                    if (!fa || !fb) return 0;
                    return fb.localeCompare(fa);
                });
            }
        });

        return inscripciones;
    }
}

module.exports = new AsistenciaService();
