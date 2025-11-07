const express = require('express');
const router = express.Router();
const QuechuaCusqueno = require('../../models/QuechuaCusqueno');

// Agregar término a la BD
router.post('/add', async (req, res) => {
  const { spanish, quechua_cusqueno, context, category, examples } = req.body;
  if (!spanish || !quechua_cusqueno) {

    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }
  const spanishNorm = spanish.trim().toLowerCase();
  try {
    // Verifica duplicado
    const exists = await QuechuaCusqueno.findOne({ spanish: spanishNorm });
    if (exists) {

      return res.status(409).json({ message: 'El término ya existe.' });
    }
    const term = await QuechuaCusqueno.create({ 
      spanish: spanishNorm, 
      quechua_cusqueno, 
      context, 
      category, 
      examples 
    });
    res.json(term);
  } catch (error) {
    console.error('[Quechua][Add][ERROR]', error);
    res.status(500).json({ message: 'Error al agregar término. Intenta nuevamente.' });
  }
});

// Consultar término por español
router.get('/search', async (req, res) => {
  const { spanish } = req.query;
  if (!spanish) {
    return res.status(400).json({ message: "Parámetro 'spanish' requerido" });
  }
  const spanishNorm = spanish.trim().toLowerCase();
  try {
    const term = await QuechuaCusqueno.findOne({ spanish: spanishNorm });
    if (term) return res.json(term);

    res.status(404).json({ message: 'Término no encontrado' });
  } catch (error) {
    console.error('[Quechua][Search][ERROR]', error);
    res.status(500).json({ message: 'Error al buscar término. Intenta nuevamente.' });
  }
});

// Listar todos los términos (opcional)
router.get('/all', async (req, res) => {
  try {
    const terms = await QuechuaCusqueno.find();
    res.json(terms);
  } catch (error) {
    console.error('[Quechua][All][ERROR]', error);
    res.status(500).json({ message: 'Error al obtener términos. Intenta nuevamente.' });
  }
});

module.exports = router;