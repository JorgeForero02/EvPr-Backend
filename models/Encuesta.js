const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Encuesta = sequelize.define('Encuesta', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    titulo: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            len: {
                args: [3, 200],
                msg: 'El título debe tener entre 3 y 200 caracteres'
            }
        }
    },
    tipo_encuesta: {
        type: DataTypes.ENUM('pre_actividad', 'durante_actividad', 'post_actividad', 'satisfaccion_evento'),
        allowNull: false,
        validate: {
            isIn: {
                args: [['pre_actividad', 'durante_actividad', 'post_actividad', 'satisfaccion_evento']],
                msg: 'El tipo de encuesta debe ser válido'
            }
        }
    },
    momento: {
        type: DataTypes.ENUM('antes', 'durante', 'despues'),
        allowNull: false,
        validate: {
            isIn: {
                args: [['antes', 'durante', 'despues']],
                msg: 'El momento debe ser: antes, durante o despues'
            }
        }
    },
    url_google_form: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
            isUrl: {
                msg: 'La URL del formulario debe ser válida'
            }
        }
    },
    url_respuestas: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            isUrl: {
                msg: 'La URL de respuestas debe ser válida'
            }
        }
    },
    estado: {
        type: DataTypes.ENUM('activa', 'cerrada', 'borrador'),
        allowNull: false,
        defaultValue: 'borrador'
    },
    fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: {
                msg: 'La fecha de inicio debe ser una fecha válida'
            }
        }
    },
    fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: {
                msg: 'La fecha de fin debe ser una fecha válida'
            }
        }
    },
    id_evento: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Evento',
            key: 'id'
        },
        onDelete: 'RESTRICT',  
        onUpdate: 'CASCADE'     
    },
    id_actividad: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Actividad',
            key: 'id_actividad'
        },
        onDelete: 'RESTRICT',  
        onUpdate: 'CASCADE'    
    },
    obligatoria: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    habilitada_para_ponente: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    es_encuesta_rapida: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    tipo_creador: {
        type: DataTypes.ENUM('organizador', 'ponente'),
        allowNull: true,
        defaultValue: 'organizador'
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Encuesta',
    timestamps: false
});

module.exports = Encuesta;
