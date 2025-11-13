const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getDashboardMetrics,
  getUsers,
  updateUser,
  deleteUser,
  getPlans,
  updatePlan,
  getNews,
  createNews,
  updateNews,
  deleteNews,
  getDictionary,
  createWord,
  updateWord,
  deleteWord,
  getAchievements,
  getZones,
  createZone,
  updateZone,
  deleteZone,
} = require('../controllers/adminController');

// Middleware para verificar rol admin (simple)
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
  }
};

// Dashboard
router.get('/metrics', protect, adminOnly, getDashboardMetrics);

// Usuarios
router.get('/users', protect, adminOnly, getUsers);
router.put('/users/:id', protect, adminOnly, updateUser);
router.delete('/users/:id', protect, adminOnly, deleteUser);

// Planes
router.get('/plans', protect, adminOnly, getPlans);
router.put('/plans/:id', protect, adminOnly, updatePlan);

// Noticias
router.get('/news', protect, adminOnly, getNews);
router.post('/news', protect, adminOnly, createNews);
router.put('/news/:id', protect, adminOnly, updateNews);
router.delete('/news/:id', protect, adminOnly, deleteNews);

// Diccionario Quechua
router.get('/dictionary', protect, adminOnly, getDictionary);
router.post('/dictionary', protect, adminOnly, createWord);
router.put('/dictionary/:id', protect, adminOnly, updateWord);
router.delete('/dictionary/:id', protect, adminOnly, deleteWord);

// Logros
router.get('/achievements', protect, adminOnly, getAchievements);

// Zonas
router.get('/zones', protect, adminOnly, getZones);
router.post('/zones', protect, adminOnly, createZone);
router.put('/zones/:id', protect, adminOnly, updateZone);
router.delete('/zones/:id', protect, adminOnly, deleteZone);

module.exports = router;
