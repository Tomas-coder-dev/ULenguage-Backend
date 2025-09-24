const express = require('express');
const { executeSeed } = require('../controllers/seedController');

const router = express.Router();

router.post('/', executeSeed);

module.exports = router;