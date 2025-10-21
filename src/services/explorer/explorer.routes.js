const express = require('express');
const { getPlaces } = require('./explorer.controller');
const router = express.Router();

router.get('/', getPlaces);      // Listar lugares turísticos de Cusco

module.exports = router;