const cron = require('node-cron');
const { Actividad, Evento, PonenteActividad, Ponente, Usuario } = require('../models');
const notificacionService = require('../services/notificacion.service');
const { Op } = require('sequelize');

const programarRecordatorios = () => {
    cron.schedule('0 8 * * *', async () => {
        console.log('Ejecutando recordatorios de actividades...');

        try {
            const transaction = await notificacionService.crearTransaccion();

            try {
                // Calcular fecha de mañana
                const manana = new Date();
                manana.setDate(manana.getDate() + 1);
                manana.setHours(0, 0, 0, 0);

                const pasadoManana = new Date(manana);
                pasadoManana.setDate(pasadoManana.getDate() + 1);

                // Buscar actividades para mañana
                const actividadesProximas = await Actividad.findAll({
                    where: {
                        fecha_actividad: {
                            [Op.gte]: manana,
                            [Op.lt]: pasadoManana
                        }
                    },
                    include: [
                        {
                            model: Evento,
                            as: 'evento',
                            attributes: ['id', 'titulo', 'estado']
                        }
                    ]
                });

                // Por cada actividad, notificar a sus ponentes
                for (const actividad of actividadesProximas) {
                    const ponentesActividad = await PonenteActividad.findAll({
                        where: {
                            id_actividad: actividad.id_actividad,
                            estado: 'aceptado'
                        },
                        include: [
                            {
                                model: Ponente,
                                as: 'ponente',
                                include: [
                                    {
                                        model: Usuario,
                                        as: 'usuario',
                                        attributes: ['id', 'nombre', 'correo']
                                    }
                                ]
                            }
                        ]
                    });

                    for (const pa of ponentesActividad) {
                        await notificacionService.crearNotificacionRecordatorioActividad({
                            actividad: actividad.toJSON(),
                            evento: actividad.evento.toJSON(),
                            ponente: {
                                ...pa.ponente.toJSON(),
                                id_usuario: pa.ponente.usuario.id
                            }
                        }, transaction);
                    }
                }

                await transaction.commit();
                console.log(`Recordatorios enviados para ${actividadesProximas.length} actividades`);
            } catch (error) {
                await transaction.rollback();
                console.error('Error al enviar recordatorios:', error);
            }
        } catch (error) {
            console.error('Error al crear transacción:', error);
        }
    }, {
        timezone: 'America/Bogota'
    });

    console.log('Cron de recordatorios programado');
};

module.exports = { programarRecordatorios };
