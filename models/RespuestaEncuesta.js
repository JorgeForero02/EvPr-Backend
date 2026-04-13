const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RespuestaEncuesta = sequelize.define('RespuestaEncuesta', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_encuesta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Encuesta',
            key: 'id'
        }
    },
    id_asistente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Asistente',
            key: 'id_asistente'
        }
    },
    fecha_envio: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    fecha_completado: {
        type: DataTypes.DATE,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'completada', 'expirada'),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: {
                args: [['pendiente', 'completada', 'expirada']],
                msg: 'El estado debe ser: pendiente, completada o expirada'
            }
        }
    },
    token_acceso: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: false,
        validate: {
            len: {
                args: [20, 100],
                msg: 'El token debe tener entre 20 y 100 caracteres'
            }
        }
    }
}, {
    tableName: 'RespuestaEncuesta',
    timestamps: false,
    indexes: [
        {
            name: 'idx_token',
            fields: ['token_acceso']
        },
        {
            name: 'idx_encuesta_asistente',
            fields: ['id_encuesta', 'id_asistente']
        }
    ]
});

module.exports = RespuestaEncuesta;
