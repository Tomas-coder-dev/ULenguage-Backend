const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const { getUserStats } = require('../controllers/userStatsController');

// Ruta para obtener estadísticas del usuario (requiere autenticación)
router.get('/stats', protect, getUserStats);

module.exports = router;
