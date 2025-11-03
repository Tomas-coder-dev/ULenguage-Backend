const express = require('express');
const router = express.Router();
const {
  getLatestNews,
  getNewsById,
  createNews
} = require('../controllers/newsController');

/**
 * Rutas públicas (sin autenticación)
 */

// GET /api/news?lang=es|en|qu&limit=3
router.get('/', getLatestNews);

// GET /api/news/:id
router.get('/:id', getNewsById);

/**
 * Rutas privadas (requieren autenticación - implementar en futuro)
 */

// POST /api/news (crear noticia - solo admin)
// router.post('/', protect, adminOnly, createNews);
router.post('/', createNews);

module.exports = router;
