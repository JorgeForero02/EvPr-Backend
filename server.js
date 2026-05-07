const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const setupSwagger = require('./config/swagger');
const { programarRecordatorios } = require('./cron/recordatorios.cron');

const db = require('./models');
const routes = require('./routes');
const errorHandler = require('./middlewares/error');

const app = express();

setupSwagger(app);


app.use(helmet());

const ALLOWED_ORIGINS = [
  'https://eventplanner.up.railway.app',
  'https://evpr-backend-production.up.railway.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Origen bloqueado: ${origin}`);
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    message: { success: false, message: 'Demasiadas solicitudes. Intenta en 1 minuto.' },
    standardHeaders: true,
    legacyHeaders: false
});

const limiterCreacion = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { success: false, message: 'Demasiadas solicitudes de creación. Intenta en 1 minuto.' },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api', limiter);
app.use('/api/eventos', limiterCreacion);
app.use('/api/inscripciones', limiterCreacion);

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

      //return db.sequelize.sync({ alter: true });
      return db.sequelize.sync({});
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
