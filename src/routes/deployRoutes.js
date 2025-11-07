const express = require('express');
const router = express.Router();
const { deploy } = require('../controllers/deployController');

router.post('/deploy', deploy);

module.exports = router;
