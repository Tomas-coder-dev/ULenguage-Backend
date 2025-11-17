const express = require('express');
const { getPlaces, getPlaceDetailsEndpoint } = require('./explorer.controller');
const router = express.Router();

router.get('/', getPlaces);      // Listar lugares turísticos de Cusco (acepta ?types=..., ?details=true)
router.get('/details', getPlaceDetailsEndpoint); // Obtener detalles on-demand ?place_id=xxx or ?source=db&id=...

module.exports = router;