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

  async recomendarUbicaciones(req, res) {
    try {
      const { empresaId } = req.params;
      const { tipo } = req.query;
      const AnaliticaService = require('../services/analitica.service');
      const { sequelize } = require('../models');

      let filtroModalidad = '';
      const repl = { empresaId };
      if (tipo) {
        filtroModalidad = 'AND ev.modalidad = :tipo';
        repl.tipo = tipo;
      }

      const [rows] = await sequelize.query(`
        SELECT l.id AS id_lugar, l.nombre,
          COALESCE(SUM(insc.confirmadas),0) AS confirmadas,
          COALESCE(SUM(asist.asistencias),0) AS asistencias,
          COUNT(DISTINCT ev.id) AS muestra
        FROM Lugar l
        JOIN Lugar_Actividad la ON la.id_lugar = l.id
        JOIN Actividad act ON act.id_actividad = la.id_actividad
        JOIN Evento ev ON ev.id = act.id_evento AND ev.estado = 2 ${filtroModalidad}
        LEFT JOIN (SELECT id_evento, SUM(estado='Confirmada') confirmadas FROM Inscripcion GROUP BY id_evento) insc ON insc.id_evento = ev.id
        LEFT JOIN (SELECT i.id_evento, COUNT(a.id) asistencias FROM Inscripcion i JOIN Asistencia a ON a.inscripcion=i.id GROUP BY i.id_evento) asist ON asist.id_evento = ev.id
        WHERE l.id_empresa = :empresaId
        GROUP BY l.id, l.nombre
      `, { replacements: repl });

      const data = rows.map(r => {
        const conf = Number(r.confirmadas) || 0;
        const asis = Number(r.asistencias) || 0;
        const tasa = conf > 0 ? Math.round(asis / conf * 100) : null;
        return {
          id_lugar: r.id_lugar,
          nombre: r.nombre,
          muestra: Number(r.muestra) || 0,
          tasa_asistencia: tasa,
          nivel: AnaliticaService.clasificar(tasa)
        };
      }).sort((a, b) => (b.tasa_asistencia ?? -1) - (a.tasa_asistencia ?? -1));

      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al recomendar ubicaciones' });
    }
  }

  async recomendarFranjas(req, res) {
    try {
      const { empresaId } = req.params;
      const { tipo } = req.query;
      const AnaliticaService = require('../services/analitica.service');
      const { sequelize } = require('../models');

      let filtroModalidad = '';
      const repl = { empresaId };
      if (tipo) {
        filtroModalidad = 'AND ev.modalidad = :tipo';
        repl.tipo = tipo;
      }

      const [rows] = await sequelize.query(`
        SELECT CASE
            WHEN HOUR(COALESCE(ev.hora,'12:00:00')) BETWEEN 6 AND 11 THEN 'mañana'
            WHEN HOUR(COALESCE(ev.hora,'12:00:00')) BETWEEN 12 AND 17 THEN 'tarde'
            WHEN HOUR(COALESCE(ev.hora,'12:00:00')) BETWEEN 18 AND 23 THEN 'noche'
            ELSE 'madrugada' END AS franja,
          COALESCE(SUM(insc.confirmadas),0) AS confirmadas,
          COALESCE(SUM(asist.asistencias),0) AS asistencias,
          COUNT(DISTINCT ev.id) AS muestra
        FROM Evento ev
        LEFT JOIN (SELECT id_evento, SUM(estado='Confirmada') confirmadas FROM Inscripcion GROUP BY id_evento) insc ON insc.id_evento=ev.id
        LEFT JOIN (SELECT i.id_evento, COUNT(a.id) asistencias FROM Inscripcion i JOIN Asistencia a ON a.inscripcion=i.id GROUP BY i.id_evento) asist ON asist.id_evento=ev.id
        WHERE ev.id_empresa = :empresaId AND ev.estado = 2 ${filtroModalidad}
        GROUP BY franja
      `, { replacements: repl });

      const data = rows.map(r => {
        const conf = Number(r.confirmadas) || 0;
        const asis = Number(r.asistencias) || 0;
        const tasa = conf > 0 ? Math.round(asis / conf * 100) : null;
        return {
          franja: r.franja,
          muestra: Number(r.muestra) || 0,
          tasa_asistencia: tasa,
          nivel: AnaliticaService.clasificar(tasa)
        };
      }).sort((a, b) => (b.tasa_asistencia ?? -1) - (a.tasa_asistencia ?? -1));

      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al recomendar franjas' });
    }
  }
}

module.exports = new EmpresaController();