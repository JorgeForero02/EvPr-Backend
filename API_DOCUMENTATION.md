# API Documentation — EventPlanner Backend

Base URL: `http://localhost:3000/api`

All protected endpoints require an `Authorization: Bearer <access_token>` header.

All responses follow the shape:
```json
{ "success": true|false, "message": "...", "data": {...} }
```

---

## Authentication

### POST /auth/register
Register a new user (public).

**Body:**
```json
{
  "nombre": "string",
  "correo": "string (unique email)",
  "contrasena": "string (min 8 chars)",
  "rol": "asistente | ponente"
}
```

**201 Created:**
```json
{ "success": true, "message": "Usuario registrado exitosamente", "data": { "id": 1, "nombre": "...", "correo": "...", "rol": "..." } }
```

**400:** Validation error or duplicate email.

---

### POST /auth/login
Authenticate a user.

**Body:**
```json
{ "correo": "string", "contrasena": "string" }
```

**200 OK:**
```json
{
  "success": true,
  "data": {
    "access_token": "JWT (24h)",
    "refresh_token": "JWT (7d)",
    "usuario": { "id": 1, "nombre": "...", "correo": "...", "rol": "...", "rolData": {...} }
  }
}
```

**401:** Invalid credentials. **403:** User disabled.

---

### POST /auth/refresh
Get a new access token using a refresh token.

**Body:**
```json
{ "refresh_token": "string" }
```

**200 OK:** `{ "success": true, "data": { "access_token": "..." } }`

**401:** Invalid or expired refresh token.

---

### GET /auth/profile
Get the authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**200 OK:**
```json
{ "success": true, "data": { "id": 1, "nombre": "...", "correo": "...", "rol": "...", "rolData": {...} } }
```

---

### POST /auth/promover-gerente
Promote a user to company manager. Requires `administrador`.

**Body:**
```json
{ "id_usuario": 5, "id_empresa": 2 }
```

**200 OK:** `{ "success": true, "message": "Usuario promovido a Gerente exitosamente" }`

---

### POST /auth/crear-organizador
Create an organizer for a company. Requires `gerente` or `administrador`.

**Body:**
```json
{ "nombre": "string", "correo": "string", "id_empresa": 1 }
```

**201 Created:** Returns new user data and sends welcome email with temporary password.

---

### POST /auth/crear-usuario
Create any user type. Requires `administrador`.

**Body:**
```json
{
  "nombre": "string",
  "correo": "string",
  "rol": "administrador | gerente | organizador | ponente | asistente",
  "id_empresa": 1
}
```

**201 Created:** User created, welcome email sent.

---

### POST /auth/recuperar-contrasena
Request password recovery (public).

**Body:** `{ "correo": "string" }`

**200 OK:** `{ "success": true, "message": "Si el correo existe, recibirás instrucciones." }`

---

## User Management

### GET /gestion-usuarios
List all users. Requires `administrador`.

**Query params (optional):** `nombre`, `correo`, `rol`, `estado` (1=active, 0=disabled)

**200 OK:** `{ "success": true, "data": [ {...user} ] }`

---

### GET /gestion-usuarios/:id
Get a single user. Requires `administrador` or own user.

**200 OK:** `{ "success": true, "data": { ...user } }`

---

### POST /gestion-usuarios
Create a user. Requires `administrador`.

**Body:** Same as POST /auth/crear-usuario.

---

### PUT /gestion-usuarios/:id/profile
Update user profile. Requires `administrador` or own user.

**Body:** `{ "nombre": "string", "correo": "string" }`

---

### PUT /gestion-usuarios/:id/password
Change password. Requires `administrador` or own user.

**Body:** `{ "contrasena_actual": "string", "nueva_contrasena": "string" }`

---

### PATCH /gestion-usuarios/:id/status
Enable/disable a user. Requires `administrador`.

**Body:** `{ "activo": true | false }`

**409:** Cannot disable if user has active dependencies.

---

## Admin

### GET /admin/dashboard/stats
System-wide statistics. Requires `administrador`.

**200 OK:**
```json
{
  "success": true,
  "data": {
    "usuarios_por_rol": { "administrador": 1, "gerente": 2, "organizador": 3, "ponente": 5, "asistente": 40, "total": 51 },
    "eventos_activos": 4,
    "eventos_finalizados": 10,
    "total_inscripciones_confirmadas": 120,
    "total_asistencias": 95,
    "tasa_global_asistencia": 79,
    "encuestas": { "activas": 3, "total_enviadas": 150, "total_completadas": 80, "tasa_respuesta": 53 }
  }
}
```

---

### GET /admin/dashboard/exportar-csv
Export dashboard stats as CSV. Requires `administrador`.

**Response:** `text/csv` attachment `dashboard_admin.csv`.

---

### GET /admin/roles
List system roles with active user counts. Requires `administrador`.

**200 OK:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "tipo": "gerente", "nombre": "Gerente", "descripcion": "...", "activo": true, "usuarios_activos": 2 }
  ]
}
```

---

### POST /admin/roles
Create a new system role (HU-029). Requires `administrador`.

**Body:**
```json
{ "tipo": "string (unique slug)", "nombre": "string", "descripcion": "string (optional)" }
```

**201 Created:** `{ "success": true, "message": "Rol creado exitosamente", "data": { "id": 5, "tipo": "...", "nombre": "...", "activo": true } }`

**409:** Duplicate tipo.

---

### PATCH /admin/roles/:tipo/toggle-estado
Enable or disable a role. Requires `administrador`.

**Body:** `{ "activo": true | false }`

**200 OK:** `{ "success": true, "message": "Rol \"gerente\" deshabilitado exitosamente", "data": { "tipo": "gerente", "activo": false } }`

**404:** Role type not found. **409:** Role has active users.

---

### GET /admin/solicitudes-actualizacion
List all company update requests. Requires `administrador`.

**200 OK:** `{ "success": true, "data": [ {...solicitud} ] }`

---

### GET /admin/solicitudes-actualizacion/:id
Get a single company update request. Requires `administrador`.

---

### PATCH /admin/solicitudes-actualizacion/:id/procesar
Approve or reject a company update request. Requires `administrador`.

**Body:** `{ "aprobada": true | false, "comentarios": "string (optional)" }`

---

## Companies (Empresas)

### POST /empresas
Register a new company (affiliation request). Requires authenticated user.

**Body:**
```json
{
  "nombre": "string",
  "nit": "string",
  "telefono": "string",
  "correo": "string",
  "direccion": "string",
  "id_pais": 1,
  "id_ciudad": 1
}
```

**201 Created:** Company created in `pendiente` state. Notifications sent to admins. Email sent to requester.

---

### GET /empresas
List companies. Filtered by role: admins see all; managers/organizers see their own.

**200 OK:** `{ "success": true, "data": [ {...empresa} ] }`

---

### GET /empresas/:id
Get company details.

---

### PUT /empresas/:id
Update company info (creates an update request for admin approval). Requires `gerente`.

**Body:** Any updatable company field.

---

### GET /empresas/:id/equipo
List organizers/managers of a company. Requires `gerente` or `administrador`.

---

### GET /empresas/:id/estadisticas-ocupacion
Venue occupancy stats. Requires `gerente` or `administrador`.

**200 OK:** `{ "success": true, "data": { "lugares": [ { "nombre": "Sala A", "total_actividades": 5, "tasa_ocupacion": 80 } ] } }`

---

### GET /empresas/:id/reporte-desempenho
Company performance report. Requires `gerente` or `administrador`.

**200 OK:** Aggregated KPIs: inscriptions, attendance, surveys, budget.

---

### GET /empresas/:id/reporte-desempenho/exportar-csv
Export performance report as CSV.

**Response:** `text/csv` attachment.

---

### PATCH /empresas/:id/aprobar
Approve a company affiliation. Requires `administrador`.

**Body:** `{ "aprobar": true | false, "motivo": "string (required when aprobar=false)" }`

**200 OK:** Company state updated. Gerente promoted. Email notification sent.

---

## Solicitudes de Actualización de Empresa

### POST /solicitudes-actualizacion
Submit a request to update company data. Requires `gerente`.

**Body:**
```json
{ "id_empresa": 1, "datos_nuevos": { "nombre": "...", "telefono": "..." }, "justificacion": "string" }
```

**201 Created:** Request registered, admins notified.

---

### GET /solicitudes-actualizacion/empresa/:id
List all update requests for a company. Requires `gerente` or `administrador`.

---

## Locations (Ubicaciones)

### POST /ubicaciones
Create a location. Requires `gerente` + approved company.

**Body:**
```json
{ "nombre": "string", "tipo": "fisica | virtual", "direccion": "string", "id_empresa": 1 }
```

**201 Created:** Location created. **409:** Duplicate name within same company.

---

### GET /ubicaciones
List locations. Filtered by company for gerente/organizador.

---

### GET /ubicaciones/:id
Get location details.

---

### PUT /ubicaciones/:id
Update location. Requires `gerente`.

**Body:** Updatable fields (nombre, tipo, direccion).

---

### PATCH /ubicaciones/:id/toggle-estado
Enable/disable a location. Requires `gerente`.

**Body:** `{ "activo": true | false }`

**409:** Cannot disable if there are active/upcoming events using this location.

---

## Venues (Lugares/Salas)

### POST /lugares
Create a venue/room. Requires `gerente` + approved company.

**Body:**
```json
{ "nombre": "string", "capacidad": 100, "descripcion": "string", "id_ubicacion": 1, "id_empresa": 1 }
```

**201 Created:** **409:** Duplicate name within same location.

---

### GET /lugares
List venues. Filtered by company.

---

### GET /lugares/:id
Get venue details.

---

### PUT /lugares/:id
Update venue. Requires `gerente`.

**Body:** `{ "nombre": "string", "capacidad": 120, "descripcion": "string" }`

---

### PATCH /lugares/:id/toggle-estado
Enable/disable a venue. Requires `gerente`.

**Body:** `{ "activo": true | false }`

**409:** Cannot disable if there are upcoming activities assigned to this venue.

---

## Events (Eventos)

### POST /eventos
Create an event. Requires `organizador` or `gerente` + approved company.

**Body:**
```json
{
  "titulo": "string",
  "descripcion": "string",
  "fecha_inicio": "YYYY-MM-DD",
  "fecha_fin": "YYYY-MM-DD",
  "modalidad": "presencial | virtual | hibrida",
  "cupos": 50,
  "lugar_id": 1,
  "url_virtual": "string (required if virtual)",
  "id_empresa": 1,
  "fecha_limite_cancelacion": "YYYY-MM-DD (optional)"
}
```

**201 Created:** Event created in `borrador` state.

**400:** Validation error (missing fields, cupos > venue capacity). **409:** Venue time conflict.

---

### GET /eventos
List events. Filtered by role: organizers see their company's events; attendees see only published.

**Query params (optional):** `modalidad`, `estado`, `id_empresa`, `palabras_clave`, `fecha_inicio`, `fecha_fin`

**200 OK:** `{ "success": true, "data": [ {...evento} ] }`

---

### GET /eventos/:eventoId
Get event details (also triggers auto-finalization if past end date).

**200 OK:** Full event with company, creator, activities, inscriptions count.

---

### PUT /eventos/:eventoId
Update event. Requires `organizador` (own event) or `gerente`.

**Body:** Any updatable field. If event is `publicado` and inscribed users exist, internal + email notifications are sent automatically.

**400:** Validation error. **409:** Venue conflict.

---

### DELETE /eventos/:eventoId
Cancel event. Requires `organizador` (own event) or `gerente`.

**200 OK:** Event state set to `cancelado`. Notifications and emails sent to all inscribed users and assigned speakers.

---

### GET /eventos/:eventoId/actividades
List activities of an event.

---

### POST /eventos/:eventoId/actividades
Create an activity. Requires `organizador` or `gerente`.

**Body:**
```json
{
  "titulo": "string",
  "descripcion": "string",
  "fecha_actividad": "YYYY-MM-DD",
  "hora_inicio": "HH:MM:SS",
  "hora_fin": "HH:MM:SS",
  "url": "string (optional)",
  "presupuesto": 500.00,
  "lugares": [1, 2],
  "ponentes": [3, 4]
}
```

**201 Created:** **409:** Schedule conflict for venue or speaker.

---

### GET /eventos/:eventoId/inscritos
List inscribed users. Requires `organizador` or `gerente`.

**200 OK:** `{ "success": true, "data": [ { "id": 1, "nombre": "...", "correo": "...", "estado": "Confirmada" } ] }`

---

### GET /eventos/:eventoId/inscritos/exportar-csv
Export inscribed users as CSV. Requires `organizador` or `gerente`.

**Response:** `text/csv` attachment.

---

### GET /eventos/:eventoId/reporte
Event KPI report. Requires `organizador` or `gerente`.

**200 OK:**
```json
{
  "success": true,
  "data": {
    "inscritos": 50,
    "asistentes": 40,
    "cancelados": 5,
    "tasa_asistencia": 80,
    "encuestas_enviadas": 40,
    "encuestas_completadas": 30,
    "tasa_respuesta_encuestas": 75
  }
}
```

---

### GET /eventos/:eventoId/reporte/exportar-csv
Export event report as CSV. Requires `organizador` or `gerente`.

**Response:** `text/csv` attachment.

---

### POST /eventos/:eventoId/notificaciones-manuales
Send a manual notification to all confirmed inscribed users. Requires `organizador` (own event) or `gerente`.

**Body:**
```json
{ "asunto": "string", "mensaje": "string" }
```

**200 OK:** Internal notifications + emails sent to all confirmed inscribed users.

---

### GET /eventos/:eventoId/presupuesto
Budget summary for an event.

**200 OK:** `{ "success": true, "data": { "total_ingresos": 5000, "total_gastos": 3200, "balance": 1800, "items": [...] } }`

---

### POST /eventos/:eventoId/presupuesto-items
Add a budget item. Requires `organizador` or `gerente`.

**Body:**
```json
{ "concepto": "string", "tipo": "ingreso | gasto", "monto": 500.00, "id_actividad": 1 }
```

---

### GET /eventos/:eventoId/presupuesto-items
List budget items.

---

### PUT /eventos/:eventoId/presupuesto-items/:id
Update a budget item. Requires `organizador` or `gerente`.

---

### DELETE /eventos/:eventoId/presupuesto-items/:id
Delete a budget item. Requires `organizador` or `gerente`.

---

## Activities (Actividades)

### GET /actividades/:actividadId
Get a single activity with venue and speaker details.

---

### PUT /actividades/:actividadId
Update an activity. Requires `organizador` or `gerente`.

**Body:** Same fields as creation (all optional). On update, notifications + emails are sent to assigned speakers and all inscribed attendees.

**400:** Validation error. **409:** Schedule conflict.

---

### DELETE /actividades/:actividadId
Delete an activity. Requires `organizador` or `gerente`.

**400:** Cannot delete an ongoing or finished activity.

---

## Speaker Assignment (PonenteActividad)

### POST /ponente-actividad
Assign a speaker to an activity. Requires `administrador`, `gerente`, or `organizador`.

**Body:**
```json
{ "id_ponente": 3, "id_actividad": 7 }
```

**201 Created:** Assignment created. Speaker receives invitation email + internal notification.

---

### GET /ponente-actividad/actividad/:actividadId
List speaker assignments for an activity.

---

### GET /ponente-actividad/ponente/:ponenteId
List activities assigned to a speaker. Supports optional filters: `evento_id`, `fecha_inicio`, `fecha_fin`, `estado`.

---

### GET /ponente-actividad/ponentes
List available speakers. Requires `administrador`, `gerente`, or `organizador`.

---

### GET /ponente-actividad/:ponenteId/:actividadId
Get a single assignment.

---

### PUT /ponente-actividad/:ponenteId/:actividadId/responder-invitacion
Speaker responds to invitation. Requires authenticated speaker.

**Body:** `{ "respuesta": "aceptado | rechazado", "motivo_rechazo": "string (if rejected)" }`

**200 OK:** State updated. Organizer notified.

---

### POST /ponente-actividad/:ponenteId/:actividadId/solicitar-cambio
Speaker requests modification to their assignment. Requires authenticated speaker.

**Body:**
```json
{ "justificacion": "string", "cambios_solicitados": { "hora_inicio": "10:00:00", "descripcion": "..." } }
```

**201 Created:** Request registered. Organizer receives email + internal notification.

---

### PUT /ponente-actividad/:ponenteId/:actividadId/procesar-solicitud
Approve or reject a change request. Requires `administrador`, `gerente`, or `organizador`.

**Body:** `{ "aprobada": true | false, "comentarios": "string (optional)" }`

**200 OK:** Speaker notified of decision via email + internal notification.

---

### PUT /ponente-actividad/:ponenteId/:actividadId
Update assignment. Requires `administrador`, `gerente`, or `organizador`.

---

### DELETE /ponente-actividad/:ponenteId/:actividadId
Remove speaker from activity. Requires `administrador`, `gerente`, or `organizador`.

**200 OK:** Speaker notified via email + internal notification.

---

## Inscriptions

### GET /inscripciones/eventos-disponibles
Public endpoint. List published events available for registration.

**Query params (optional):** `modalidad`, `empresa`, `palabras_clave`, `fecha_inicio`, `fecha_fin`

---

### POST /inscripciones
Register for an event. Requires authenticated user.

**Body:** `{ "id_evento": 1 }`

**201 Created:** Inscription created (estado: `Confirmada`). Confirmation email sent.

**400:** Already inscribed. **409:** No spots available.

---

### GET /inscripciones/mis-inscripciones
List the authenticated user's inscriptions.

**200 OK:** `{ "success": true, "data": [ { "id": 1, "id_evento": 3, "estado": "Confirmada", "evento": {...} } ] }`

---

### POST /inscripciones/inscribir-equipo
Bulk-inscribe a group of attendees. Requires `organizador` or `gerente`.

**Body:**
```json
{ "id_evento": 1, "asistentes": [{ "correo": "user@example.com" }] }
```

---

### GET /inscripciones/confirmar/:codigo
Confirm a pending inscription via email link (public).

**200 OK:** Inscription state changed to `Confirmada`.

---

### PATCH /inscripciones/:id/cancelar
Cancel an inscription. Requires authenticated owner.

**200 OK:** State set to `Cancelada`. Organizer notified via email + internal notification.

**403:** Not the owner. **400:** Cannot cancel after event started.

---

## Attendance (Asistencias)

### POST /asistencias
Self-register attendance. Requires authenticated attendee.

**Body:** `{ "id_inscripcion": 5 }`

**201 Created:** Attendance recorded.

**400:** Not inscribed / outside event dates. **409:** Already registered.

---

### POST /asistencias/codigo
Register attendance by QR code. Requires authenticated attendee.

**Body:** `{ "codigo": "string" }`

---

### GET /asistencias/mis-asistencias
List the authenticated user's attendance records.

---

### GET /asistencias/evento/:id_evento
List all attendances for an event. Requires `organizador` or `gerente`.

---

### PATCH /asistencias/:id/manual
Manually set attendance for a specific inscription. Requires `organizador` or `gerente`.

`:id` = inscription ID.

**Body:** `{ "estado": "Presente | Ausente" }`

**200 OK:** Attendance created or overwritten with `registrado_por: 'organizador'` and `estado_manual: true`.

---

## Surveys (Encuestas)

### POST /encuestas
Create a survey. Requires `administrador`, `gerente`, `organizador`, or `ponente`.

**Body:**
```json
{
  "titulo": "string",
  "descripcion": "string",
  "tipo_encuesta": "pre_evento | post_evento | en_vivo | pre_actividad",
  "id_evento": 1,
  "id_actividad": 2,
  "fecha_inicio": "YYYY-MM-DD",
  "fecha_fin": "YYYY-MM-DD"
}
```

**201 Created:** Survey created in `borrador` state.

---

### POST /encuestas/rapida
Create a live survey instantly (starts as `activa`). Requires `ponente` with accepted assignment.

**Body:**
```json
{ "titulo": "string", "id_actividad": 2, "id_evento": 1 }
```

**201 Created:** Survey with `es_encuesta_rapida: true`, `tipo_creador: 'ponente'`, state `activa`.

---

### GET /encuestas
List surveys. Filtered by user role/company.

---

### GET /encuestas/respuestas/asistentes
List survey responses for attendees.

---

### POST /encuestas/completar
Complete/respond to a survey. Requires authenticated user.

**Body:**
```json
{ "id_encuesta": 3, "respuestas": { "pregunta1": "opcion_a", "pregunta2": "texto libre" } }
```

**200 OK:** Response recorded. Prevents duplicate responses.

---

### GET /encuestas/:encuestaId
Get survey details and responses.

---

### PUT /encuestas/:encuestaId
Update survey. Requires `administrador`, `gerente`, `organizador`, or `ponente`.

---

### DELETE /encuestas/:encuestaId
Delete survey. Requires `administrador`, `gerente`, `organizador`, or `ponente`.

---

### POST /encuestas/:encuestaId/enviar
Send survey to event inscribed users. Requires `administrador`, `gerente`, `organizador`, or `ponente`.

**200 OK:** Survey emails sent. State set to `activa`.

---

### GET /encuestas/:encuestaId/estadisticas
Survey statistics. Requires `administrador`, `gerente`, `organizador`, or `ponente`.

**200 OK:**
```json
{
  "success": true,
  "data": {
    "total_enviadas": 50,
    "total_completadas": 35,
    "tasa_respuesta": 70,
    "respuestas": [...]
  }
}
```

---

### GET /encuestas/:encuestaId/exportar-csv
Export survey results as CSV.

**Response:** `text/csv` attachment.

---

### PATCH /encuestas/:encuestaId/habilitar-ponente
Enable a survey for the speaker of a specific activity. Requires `organizador` or `gerente`.

**Body:** `{ "actividad_id": 2 }`

**200 OK:** `habilitada_para_ponente` set to `true`.

---

## Notifications

### GET /notificaciones/mis-notificaciones
List the authenticated user's notifications.

**Query params (optional):** `estado` (pendiente | leida), `entidad_tipo`, `limit` (default: 50)

**200 OK:**
```json
{
  "success": true,
  "data": {
    "notificaciones": [
      {
        "id": 1,
        "titulo": "string",
        "contenido": "string",
        "estado": "pendiente | leida",
        "entidad_tipo": "evento | actividad | ...",
        "entidad_id": 3,
        "fecha_creacion": "...",
        "tipoNotificacion": { "nombre": "..." }
      }
    ]
  }
}
```

---

### GET /notificaciones/:notificacionId
Get a single notification. Requires ownership.

---

### PUT /notificaciones/:notificacionId/marcar-leida
Mark a notification as read. Requires ownership.

---

### DELETE /notificaciones/:notificacionId
Delete a notification. Requires ownership.

---

## AI Content Generation — SC1

Requires `organizador` or `gerente` role and permission over the target event.

### POST /ia/generar-mensaje
Generate a draft message for an event notification (HU-040, HU-042).

**Body:**
```json
{
  "id_evento": 1,
  "tipo_mensaje": "recordatorio | modificacion | cancelacion | bienvenida | general",
  "contexto_adicional": "string (optional)"
}
```

**200 OK:**
```json
{
  "success": true,
  "message": "Texto generado exitosamente",
  "data": {
    "texto_generado": "Estimados participantes...",
    "tipo_mensaje": "recordatorio",
    "id_evento": 1
  }
}
```

**Note:** The returned text is a draft. Use `POST /eventos/:id/notificaciones-manuales` to send it after editing.

**400:** Missing required fields or invalid `tipo_mensaje`. **403:** No permission over event. **404:** Event not found. **503:** AI service unavailable.

---

### POST /ia/generar-descripcion
Generate an event description suggestion (HU-043).

**Body:**
```json
{
  "id_evento": 1,
  "tono": "formal | amigable | motivador"
}
```

**200 OK:**
```json
{
  "success": true,
  "message": "Descripción generada exitosamente",
  "data": {
    "descripcion_generada": "Este evento ofrece...",
    "tono": "formal",
    "id_evento": 1
  }
}
```

**Note:** Apply the description via `PUT /eventos/:id` with the field `descripcion`.

**400:** Missing `id_evento`. **403:** No permission. **404:** Event not found. **503:** AI service unavailable.

---

## Chatbot — SC2

### POST /chatbot/consultar
Send a question to the AI chatbot (HU-036, HU-038).

Accessible to any authenticated user.

**Body:**
```json
{
  "pregunta": "¿Cuándo empieza el evento de React?",
  "id_evento": 1
}
```

- `id_evento` (optional): Restricts context to a specific event for more precise answers.
- If omitted, the chatbot uses all currently published events as context.

**200 OK:**
```json
{
  "success": true,
  "data": {
    "pregunta": "¿Cuándo empieza el evento de React?",
    "respuesta": "El evento 'React Summit' inicia el 15 de mayo de 2026..."
  }
}
```

**400:** Missing or invalid question (max 500 characters). **503:** AI service unavailable.

**Behavior:**
- Responds only with data available in the platform.
- If the question cannot be answered, indicates clearly and suggests contacting the organizer.
- Answers FAQ about platform usage (how to register, cancel inscription, register attendance, respond surveys).

---

## Auditoría

### GET /auditoria
List audit log entries. Requires `administrador`.

**Query params (optional):** `fecha_inicio`, `fecha_fin`, `accion`, `id_usuario`

**200 OK:** `{ "success": true, "data": [ { "id": 1, "fecha": "...", "hora": "...", "mensaje": "...", "accion": "...", "ip_address": "..." } ] }`

---

## Countries & Cities

### GET /paises
List all countries (public).

### GET /paises/:id
Get country by ID.

### GET /ciudades
List cities. Optional query: `id_pais`.

### GET /ciudades/:id
Get city by ID.

---

## Automatic Notifications Summary

The system sends the following automatic notifications (internal + email) without additional frontend action:

| Trigger | Recipients | Channel |
|---------|-----------|---------|
| Company affiliation registered | All system admins | Internal |
| Company affiliation result | Requesting gerente | Internal + Email |
| Company update request result | Requesting gerente | Internal |
| User created by admin | New user | Email (temporary password) |
| User promoted to gerente | Promoted user | Internal + Email |
| Organizer account created | New organizer | Email |
| Inscription confirmed | Inscribed attendee | Email |
| Event modified (published) | All inscribed users + assigned speakers | Internal + Email |
| Event cancelled | All inscribed users + assigned speakers | Internal + Email |
| Activity modified | Assigned speakers + inscribed attendees | Internal + Email |
| Activity deleted | Assigned speakers | Internal |
| Speaker assigned to activity | Speaker + organizer | Internal + Email |
| Speaker removed from activity | Speaker | Internal + Email |
| Speaker invitation response | Organizer | Internal + Email |
| Speaker change request submitted | Organizer | Internal + Email |
| Speaker change request responded | Speaker | Internal + Email |
| Inscription cancelled by attendee | Organizer | Internal + Email |
| Event finalized (auto) | All inscribed users (post-event survey) | Email |
| Daily reminder (08:00 Bogotá cron) | Speakers with next-day activities | Internal |

---

## Environment Variables Required

```
PORT=3000
NODE_ENV=development
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD   # MySQL/Aiven
JWT_SECRET, JWT_EXPIRE=24h
JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRE=7d
RESEND_API_KEY                                     # Email provider
EMAIL_USER                                         # From address
ALLOWED_ORIGINS=http://localhost:3001
FRONTEND_URL=http://localhost:3001
OPENAI_API_KEY                                     # Required for /ia and /chatbot endpoints
```

---

## Pending DB Migrations

Run `migrations/004_create_rol_sistema.sql` to add the `RolSistema` table and the following columns if not already present:

```sql
-- Asistencia
ALTER TABLE Asistencia
    ADD COLUMN IF NOT EXISTS registrado_por ENUM('asistente','organizador') NULL,
    ADD COLUMN IF NOT EXISTS estado_manual TINYINT(1) NOT NULL DEFAULT 0;

-- Encuesta
ALTER TABLE Encuesta
    ADD COLUMN IF NOT EXISTS habilitada_para_ponente TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS es_encuesta_rapida TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tipo_creador ENUM('organizador','ponente') NULL DEFAULT 'organizador';

-- Evento
ALTER TABLE Evento
    ADD COLUMN IF NOT EXISTS fecha_limite_cancelacion DATE NULL;
```
