'use strict';
/**
 * src/routes/commonPhrasesRoutes.js
 * 
 * Rutas para frases comunes/útiles
 */

const express = require('express');
const router = express.Router();
const {
  getCommonPhrases,
  getPhrasesByCategory,
  incrementPhraseUsage,
  getPopularPhrases
} = require('../controllers/commonPhrasesController');

// GET /api/phrases/common - Obtener todas las frases agrupadas
router.get('/common', getCommonPhrases);

// GET /api/phrases/popular - Obtener frases más usadas
router.get('/popular', getPopularPhrases);

// GET /api/phrases/common/:category - Obtener frases de una categoría
router.get('/common/:category', getPhrasesByCategory);

// POST /api/phrases/usage - Registrar uso de una frase
router.post('/usage', incrementPhraseUsage);

module.exports = router;
