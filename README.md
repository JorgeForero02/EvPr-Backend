# Event Planner API

API REST para sistema de gestión de eventos desarrollada con Node.js, Express y MySQL. 

## Descripción

Sistema completo de gestión de eventos que permite administrar empresas, eventos, actividades, inscripciones, asistencias, ponentes, encuestas y notificaciones con un sistema de roles diferenciados.

## Características

- **Autenticación y Autorización**: Sistema JWT con tokens de acceso y renovación
- **Gestión de Eventos**: Creación y administración de eventos y actividades
- **Sistema de Roles**: Soporte para administrador, gerente, organizador, ponente y asistente 
- **Inscripciones y Asistencias**: Control de participantes en eventos
- **Notificaciones**: Sistema de notificaciones para usuarios 
- **Encuestas**: Gestión de encuestas y respuestas 
- **Auditoría**: Registro de acciones del sistema 
- **Recordatorios Automatizados**: Sistema de cron jobs para envío de recordatorios 
- **Documentación Swagger**: Documentación interactiva de la API  

## Tecnologías

- **Node.js** & **Express**: Framework backend
- **Sequelize**: ORM para MySQL 
- **MySQL**: Base de datos 
- **JWT**: Autenticación 
- **Bcrypt**: Encriptación de contraseñas 
- **Nodemailer**: Envío de correos electrónicos
- **Node-cron**: Tareas programadas 
- **Helmet**: Seguridad HTTP 

## Requisitos Previos

- Node.js (versión 14 o superior)
- MySQL (versión 5.7 o superior)
- npm o yarn

## Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/JorgeForero02/Event-planner.git
cd Event-planner
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=event_planner
DB_USER=root
DB_PASSWORD=tu_contraseña

# Servidor
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3001

# JWT
JWT_SECRET=tu_clave_secreta
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=tu_clave_secreta_refresh
JWT_REFRESH_EXPIRE=7d

# Email
EMAIL_USER=tu_email@gmail.com
````

4. **Sincronizar base de datos**

La base de datos se sincronizará automáticamente al iniciar el servidor en modo desarrollo. 

5. **Crear usuario administrador**

```bash
node crear_admin.js
````

Este script creará un usuario administrador con las siguientes credenciales por defecto:
- Correo: `admin@sistema.com`
- Contraseña: `Admin123!` 

## Uso

### Modo Desarrollo
```bash
npm run dev
````

### Modo Producción
````bash
npm start
````

El servidor estará disponible en: `http://localhost:3000` 

## Endpoints Principales

Todos los endpoints están bajo el prefijo `/api`: 

- `/api/auth` - Autenticación (login, registro, refresh token)
- `/api/empresas` - Gestión de empresas
- `/api/eventos` - Gestión de eventos
- `/api/actividades` - Gestión de actividades
- `/api/inscripciones` - Inscripciones a eventos
- `/api/asistencias` - Control de asistencias
- `/api/lugares` - Gestión de lugares
- `/api/ubicaciones` - Gestión de ubicaciones
- `/api/ponente-actividad` - Asignación de ponentes
- `/api/notificaciones` - Sistema de notificaciones
- `/api/encuestas` - Gestión de encuestas
- `/api/gestion-usuarios` - Administración de usuarios
- `/api/auditoria` - Logs de auditoría
- `/api/paises` - Catálogo de países
- `/api/ciudades` - Catálogo de ciudades 

## Estructura del Proyecto

````Bash
Event-planner/
├── config/          # Configuraciones
├── constants/       # Constantes del sistema
├── controllers/     # Lógica de negocio
├── cron/           # Tareas programadas
├── middlewares/    # Middlewares (auth, error, etc.)
├── models/         # Modelos de Sequelize
├── routes/         # Definición de rutas
├── services/       # Servicios auxiliares
├── utils/          # Utilidades
├── validators/     # Validaciones de datos
├── .env           # Variables de entorno
├── crear_admin.js # Script de creación de admin
├── package.json   # Dependencias
└── server.js      # Punto de entrada
````

## Roles de Usuario

El sistema soporta los siguientes roles:

1. **Administrador**: Control total del sistema
2. **Gerente**: Gestión de empresa específica
3. **Organizador**: Creación y gestión de eventos
4. **Ponente**: Participación como expositor
5. **Asistente**: Inscripción y participación en eventos 

## Seguridad

- Contraseñas encriptadas con bcrypt
- Autenticación basada en JWT
- Protección contra vulnerabilidades comunes con Helmet
- Validación de datos con express-validator
- CORS configurado

## Notificaciones

El sistema incluye:
- Envío automático de correos electrónicos
- Sistema de recordatorios programados para eventos
- Notificaciones personalizadas por tipo

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/JorgeForero02/Event-planner)
