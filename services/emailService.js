const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const EmailService = {
    enviarBienvenida: async (destinatario, nombre, rol) => {
        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: '¡Bienvenido a la plataforma!',
                html: `
                    <h2>Hola ${nombre},</h2>
                    <p>Te has registrado exitosamente en nuestra plataforma como <strong>${rol}</strong>.</p>
                    <p>Ya puedes iniciar sesión con tu correo: <strong>${destinatario}</strong></p>
                    <br>
                    <p>¡Gracias por unirte!</p>
                `
            });
            console.log('Correo de bienvenida enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de bienvenida:', error);
        }
    },

    enviarPromocionGerente: async (destinatario, nombre, nombreEmpresa) => {
        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: '¡Felicidades! Has sido promovido a Gerente',
                html: `
                    <h2>Felicidades ${nombre},</h2>
                    <p>Has sido promovido a <strong>Gerente</strong> de <strong>${nombreEmpresa}</strong>.</p>
                    <p>Ahora tienes permisos adicionales para:</p>
                    <ul>
                      <li>Crear organizadores para tu empresa</li>
                      <li>Gestionar eventos de tu empresa</li>
                      <li>Administrar el equipo de trabajo</li>
                    </ul>
                    <p>Inicia sesión para empezar a usar tus nuevos permisos.</p>
                `
            });
            console.log('Correo de promoción enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de promoción:', error);
        }
    },

    enviarCreacionOrganizador: async (destinatario, nombre, nombreEmpresa, contraseñaTemporal) => {
        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: 'Tu cuenta de Organizador ha sido creada',
                html: `
                    <h2>Hola ${nombre},</h2>
                    <p>Se ha creado una cuenta de <strong>Organizador</strong> para ti en <strong>${nombreEmpresa}</strong>.</p>
                    <p><strong>Credenciales de acceso:</strong></p>
                    <ul>
                      <li>Correo: ${destinatario}</li>
                      <li>Contraseña temporal: <code>${contraseñaTemporal}</code></li>
                    </ul>
                    <p><strong>⚠️ IMPORTANTE:</strong> Por seguridad, cambia tu contraseña en tu primer inicio de sesión.</p>
                    <p><a href="${process.env.FRONTEND_URL}/login">Iniciar sesión ahora</a></p>
                `
            });
            console.log('Correo de creación de organizador enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo:', error);
        }
    },

    enviarEmpresaRegistrada: async (destinatario, nombreUsuario, nombreEmpresa, nit) => {
        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: 'Empresa registrada - Pendiente de aprobación',
                html: `
                    <h2>Hola ${nombreUsuario},</h2>
                    <p>Has registrado exitosamente la empresa <strong>${nombreEmpresa}</strong> (NIT: ${nit}) en nuestra plataforma.</p>
                    <p><strong>Estado actual:</strong> Pendiente de aprobación por el administrador.</p>
                    <p>Recibirás un correo de confirmación una vez que tu empresa sea aprobada.</p>
                    <br>
                    <p>Esto puede tomar entre 24-48 horas hábiles.</p>
                    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                `
            });
            console.log('Correo de empresa registrada enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de empresa registrada:', error);
        }
    },

    enviarEmpresaAprobada: async (destinatario, nombreUsuario, nombreEmpresa) => {
        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: '¡Felicidades! Tu empresa ha sido aprobada',
                html: `
                    <h2>¡Excelentes noticias, ${nombreUsuario}!</h2>
                    <p>Tu empresa <strong>${nombreEmpresa}</strong> ha sido <strong>aprobada</strong> por nuestro equipo de administración.</p>
                    <p><strong>¿Qué sigue?</strong></p>
                    <ul>
                      <li>Tu empresa ahora está activa en la plataforma</li>
                      <li>Pronto serás contactado para ser asignado como gerente de la empresa</li>
                      <li>Podrás crear organizadores y gestionar eventos para tu empresa</li>
                    </ul>
                    <p><a href="${process.env.FRONTEND_URL}/empresas">Ver mi empresa</a></p>
                    <br>
                    <p>¡Bienvenido a nuestra comunidad empresarial!</p>
                `
            });
            console.log('Correo de empresa aprobada enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de empresa aprobada:', error);
        }
    },

    enviarEmpresaRechazada: async (destinatario, nombreUsuario, nombreEmpresa, motivo) => {
        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: 'Empresa no aprobada - Información adicional requerida',
                html: `
                    <h2>Hola ${nombreUsuario},</h2>
                    <p>Lamentamos informarte que tu empresa <strong>${nombreEmpresa}</strong> no ha sido aprobada.</p>
                    <p><strong>Motivo:</strong></p>
                    <p>${motivo}</p>
                    <br>
                    <p>Si deseas apelar esta decisión o proporcionar información adicional, por favor contacta a nuestro equipo de soporte.</p>
                    <p>Estamos aquí para ayudarte.</p>
                `
            });
            console.log('Correo de empresa rechazada enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de empresa rechazada:', error);
        }
    },

    enviarNotificacionCancelacion: async (
        destinatario,
        nombreUsuario,
        nombreEvento,
        correoCreador
    ) => {
        const infoContacto = correoCreador
            ? `<p>Si tienes alguna consulta, por favor, ponte en contacto con el creador del evento a través de su correo:</p>
               <p><strong><a href="mailto:${correoCreador}">${correoCreador}</a></strong></p>`
            : `<p>Si tienes alguna consulta, por favor, ponte en contacto con el organizador del evento.</p>`;

        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: `Notificación: El evento "${nombreEvento}" ha sido cancelado`,
                html: `
                    <h2>Hola ${nombreUsuario},</h2>
                    <p>Lamentamos informarte que el evento:</p>
                    <h3 style="color: #dc3545;">${nombreEvento}</h3>
                    <p>al cual estabas inscrito, ha sido <strong>cancelado</strong>.</p>
                    <br>
                    ${infoContacto}
                    <p>Atentamente,<br>El equipo de Event Planner</p>
                `
            });
            console.log('Correo de cancelación (asistente) enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de cancelación (asistente):', error);
        }
    },

    enviarConfirmacionCancelacionCreador: async (
        destinatario,
        nombreUsuario,
        nombreEvento
    ) => {
        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: `Confirmación: Cancelación del evento "${nombreEvento}"`,
                html: `
                    <h2>Hola ${nombreUsuario},</h2>
                    <p>Te confirmamos que el evento:</p>
                    <h3 style="color: #dc3545;">${nombreEvento}</h3>
                    <p>del cual eres el creador, ha sido <strong>cancelado exitosamente</strong> en la plataforma.</p>
                    <br>
                    <p>Se ha notificado a los usuarios inscritos.</p>
                    <p>Atentamente,<br>El equipo de Event Planner</p>
                `
            });
            console.log('Correo de confirmación de cancelación (creador) enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de confirmación (creador):', error);
        }
    },

    enviarConfirmacionInscripcion: async (
        destinatario,
        nombreUsuario,
        nombreEvento,
        fechaEvento,
        codigoInscripcion
    ) => {
        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: `¡Confirmación de inscripción: ${nombreEvento}!`,
                html: `
                    <h2>¡Hola ${nombreUsuario}!</h2>
                    <p>Has completado exitosamente tu inscripción para el evento:</p>
                    <h3 style="color: #007bff;">${nombreEvento}</h3>
                    
                    <p><strong>Detalles del Evento:</strong></p>
                    <ul>
                      <li><strong>Fecha:</strong> ${fechaEvento}</li>
                      <li><strong>Código de Inscripción:</strong> <code>${codigoInscripcion}</code></li>
                    </ul>
                    
                    <p>Guarda este correo, ya que contiene tu código de inscripción, el cual podría ser solicitado para verificar tu asistencia.</p>
                    <p>¡Esperamos verte allí!</p>
                    <br>
                    <p>Atentamente,<br>El equipo de Event Planner</p>
                `
            });
            console.log('Correo de confirmación de inscripción enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de confirmación de inscripción:', error);
        }
    },

    enviarInvitacionInscripcion: async (
        destinatario,
        nombreUsuario,
        nombreGerente,
        nombreEvento,
        codigoConfirmacion
    ) => {
        const urlConfirmacion = `${process.env.BASE_URL || 'http://localhost:3000'}/api/inscripciones/confirmar/${codigoConfirmacion}`;

        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: `¡Has sido invitado al evento: ${nombreEvento}!`,
                html: `
                    <h2>¡Hola ${nombreUsuario}!</h2>
                    <p>Tu gerente/organizador, <strong>${nombreGerente}</strong>, te ha pre-inscrito en el siguiente evento:</p>
                    <h3 style="color: #007bff;">${nombreEvento}</h3>
                    
                    <p>Tu inscripción está actualmente <strong>Pendiente</strong>. Por favor, haz clic en el siguiente enlace para confirmar tu asistencia:</p>
                    
                    <a href="${urlConfirmacion}" style="display: inline-block; padding: 12px 20px; margin: 15px 0; font-size: 16px; color: white; background-color: #28a745; text-decoration: none; border-radius: 5px;">
                        Confirmar mi Asistencia
                    </a>
                    
                    <p>Si no puedes hacer clic en el botón, copia y pega esta URL en tu navegador:</p>
                    <p><code>${urlConfirmacion}</code></p>
                    
                    <p>Si no deseas asistir, simplemente ignora este correo.</p>
                    <br>
                    <p>Atentamente,<br>El equipo de Event Planner</p>
                `
            });
            console.log('Correo de invitación de inscripción enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de invitación de inscripción:', error);
            throw error;
        }
    },

    enviarSolicitudCambioPonente: async (
        destinatario,
        nombreDestinatario,
        nombrePonente,
        nombreActividad,
        nombreEvento,
        justificacion
    ) => {
        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: `Solicitud de Cambio: ${nombrePonente} en ${nombreActividad}`,
                html: `
                    <h2>Hola ${nombreDestinatario},</h2>
                    <p>El ponente <strong>${nombrePonente}</strong> ha enviado una solicitud de cambio para la actividad:</p>
                    <p style="font-size: 1.1em; margin-left: 15px;">
                        <strong>Actividad:</strong> ${nombreActividad}<br>
                        <strong>Evento:</strong> ${nombreEvento}
                    </p>
                    <p><strong>Justificación del ponente:</strong></p>
                    <blockquote style="border-left: 4px solid #ccc; padding-left: 15px; margin-left: 15px; font-style: italic;">
                        ${justificacion}
                    </blockquote>
                    <p>Por favor, ingresa a la plataforma para aprobar o rechazar esta solicitud.</p>
                `
            });
            console.log('Correo de solicitud de cambio (a admin) enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de solicitud de cambio:', error);
        }
    },

    enviarRespuestaSolicitudCambio: async (
        destinatario,
        nombrePonente,
        nombreActividad,
        nombreEvento,
        aprobada,
        comentariosAdmin
    ) => {
        const esAprobada = aprobada === true || aprobada === 'true' || aprobada === 1;

        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: `Respuesta a tu Solicitud de Cambio - Actividad: ${nombreActividad}`,
                html: `
                    <h2>Hola ${nombrePonente},</h2>
                    <p>Hemos procesado tu solicitud de cambio para la actividad <strong>"${nombreActividad}"</strong> (Evento: ${nombreEvento}).</p>
                    
                    ${esAprobada
                        ? `<h3 style="color: #28a745;">Tu solicitud ha sido APROBADA.</h3>`
                        : `<h3 style="color: #dc3545;">Tu solicitud ha sido RECHAZADA.</h3>`
                    }
                    
                    ${comentariosAdmin
                        ? `<p><strong>Comentarios del organizador:</strong></p>
                           <blockquote style="border-left: 4px solid #ccc; padding-left: 15px; margin-left: 15px; font-style: italic;">
                               ${comentariosAdmin}
                           </blockquote>`
                        : ''
                    }
                    
                    <p>Puedes revisar el estado de tus asignaciones en la plataforma.</p>
                `
            });
            console.log('Correo de respuesta a solicitud (a ponente) enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de respuesta a solicitud:', error);
        }
    },

    enviarCreacionUsuarioPorAdmin: async (destinatario, nombre, rol, contraseñaTemporal, creadorNombre, empresaNombre = null) => {
        const empresaInfo = empresaNombre ? ` en **${empresaNombre}**` : '';

        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: `Tu cuenta de ${rol} ha sido creada`,
                html: `
                    <h2>¡Bienvenido ${nombre}!</h2>
                    <p>El administrador <strong>${creadorNombre}</strong> ha creado una cuenta de <strong>${rol}</strong> para ti${empresaInfo}.</p>
                    
                    <h3>📧 Credenciales de acceso:</h3>
                    <ul>
                        <li><strong>Correo:</strong> ${destinatario}</li>
                        <li><strong>Contraseña temporal:</strong> <code>${contraseñaTemporal}</code></li>
                    </ul>
                    
                    <p><strong>⚠️ IMPORTANTE:</strong> Por seguridad, cambia tu contraseña en tu primer inicio de sesión.</p>
                    
                    <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                        Iniciar sesión ahora
                    </a>
                `
            });
            console.log('Correo de creación de usuario enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de creación de usuario:', error);
        }
    },

    enviarInvitacionPonente: async (
        destinatario,
        nombrePonente,
        nombreOrganizador,
        nombreActividad,
        nombreEvento
    ) => {
        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: `¡Has sido invitado como Ponente al evento: ${nombreEvento}!`,
                html: `
                    <h2>¡Hola ${nombrePonente}!</h2>
                    <p><strong>${nombreOrganizador}</strong> te ha invitado a participar como ponente en la siguiente actividad:</p>
                    <p style="font-size: 1.1em; margin-left: 15px;">
                        <strong>Actividad:</strong> ${nombreActividad}<br>
                        <strong>Evento:</strong> ${nombreEvento}
                    </p>
                    <p>Tu invitación está <strong>pendiente de respuesta</strong>.</p>
                    <p>Por favor, ingresa a la plataforma para aceptar o rechazar esta invitación.</p>
                `
            });
            console.log('Correo de invitación a ponente enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de invitación a ponente:', error);
        }
    },

    enviarNotificacionPonenteRemovido: async (
        destinatario,
        nombrePonente,
        nombreActividad,
        nombreEvento,
        nombreOrganizador
    ) => {
        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: `Notificación: Has sido removido de la actividad "${nombreActividad}"`,
                html: `
                    <h2>Hola ${nombrePonente},</h2>
                    <p>Te informamos que <strong>${nombreOrganizador}</strong> te ha removido de tu asignación como ponente en la siguiente actividad:</p>
                    
                    <p style="font-size: 1.1em; margin-left: 15px;">
                        <strong>Actividad:</strong> ${nombreActividad}<br>
                        <strong>Evento:</strong> ${nombreEvento}
                    </p>
                    
                    <p>Ya no se espera tu participación en esta actividad.</p>
                    <p>Si crees que esto es un error, por favor, ponte en contacto con el organizador.</p>
                `
            });
            console.log('Correo de ponente removido enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de ponente removido:', error);
        }
    },

    enviarNotificacionRespuestaPonente: async (
        destinatario,
        nombreDestinatario,
        nombrePonente,
        nombreActividad,
        aceptada
    ) => {
        const esAceptada = aceptada === "aceptado";
        const estadoTexto = esAceptada ? 'ACEPTADO' : 'RECHAZADO';
        const colorEstado = esAceptada ? '#28a745' : '#dc3545';

        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: `Respuesta de Ponente: ${nombrePonente} ha ${estadoTexto} la invitación`,
                html: `
                    <h2>Hola ${nombreDestinatario},</h2>
                    <p>El ponente <strong>${nombrePonente}</strong> ha respondido a la invitación para la actividad <strong>"${nombreActividad}"</strong>.</p>
                    
                    <h3 style="color: ${colorEstado};">Estado: ${estadoTexto}</h3>
                    
                    <p>Puedes revisar el estado de todos los ponentes de la actividad en la plataforma.</p>
                `
            });
            console.log('Correo de respuesta de ponente (a admin) enviado a:', destinatario);
        } catch (error) {
            console.error('Error enviando correo de respuesta de ponente:', error);
        }
    },

    enviarMensajePersonalizado: async (destinatario, nombreUsuario, nombreEvento, asunto, mensaje) => {
        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: asunto,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Hola ${nombreUsuario},</h2>
                        <p>Tienes un mensaje del organizador del evento <strong>${nombreEvento}</strong>:</p>
                        <hr style="margin: 20px 0;" />
                        <div style="background: #f8f9fa; padding: 16px; border-radius: 6px; white-space: pre-wrap;">${mensaje}</div>
                        <hr style="margin: 20px 0;" />
                        <p style="color: #888; font-size: 13px;">Atentamente,<br>El equipo de Event Planner</p>
                    </div>
                `
            });
        } catch (error) {
            console.error('Error enviando mensaje personalizado a', destinatario, ':', error);
        }
    },

    enviarEncuesta: async (correoDestinatario, nombreDestinatario, urlEncuesta) => {
        try {
            const data = await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: correoDestinatario,
                subject: 'Completa nuestra encuesta',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Hola ${nombreDestinatario},</h2>
                        <p>Nos gustaría conocer tu opinión. Por favor completa la siguiente encuesta:</p>
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${urlEncuesta}" 
                             style="background-color: #007bff; color: white; padding: 12px 30px; 
                                    text-decoration: none; border-radius: 5px; display: inline-block;">
                            Completar Encuesta
                          </a>
                        </div>
                        <p>O copia y pega este enlace en tu navegador:</p>
                        <p style="word-break: break-all; color: #666;">${urlEncuesta}</p>
                        <p>Gracias por tu participación.</p>
                    </div>
                `
            });
            return data;
        } catch (error) {
            console.error('Error enviando encuesta:', error);
            throw error;
        }
    },

    enviarNotificacionCambioEvento: async (destinatario, nombreUsuario, nombreEvento, camposModificados) => {
        const listaCambios = camposModificados && camposModificados.length > 0
            ? `<p><strong>Cambios realizados en:</strong> ${camposModificados.join(', ')}</p>`
            : '';
        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: `Actualización en el evento: ${nombreEvento}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Hola ${nombreUsuario},</h2>
                        <p>Te informamos que el evento <strong>${nombreEvento}</strong> en el que estás inscrito ha sido actualizado.</p>
                        ${listaCambios}
                        <p>Puedes consultar los detalles actualizados en la plataforma.</p>
                        <p style="color: #888; font-size: 13px;">Atentamente,<br>El equipo de Event Planner</p>
                    </div>
                `
            });
        } catch (error) {
            console.error('Error enviando notificación de cambio de evento a', destinatario, ':', error);
        }
    },

    enviarNotificacionCambioAgenda: async (destinatario, nombreUsuario, nombreEvento, nombreActividad) => {
        try {
            await resend.emails.send({
                from: process.env.EMAIL_USER,
                to: destinatario,
                subject: `Cambio en la agenda del evento: ${nombreEvento}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Hola ${nombreUsuario},</h2>
                        <p>La actividad <strong>${nombreActividad}</strong> del evento <strong>${nombreEvento}</strong> ha sido modificada.</p>
                        <p>Puedes consultar la agenda actualizada en la plataforma.</p>
                        <p style="color: #888; font-size: 13px;">Atentamente,<br>El equipo de Event Planner</p>
                    </div>
                `
            });
        } catch (error) {
            console.error('Error enviando notificación de cambio de agenda a', destinatario, ':', error);
        }
    }
};

module.exports = EmailService;
