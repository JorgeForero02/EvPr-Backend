const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const setupSwagger = require('./config/swagger');
const { programarRecordatorios } = require('./cron/recordatorios.cron');

const db = require('./models');
const routes = require('./routes');
const errorHandler = require('./middlewares/error');

const app = express();

setupSwagger(app);


app.use(helmet());

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

programarRecordatorios();

app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Event Planner API',
    version: '1.0.0'
  });
});

app.use('/api', routes);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

db.sequelize.authenticate()
  .then(() => {
    console.log('Conexión a la base de datos establecida');
    
    if (process.env.NODE_ENV !== 'production') {

      return db.sequelize.sync();
    }
  })
  .then(() => {
    console.log('Modelos sincronizados');
    
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
      console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`Documentación Swagger disponible en http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(err => {
    console.error('Error:', err);
  });
