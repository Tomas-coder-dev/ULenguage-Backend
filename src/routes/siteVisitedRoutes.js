const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  recordSiteVisit, 
  getVisitedSites, 
  getVisitCount 
} = require('../controllers/siteVisitedController');

// Rutas de sitios visitados
router.post('/visit', protect, recordSiteVisit);
router.get('/visited', protect, getVisitedSites);
router.get('/count', protect, getVisitCount);

module.exports = router;
