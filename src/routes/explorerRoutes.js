const express = require('express');
const router = express.Router();
const explorerController = require('../controllers/explorerController');

// GET /api/explorer
router.get('/', explorerController.getExplorerSites);

module.exports = router;
