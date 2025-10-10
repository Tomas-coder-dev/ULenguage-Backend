const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const {
  unlockAchievement,
  syncOfflineAchievements,
  getUserAchievements,
  getNearbyZones,
  getAllZones
} = require('../controllers/achievementController');

// Rutas de achievements (requieren autenticación)
router.post('/unlock', protect, unlockAchievement);
router.post('/sync', protect, syncOfflineAchievements);
router.get('/me', protect, getUserAchievements);

// Rutas de zonas (públicas)
router.get('/zones/nearby', getNearbyZones);
router.get('/zones', getAllZones);

module.exports = router;
