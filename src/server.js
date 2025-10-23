const express = require('express');
const cors = require('cors');

// Importa tus rutas
const ocrRoutes = require('./services/ocr/ocr.routes');
const translateRoutes = require('./services/translate/translate.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas principales de la API
app.get('/api', (req, res) => {
  res.json({ message: '¡Bienvenido a la API de Ulenguage!' });
});

// Usa tus módulos de rutas
app.use('/api/ocr', ocrRoutes);
app.use('/api/translate', translateRoutes);

module.exports = app;