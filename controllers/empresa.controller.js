const EmpresaService = require('../services/empresa.service');
const EmpresaValidator = require('../validators/empresa.validator');
const PermisosService = require('../services/permisos.service');
const EmailService = require('../services/emailService');
const AuditoriaService = require('../services/auditoriaService');
const ApiResponse = require('../utils/response');
const NotificacionService = require('../services/notificacion.service');
const { MENSAJES, ESTADOS } = require('../constants/empresa.constants');

class EmpresaController {
  async getAll(req, res, next) {
    try {
      const { rol, rolData } = req.usuario;
      const { incluir_pendientes } = req.query;

      const empresas = await EmpresaService.obtenerPorRol(rol, rolData, incluir_pendientes);

      return ApiResponse.success(res, empresas, MENSAJES.LISTA_OBTENIDA);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const { rol, rolData } = req.usuario;

      const empresa = await EmpresaService.buscarPorId(id);

      if (!empresa) {
        return ApiResponse.notFound(res, MENSAJES.NO_ENCONTRADA);
      }

      const tienePermiso = PermisosService.verificarAccesoEmpresa(rol, rolData?.id_empresa, id);

      if (!tienePermiso) {
        return ApiResponse.forbidden(res, MENSAJES.SIN_PERMISO_VER);
      }

      return ApiResponse.success(res, empresa, MENSAJES.OBTENIDA);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { rol, id: usuarioId, nombre, correo } = req.usuario;

      const validacion = EmpresaValidator.validarCreacion(req.body, rol);

      if (!validacion.esValida) {
        return ApiResponse.error(res, validacion.mensaje, 400);
      }

      const resultado = await EmpresaService.crear(req.body, rol, usuarioId);

      await AuditoriaService.registrarCreacion('empresa', {
        id: resultado.empresa.id,
        nombre: resultado.empresa.nombre,
        nit: resultado.empresa.nit,
        estado: resultado.empresa.estado
      }, req.usuario);

      if (rol === 'asistente') {
                const usuarioCreador = { id: usuarioId, nombre: nombre, correo: correo };

                await EmailService.enviarEmpresaRegistrada(
                    usuarioCreador.correo,
                    usuarioCreador.nombre,
                    resultado.empresa.nombre,
                    resultado.empresa.nit
                );

                await NotificacionService.crearNotificacionEmpresaPendiente(
                    resultado.empresa,
                    usuarioCreador
                );
            }

      return ApiResponse.success(res, resultado.empresa, resultado.mensaje, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { rol, rolData } = req.usuario;

      const validacionPermiso = PermisosService.verificarPermisoActualizarEmpresa(rol, rolData, id);

      if (!validacionPermiso.tienePermiso) {
        return ApiResponse.forbidden(res, validacionPermiso.mensaje);
      }

      const resultado = await EmpresaService.actualizar(id, req.body);

      if (!resultado.exito) {
        return ApiResponse.notFound(res, resultado.mensaje);
      }

      await AuditoriaService.registrarActualizacion(
        'empresa',
        id,
        resultado.datosAnteriores,
        resultado.datosNuevos,
        req.usuario
      );

      return ApiResponse.success(res, resultado.empresa, MENSAJES.ACTUALIZADA);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const { rol } = req.usuario;

      if (rol !== 'administrador') {
        return ApiResponse.forbidden(res, MENSAJES.SOLO_ADMIN_ELIMINAR);
      }

      const resultado = await EmpresaService.eliminar(id);

      if (!resultado.exito) {
        return ApiResponse.notFound(res, resultado.mensaje);
      }

      await AuditoriaService.registrarEliminacion('empresa', id, req.usuario);

      return ApiResponse.success(res, null, MENSAJES.ELIMINADA);
    } catch (error) {
      next(error);
    }
  }

  async getEquipo(req, res, next) {
    try {
      const { id } = req.params;
      const { rol, rolData } = req.usuario;

      const empresa = await EmpresaService.buscarPorId(id);

      if (!empresa) {
        return ApiResponse.notFound(res, MENSAJES.NO_ENCONTRADA);
      }

      const tienePermiso = PermisosService.verificarAccesoEmpresa(rol, rolData?.id_empresa, id);

      if (!tienePermiso) {
        return ApiResponse.forbidden(res, MENSAJES.SIN_PERMISO_EQUIPO);
      }

      const equipo = await EmpresaService.obtenerEquipo(id);

      return ApiResponse.success(res, equipo, MENSAJES.EQUIPO_OBTENIDO);
    } catch (error) {
      next(error);
    }
  }

  async getPendientes(req, res, next) {
    try {
      const empresasPendientes = await EmpresaService.obtenerPendientes();

      return ApiResponse.success(res, empresasPendientes, MENSAJES.PENDIENTES_OBTENIDAS);
    } catch (error) {
      next(error);
    }
  }

  async getAprobadas(req, res, next) {
    try {
      const empresasAprobadas = await EmpresaService.obtenerAprobadas();

      return ApiResponse.success(res, empresasAprobadas, MENSAJES.LISTA_OBTENIDA);
    } catch (error) {
      next(error);
    }
  }

  async getRechazadas(req, res, next) {
    try {
      const empresasRechazadas = await EmpresaService.obtenerRechazadas();

      return ApiResponse.success(res, empresasRechazadas, MENSAJES.LISTA_OBTENIDA);
    } catch (error) {
      next(error);
    }
  }

  async aprobarEmpresa(req, res, next) {
    try {
      const { id } = req.params;
      const { aprobar, motivo } = req.body;

      const resultado = await EmpresaService.procesarAprobacion(id, aprobar, motivo);

      if (!resultado.exito) {
        return ApiResponse.error(res, resultado.mensaje, resultado.codigoEstado || 400);
      }

      await AuditoriaService.registrar({
        mensaje: `Empresa ${resultado.empresa.nombre} ${aprobar ? 'aprobada' : 'rechazada'}${!aprobar && motivo ? `. Motivo: ${motivo}` : ''}`,
        tipo: 'UPDATE',
        accion: aprobar ? 'aprobar_empresa' : 'rechazar_empresa',
        usuario: req.usuario
      });

      if (resultado.creador) {
        if (aprobar) {
          await EmailService.enviarEmpresaAprobada(
            resultado.creador.correo,
            resultado.creador.nombre,
            resultado.empresa.nombre
          );
        } else {
          await EmailService.enviarEmpresaRechazada(
            resultado.creador.correo,
            resultado.creador.nombre,
            resultado.empresa.nombre,
            motivo || 'No se especificó motivo'
          );
        }
          await NotificacionService.crearNotificacionRespuestaEmpresa(
            resultado.creador,
            resultado.empresa,
            aprobar,
            motivo
          );
      }

      return ApiResponse.success(res, resultado.empresa, resultado.mensaje);
    } catch (error) {
      next(error);
    }
  }

  async reporteDesempenho(req, res, next) {
    try {
      const { empresaId } = req.params;
      const { fechaInicio, fechaFin, estado } = req.query;

      const filtros = {};
      if (fechaInicio) filtros.fechaInicio = fechaInicio;
      if (fechaFin) filtros.fechaFin = fechaFin;
      if (estado !== undefined) filtros.estado = parseInt(estado);

      const resultado = await EmpresaService.reporteDesempenho(parseInt(empresaId), filtros);

      if (!resultado.exito) {
        return ApiResponse.error(res, resultado.mensaje, resultado.codigoEstado || 400);
      }

      return ApiResponse.success(res, resultado.reporte, 'Reporte de desempeño obtenido');
    } catch (error) {
      next(error);
    }
  }

  async exportarReporteDesempenhoCSV(req, res, next) {
    try {
      const { empresaId } = req.params;
      const { fechaInicio, fechaFin, estado } = req.query;

      const filtros = {};
      if (fechaInicio) filtros.fechaInicio = fechaInicio;
      if (fechaFin) filtros.fechaFin = fechaFin;
      if (estado !== undefined) filtros.estado = parseInt(estado);

      const resultado = await EmpresaService.reporteDesempenho(parseInt(empresaId), filtros);

      if (!resultado.exito) {
        return res.status(resultado.codigoEstado || 400).json({ success: false, message: resultado.mensaje });
      }

      const r = resultado.reporte;
      const escapar = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

      const filas = [
        ['Empresa', 'NIT', 'Total Eventos', 'Programados', 'Activos', 'Finalizados', 'Cancelados',
          'Total Actividades', 'Total Inscripciones', 'Confirmadas', 'Asistencias', 'Tasa Asistencia (%)',
          'Encuestas Enviadas', 'Encuestas Completadas', 'Tasa Respuesta (%)',
          'Total Ingresos', 'Total Gastos', 'Balance'].join(','),
        [
          escapar(r.empresa.nombre), escapar(r.empresa.nit),
          r.total_eventos,
          r.eventos_por_estado.programados, r.eventos_por_estado.activos,
          r.eventos_por_estado.finalizados, r.eventos_por_estado.cancelados,
          r.total_actividades,
          r.inscripciones.total, r.inscripciones.confirmadas, r.inscripciones.asistencias, r.inscripciones.tasa_asistencia,
          r.encuestas.total_enviadas, r.encuestas.total_completadas, r.encuestas.tasa_respuesta,
          r.presupuesto.total_ingresos, r.presupuesto.total_gastos, r.presupuesto.balance
        ].join(','),
        '',
        ['ID Evento', 'Título', 'Estado', 'Modalidad', 'Fecha Inicio', 'Fecha Fin', 'Cupos'].join(','),
        ...r.eventos.map(e => [
          e.id, escapar(e.titulo), e.estado, escapar(e.modalidad ?? ''),
          escapar(e.fecha_inicio ?? ''), escapar(e.fecha_fin ?? ''), e.cupos
        ].join(','))
      ];

      const nombreEmpresa = r.empresa.nombre?.replace(/[^a-zA-Z0-9]/g, '_') ?? 'empresa';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_desempenho_${nombreEmpresa}.csv"`);
      return res.send('\uFEFF' + filas.join('\n'));
    } catch (error) {
      console.error('Error al exportar reporte de desempeño CSV:', error);
      next(error);
    }
  }

  async estadisticasOcupacion(req, res, next) {
    try {
      const { empresaId } = req.params;
      const resultado = await EmpresaService.obtenerEstadisticasOcupacion(parseInt(empresaId));
      if (!resultado.exito) {
        return ApiResponse.error(res, resultado.mensaje, resultado.codigoEstado || 400);
      }
      return ApiResponse.success(res, resultado.data, 'Estadísticas de ocupación obtenidas');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmpresaController();