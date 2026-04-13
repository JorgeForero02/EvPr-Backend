require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./models');

const crearAdministrador = async () => {
    try {
        const datosAdmin = {
            nombre: 'Admin',
            cedula: '1234567890',
            telefono: '1234567890',
            correo: 'admin@sistema.com',
            contraseña: 'Admin123!'
        };

        // Verificar si ya existe el correo
        const existeCorreo = await db.Usuario.findOne({
            where: { correo: datosAdmin.correo }
        });

        if (existeCorreo) {
            process.exit(1);
        }

        const existeCedula = await db.Usuario.findOne({
            where: { cedula: datosAdmin.cedula }
        });

        if (existeCedula) {
            process.exit(1);
        }

        const salt = await bcrypt.genSalt(10);
        const contraseñaHash = await bcrypt.hash(datosAdmin.contraseña, salt);

        const nuevoUsuario = await db.Usuario.create({
            nombre: datosAdmin.nombre,
            cedula: datosAdmin.cedula,
            telefono: datosAdmin.telefono,
            correo: datosAdmin.correo,
            contraseña: contraseñaHash
        });

        const nuevoAdmin = await db.Administrador.create({
            id_usuario: nuevoUsuario.id
        });

        process.exit(0);

    } catch (error) {
        console.error('\n ERROR AL CREAR ADMINISTRADOR:');
        console.error('   Mensaje:', error.message);
        if (error.errors) {
            console.error('   Detalles de validación:');
            error.errors.forEach(err => {
                console.error('    -', err.message);
            });
        }
        console.error('\n');
        process.exit(1);
    }
};

db.sequelize.sync().then(() => {
    crearAdministrador();
}).catch(error => {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    process.exit(1);
});
