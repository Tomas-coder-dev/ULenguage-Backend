const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const planRoutes = require('./routes/planRoutes');
const seedRoutes = require('./routes/seedRoutes');
const ocrRoutes = require('./services/ocr/ocr.routes');
const translateRoutes = require('./services/translate/translate.routes');

dotenv.config();
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:3000', // Solo para Flutter web
  credentials: true
}));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/planes', planRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/translate', translateRoutes);

// Swagger documentation
try {
  const swaggerDocument = yaml.load(path.join(__dirname, '../docs/swagger.yaml'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  console.warn('⚠️  No se pudo cargar Swagger documentation');
}

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'ULenguage Backend v1.0.0 - Sprint 1',
    status: 'Funcionando correctamente',
    endpoints: {
      auth: '/api/auth',
      planes: '/api/planes',
      seed: '/api/seed',
      ocr: '/api/ocr',
      translate: '/api/translate',
      docs: '/api/docs'
    }
  });
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  res.status(500).json({ 
    message: 'Error interno del servidor' 
  });
});

module.exports = app;
