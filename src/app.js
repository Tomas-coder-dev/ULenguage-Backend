const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');

// LOGS DE DIAGNÓSTICO
console.log('Iniciando ULenguage Backend...');

dotenv.config();
console.log('Variables de entorno cargadas.');

// Conexión a la base de datos con manejo de errores
let dbConnected = false;
try {
  require('./config/db')();
  dbConnected = true;
  console.log('Base de datos conectada exitosamente.');
} catch (e) {
  console.error('❌ Error conectando a la base de datos:', e);
}

const authRoutes = require('./routes/authRoutes');
const planRoutes = require('./routes/planRoutes');
const seedRoutes = require('./routes/seedRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const ocrRoutes = require('./services/ocr/ocr.routes');
const translateRoutes = require('./services/translate/translate.routes');
const quechuaRoutes = require('./services/translate/quechua.routes');

// Inicializa la app
const app = express();

// Middleware para archivos estáticos (favicon, etc)
app.use(express.static(path.join(__dirname, '../public')));

// Middlewares generales
app.use(cors({
  origin: process.env.URL_FRONTEND || 'http://localhost:3000', // Solo para Flutter web
  credentials: true
}));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/planes', planRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/quechua', quechuaRoutes);

// Swagger documentation
try {
  const swaggerDocument = yaml.load(path.join(__dirname, '../docs/swagger.yaml'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('Swagger documentation cargada.');
} catch (error) {
  console.warn('⚠️  No se pudo cargar Swagger documentation', error);
}

// Ruta principal
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
      ocr: '/api/ocr',
      translate: '/api/translate',
      quechua: '/api/quechua',
      docs: '/api/docs'
    }
  });
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
  console.error('Error middleware:', error);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: error.message
  });
});

module.exports = app;