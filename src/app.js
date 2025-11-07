const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');
const connectDB = require('./config/db');

console.log('Iniciando ULenguage Backend...');
dotenv.config();
console.log('Variables de entorno cargadas.');

let dbConnected = false;

const initializeDatabase = async () => {
  if (dbConnected) {
    return true;
  }

  try {
    await connectDB();
    dbConnected = true;
    console.log('Base de datos conectada exitosamente.');
    return true;
  } catch (error) {
    dbConnected = false;
    console.error('❌ Error conectando a la base de datos:', error);
    throw error;
  }
};

const authRoutes = require('./routes/authRoutes');
const planRoutes = require('./routes/planRoutes');
const seedRoutes = require('./routes/seedRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const userRoutes = require('./routes/userRoutes');
const newsRoutes = require('./routes/newsRoutes');
const commonPhrasesRoutes = require('./routes/commonPhrasesRoutes');
const ocrRoutes = require('./services/ocr/ocr.routes');
const translateRoutes = require('./services/translate/translate.routes');
const quechuaRoutes = require('./services/translate/quechua.routes');
const explorerRoutes = require('./services/explorer/explorer.routes');

const app = express();

app.use(express.static(path.join(__dirname, '../public')));

app.use(cors({
  origin: process.env.URL_FRONTEND || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Middleware de logging/auditoría
const logRequest = require('./middlewares/loggerMiddleware');
app.use(logRequest);

app.use('/api/auth', authRoutes);
app.use('/api/planes', planRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/phrases', commonPhrasesRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/quechua', quechuaRoutes);
app.use('/api/explorer', explorerRoutes);

try {
  const swaggerDocument = yaml.load(path.join(__dirname, '../docs/swagger.yaml'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('Swagger documentation cargada.');
} catch (error) {
  console.warn('⚠️  No se pudo cargar Swagger documentation', error);
}

app.get('/', (req, res) => {
  res.json({
    message: 'ULenguage Backend v1.0.0 - Sprint 1',
    status: dbConnected ? 'Funcionando correctamente' : 'Error conectando base de datos',
    endpoints: {
      auth: '/api/auth',
      planes: '/api/planes',
      seed: '/api/seed',
      achievements: '/api/achievements',
      zones: '/api/achievements/zones',
      users: '/api/users',
      news: '/api/news',
      phrases: '/api/phrases',
      ocr: '/api/ocr',
      translate: '/api/translate',
      quechua: '/api/quechua',
      explorer: '/api/explorer',
      docs: '/api/docs'
    }
  });
});

app.use((error, req, res, next) => {
  console.error('[ErrorMiddleware]', error);
  if (res.headersSent) {
    return next(error);
  }
  res.status(500).json({
    message: 'Error interno del servidor. Intenta nuevamente.'
  });
});

// === START SERVER WHEN EXECUTED DIRECTLY ===
// This ensures app.listen runs only when you execute `node src/app.js` (or `nodemon src/app.js`)
// and not when the module is required by tests or other scripts.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || '0.0.0.0'; // 0.0.0.0 allows other devices in LAN to connect

  initializeDatabase()
    .catch(() => {
      console.warn('⚠️  Servidor iniciando sin conexión a la base de datos.');
    })
    .finally(() => {
      app.listen(PORT, HOST, () => {
        console.log(`Server listening on http://${HOST}:${PORT}`);
      });
    });
}

module.exports = app;
module.exports.initializeDatabase = initializeDatabase;
module.exports.isDatabaseConnected = () => dbConnected;
