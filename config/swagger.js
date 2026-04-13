const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Event Planner API',
            version: '1.0.0',
            description: '',
            contact: {
                name: 'API Support',
                email: 'support@eventplanner.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor de Desarrollo'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Ingrese el token JWT en el formato: Bearer {token}'
                }
            },
            schemas: {
                Usuario: {
                    type: 'object',
                    required: ['nombre', 'cedula', 'correo', 'contraseña', 'rol'],
                    properties: {
                        nombre: {
                            type: 'string',
                            description: 'Nombre completo del usuario',
                            example: 'Juan Pérez García'
                        },
                        cedula: {
                            type: 'string',
                            description: 'Número de cédula único',
                            example: '1234567890'
                        },
                        telefono: {
                            type: 'string',
                            description: 'Número de teléfono (opcional)',
                            example: '3001234567'
                        },
                        correo: {
                            type: 'string',
                            format: 'email',
                            description: 'Correo electrónico único',
                            example: 'usuario@example.com'
                        },
                        contraseña: {
                            type: 'string',
                            format: 'password',
                            description: 'Contraseña del usuario',
                            example: 'Password123!'
                        },
                        rol: {
                            type: 'string',
                            enum: ['administrador', 'gerente', 'organizador', 'ponente', 'asistente'],
                            description: 'Rol del usuario en el sistema',
                            example: 'asistente'
                        },
                        id_empresa: {
                            type: 'integer',
                            description: 'ID de empresa (requerido para gerente y organizador)',
                            example: 1
                        },
                        especialidad: {
                            type: 'string',
                            description: 'Especialidad del ponente (opcional para ponente)',
                            example: 'Inteligencia Artificial'
                        }
                    }
                },
                Login: {
                    type: 'object',
                    required: ['correo', 'contraseña'],
                    properties: {
                        correo: {
                            type: 'string',
                            format: 'email',
                            description: 'Correo electrónico del usuario',
                            example: 'usuario@example.com'
                        },
                        contraseña: {
                            type: 'string',
                            format: 'password',
                            description: 'Contraseña del usuario',
                            example: 'Password123!'
                        }
                    }
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            example: 'Login exitoso como administrador'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                usuario: {
                                    type: 'object',
                                    properties: {
                                        id: {
                                            type: 'integer',
                                            example: 1
                                        },
                                        nombre: {
                                            type: 'string',
                                            example: 'Juan Pérez García'
                                        },
                                        cedula: {
                                            type: 'string',
                                            example: '1234567890'
                                        },
                                        telefono: {
                                            type: 'string',
                                            example: '3001234567'
                                        },
                                        correo: {
                                            type: 'string',
                                            example: 'admin@sistema.com'
                                        },
                                        rol: {
                                            type: 'string',
                                            example: 'administrador'
                                        },
                                        rolData: {
                                            type: 'object',
                                            description: 'Información específica del rol'
                                        }
                                    }
                                },
                                accessToken: {
                                    type: 'string',
                                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                },
                                refreshToken: {
                                    type: 'string',
                                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                }
                            }
                        }
                    }
                },
                RefreshToken: {
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                        refreshToken: {
                            type: 'string',
                            description: 'Token de renovación',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Mensaje de error'
                        },
                        error: {
                            type: 'string',
                            example: 'Detalle del error'
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Autenticación',
                description: 'Endpoints para registro, login y gestión de tokens'
            },
            {
                name: 'Usuarios',
                description: 'Endpoints para gestión de usuarios'
            }
        ]
    },
    apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Event Planner API Documentation'
    }));

    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
};

module.exports = setupSwagger;
