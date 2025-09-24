const express = require('express');
const router = express.Router();
// ¡Importante! Asegúrate de que apunte al controlador que acabamos de crear.
const translateController = require('./translate.controller');

// Define la ruta POST /api/translate/
router.post('/', translateController.translateText);

module.exports = router;