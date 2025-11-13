const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  recordTranslation,
  getWeeklyScore,
  getTranslationHistory
} = require('../controllers/translationController');

// Rutas de traducciones
router.post('/', protect, recordTranslation);
router.get('/weekly-score', protect, getWeeklyScore);
router.get('/history', protect, getTranslationHistory);

module.exports = router;