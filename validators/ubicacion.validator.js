const { Empresa, Ciudad } = require('../models');
const { MENSAJES_VALIDACION } = require('../constants/ubicacion.constants');

const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_EVENT_REGEX = /\bon\w+\s*=/gi;

function sanitizarTexto(texto) {
    if (!texto || typeof texto !== 'string') return texto;
    return texto
        .replace(HTML_TAG_REGEX, '')
        .replace(SCRIPT_EVENT_REGEX, '')
        .trim();
}

class UbicacionValidator {
    async validarCreacion({ direccion, id_ciudad, empresaId, descripcion, lugar }) {
        if (!direccion || direccion.trim().length < 3) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.DIRECCION_REQUERIDA
            };
        }

        if (!id_ciudad) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.CIUDAD_REQUERIDA
            };
        }

        const empresa = await Empresa.findByPk(empresaId);
        if (!empresa) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.EMPRESA_NO_ENCONTRADA,
                codigoEstado: 404
            };
        }

        const ciudad = await Ciudad.findByPk(id_ciudad);
        if (!ciudad) {
            return {
                esValida: false,
                mensaje: MENSAJES_VALIDACION.CIUDAD_NO_ENCONTRADA,
                codigoEstado: 404
            };
        }

        return {
            esValida: true,
            datosSanitizados: {
                direccion: sanitizarTexto(direccion),
                descripcion: sanitizarTexto(descripcion),
                lugar: sanitizarTexto(lugar)
            }
        };
    }

    validarActualizacion({ lugar, direccion, descripcion }) {
        const datosSanitizados = {};
        if (lugar !== undefined) datosSanitizados.lugar = sanitizarTexto(lugar);
        if (direccion !== undefined) datosSanitizados.direccion = sanitizarTexto(direccion);
        if (descripcion !== undefined) datosSanitizados.descripcion = sanitizarTexto(descripcion);
        return { esValida: true, datosSanitizados };
    }
}

module.exports = new UbicacionValidator();
