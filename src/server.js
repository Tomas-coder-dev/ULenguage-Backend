const express = require('express');
const cors = require('cors');

// Importa tus rutas (¡RUTAS CORREGIDAS!)
// Como server.js está en 'src', ya no necesitamos poner 'src/' en la ruta.
const ocrRoutes = require('./services/ocr/ocr.routes');
const translateRoutes = require('./services/translate/translate.routes');

// Inicializa la aplicación
const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(cors()); // Permite peticiones desde otros orígenes
app.use(express.json()); // Permite al servidor entender JSON
app.use(express.urlencoded({ extended: true }));

// Rutas principales de la API
app.get('/api', (req, res) => {
  res.json({ message: '¡Bienvenido a la API de Ulenguage!' });
});

// Usa tus módulos de rutas
app.use('/api/ocr', ocrRoutes);
app.use('/api/translate', translateRoutes);

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});