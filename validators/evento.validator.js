const { Empresa, Lugar, Evento } = require('../models');
const { MENSAJES_VALIDACION, ESTADOS, MODALIDADES } = require('../constants/evento.constants');
const { Op } = require('sequelize');
const ActividadService = require('../services/actividad.service');

class EventoValidator {

    async validarCreacion(datos, empresaId) {
        const { titulo, modalidad, fecha_inicio, fecha_fin } = datos;

        if (!titulo || titulo.trim().length < 3) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.TITULO_REQUERIDO
            };
        }

        if (!modalidad || !MODALIDADES.includes(modalidad)) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.MODALIDAD_INVALIDA
            };
        }

        if (!fecha_inicio) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.FECHA_INICIO_REQUERIDA
            };
        }

        if (!fecha_fin) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.FECHA_FIN_REQUERIDA
            };
        }

        if (new Date(fecha_inicio) > new Date(fecha_fin)) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.FECHAS_INVALIDAS
            };
        }

        const empresa = await Empresa.findByPk(empresaId);
        if (!empresa) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.EMPRESA_NO_ENCONTRADA
            };
        }

        if (datos.fecha_limite_cancelacion && fecha_inicio) {
            if (new Date(datos.fecha_limite_cancelacion) > new Date(fecha_inicio)) {
                return {
                    esValida: false,
                    mensaje: MENSAJES_VALIDACION.FECHA_LIMITE_CANCELACION_INVALIDA
                };
            }
        }

        return { esValida: true };
    }

    async validarDisponibilidadSala(lugarId, fechaInicio, fechaFin, eventoIdExcluir = null) {
        if (!lugarId) return null;

        const lugar = await Lugar.findByPk(lugarId, { attributes: ['id', 'nombre', 'activo'] });
        if (!lugar) {
            return { esValida: false, mensaje: 'La sala seleccionada no existe.' };
        }
        if (!lugar.activo) {
            return { esValida: false, mensaje: `La sala "${lugar.nombre}" está deshabilitada.` };
        }

        const where = {
            lugar_id: lugarId,
            estado: { [Op.notIn]: [2, 3] },
            fecha_inicio: { [Op.lte]: fechaFin },
            fecha_fin: { [Op.gte]: fechaInicio }
        };
        if (eventoIdExcluir) where.id = { [Op.ne]: eventoIdExcluir };

        const conflicto = await Evento.findOne({ where, attributes: ['id', 'titulo', 'fecha_inicio', 'fecha_fin'] });
        if (conflicto) {
            return {
                esValida: false,
                mensaje: `La sala ya está ocupada por el evento "${conflicto.titulo}" (${conflicto.fecha_inicio} – ${conflicto.fecha_fin}).`
            };
        }
        return null;
    }

    async validarCapacidadEvento(lugarId, cupos) {
        if (!lugarId || !cupos) return null;

        const lugar = await Lugar.findByPk(lugarId, { attributes: ['id', 'nombre', 'capacidad'] });
        if (lugar && lugar.capacidad !== null && cupos > lugar.capacidad) {
            return {
                esValida: false,
                mensaje: `Los cupos (${cupos}) superan la capacidad de la sala "${lugar.nombre}" (${lugar.capacidad}).`
            };
        }
        return null;
    }

    // [BACKEND-FIX] B13: Aceptar evento actual para cruzar fechas parciales
    validarActualizacion(datos, eventoActual = {}) {
        const { titulo, modalidad, fecha_inicio, fecha_fin, fecha_limite_cancelacion } = datos;

        if (titulo !== undefined && (!titulo || titulo.trim().length < 3)) {
            return MENSAJES_VALIDACION.TITULO_REQUERIDO;
        }

        if (modalidad !== undefined && !MODALIDADES.includes(modalidad)) {
            return MENSAJES_VALIDACION.MODALIDAD_INVALIDA;
        }

        // Usar fecha del request o la actual del evento para validación cruzada
        const fechaInicioEfectiva = fecha_inicio || eventoActual.fecha_inicio;
        const fechaFinEfectiva = fecha_fin || eventoActual.fecha_fin;

        if (fechaInicioEfectiva && fechaFinEfectiva &&
            new Date(fechaInicioEfectiva) > new Date(fechaFinEfectiva)) {
            return MENSAJES_VALIDACION.FECHAS_INVALIDAS;
        }

        // Al publicar el evento, fecha_limite_cancelacion es obligatoria
        const nuevoEstado = datos.estado !== undefined ? Number(datos.estado) : undefined;
        if (nuevoEstado === ESTADOS.PUBLICADO) {
            const limiteEfectivo = fecha_limite_cancelacion || eventoActual.fecha_limite_cancelacion;
            if (!limiteEfectivo) {
                return MENSAJES_VALIDACION.FECHA_LIMITE_CANCELACION_REQUERIDA;
            }
        }

        // Si se proporciona, validar que no supere la fecha de inicio del evento
        if (fecha_limite_cancelacion && fechaInicioEfectiva) {
            if (new Date(fecha_limite_cancelacion) > new Date(fechaInicioEfectiva)) {
                return MENSAJES_VALIDACION.FECHA_LIMITE_CANCELACION_INVALIDA;
            }
        }

        return null;
    }

    // [BACKEND-FIX] B5: Corregido ESTADOS.includes() → Object.values(ESTADOS).includes()
    validarEstado(estadoActual, nuevoEstado) {
        if (nuevoEstado !== undefined && !Object.values(ESTADOS).includes(nuevoEstado)) {
            return MENSAJES_VALIDACION.ESTADO_INVALIDO;
        }

        if (estadoActual === ESTADOS.CANCELADO) {
            return MENSAJES_VALIDACION.EVENTO_CANCELADO;
        }

        if (estadoActual === ESTADOS.FINALIZADO) {
            return MENSAJES_VALIDACION.EVENTO_FINALIZADO;
        }

        return null;
    }

    async validarAgenda(eventoId) {
        const actividades = await ActividadService.buscarTodasPorEvento(eventoId);

        if (!actividades || actividades.length === 0) {
            return { esValida: true };
        }

        const actividadesPorFecha = this._agruparPorFecha(actividades);

        for (const [fecha, actividadesFecha] of Object.entries(actividadesPorFecha)) {
            const conflicto = await this._verificarSolapamientosInternos(actividadesFecha);
            if (conflicto) {
                return {
                    esValida: false,
                    mensaje: 'No es posible guardar la agenda. Se detectaron actividades con horarios superpuestos.'
                };
            }
        }

        return { esValida: true };
    }

    _agruparPorFecha(actividades) {
        return actividades.reduce((grupos, actividad) => {
            const fecha = actividad.fecha_actividad;
            if (!grupos[fecha]) {
                grupos[fecha] = [];
            }
            grupos[fecha].push(actividad);
            return grupos;
        }, {});
    }

    async _verificarSolapamientosInternos(actividades) {
        for (let i = 0; i < actividades.length; i++) {
            for (let j = i + 1; j < actividades.length; j++) {
                const act1 = actividades[i];
                const act2 = actividades[j];

                const haySolapamiento = this._detectarSolapamientoHorario(
                    act1.hora_inicio,
                    act1.hora_fin,
                    act2.hora_inicio,
                    act2.hora_fin
                );

                if (haySolapamiento) {
                    const lugares1 = act1.lugares ? act1.lugares.map(l => l.id) : [];
                    const lugares2 = act2.lugares ? act2.lugares.map(l => l.id) : [];
                    const compartenSala = lugares1.some(id => lugares2.includes(id));

                    if (compartenSala) {
                        return true; 
                    }
                }
            }
        }
        return false; 
    }

    _detectarSolapamientoHorario(inicio1, fin1, inicio2, fin2) {
        return inicio1 < fin2 && fin1 > inicio2;
    }
}

module.exports = new EventoValidator();
