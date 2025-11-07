'use strict';
/**
 * src/controllers/commonPhrasesController.js
 * 
 * Controlador para frases comunes/útiles multi-idioma
 */

const CommonPhrase = require('../models/CommonPhrase');

/**
 * GET /api/phrases/common
 * Obtiene todas las frases comunes agrupadas por categoría
 */
exports.getCommonPhrases = async (req, res) => {
  try {
    console.log('[📝 PHRASES] Solicitando frases comunes...');
    
    const phrases = await CommonPhrase.getActivePhrasesGrouped();
    
    console.log(`[✅ PHRASES] ${phrases.length} categorías encontradas`);
    
    return res.json({
      success: true,
      count: phrases.length,
      data: phrases
    });
  } catch (error) {
    console.error('[❌ PHRASES] Error al obtener frases:', error.message);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener frases comunes' 
    });
  }
};

/**
 * GET /api/phrases/common/:category
 * Obtiene frases de una categoría específica
 */
exports.getPhrasesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    console.log(`[📝 PHRASES] Buscando frases de categoría: ${category}`);
    
    const categoryData = await CommonPhrase.findOne({ 
      category: category.toLowerCase(), 
      isActive: true 
    }).lean();
    
    if (!categoryData) {
      return res.status(404).json({ 
        success: false,
        message: `Categoría '${category}' no encontrada` 
      });
    }
    
    console.log(`[✅ PHRASES] ${categoryData.phrases.length} frases encontradas`);
    
    return res.json({
      success: true,
      data: categoryData
    });
  } catch (error) {
    console.error('[❌ PHRASES] Error al obtener categoría:', error.message);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener frases de la categoría' 
    });
  }
};

/**
 * POST /api/phrases/usage
 * Incrementa el contador de uso de una frase
 * Body: { categoryId, phraseIndex }
 */
exports.incrementPhraseUsage = async (req, res) => {
  try {
    const { categoryId, phraseIndex } = req.body;
    
    if (!categoryId || phraseIndex === undefined) {
      return res.status(400).json({ 
        success: false,
        message: 'Faltan parámetros: categoryId y phraseIndex son requeridos' 
      });
    }
    
    console.log(`[📊 PHRASES] Incrementando uso: categoría ${categoryId}, frase ${phraseIndex}`);
    
    const updated = await CommonPhrase.incrementPhraseUsage(categoryId, phraseIndex);
    
    if (!updated) {
      return res.status(404).json({ 
        success: false,
        message: 'Categoría no encontrada' 
      });
    }
    
    console.log(`[✅ PHRASES] Uso incrementado correctamente`);
    
    return res.json({
      success: true,
      message: 'Uso registrado',
      data: updated
    });
  } catch (error) {
    console.error('[❌ PHRASES] Error al incrementar uso:', error.message);
    return res.status(500).json({ 
      success: false,
      message: 'Error al registrar uso de la frase' 
    });
  }
};

/**
 * GET /api/phrases/popular
 * Obtiene las frases más usadas (top N)
 */
exports.getPopularPhrases = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    console.log(`[🔥 PHRASES] Buscando top ${limit} frases populares...`);
    
    const categories = await CommonPhrase.find({ isActive: true }).lean();
    
    // Aplanar todas las frases con metadata de categoría
    const allPhrases = [];
    categories.forEach(cat => {
      cat.phrases.forEach((phrase, idx) => {
        if (phrase.isActive) {
          allPhrases.push({
            ...phrase,
            categoryName: cat.category,
            categoryIcon: cat.icon,
            categoryColor: cat.color,
            phraseIndex: idx
          });
        }
      });
    });
    
    // Ordenar por uso y tomar top N
    const topPhrases = allPhrases
      .sort((a, b) => b.usage - a.usage)
      .slice(0, limit);
    
    console.log(`[✅ PHRASES] ${topPhrases.length} frases populares encontradas`);
    
    return res.json({
      success: true,
      count: topPhrases.length,
      data: topPhrases
    });
  } catch (error) {
    console.error('[❌ PHRASES] Error al obtener frases populares:', error.message);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener frases populares' 
    });
  }
};
