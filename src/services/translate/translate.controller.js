const { translateTextHybridDetailed, translateTextHybrid } = require('./translator');

exports.translateText = async (req, res) => {
  const { text, source, target } = req.body;
  
  console.log(`[🌐 TRANSLATE] Nueva solicitud de traducción: ${source} → ${target}`);
  
  if (!text || !source || !target) {
    console.log('[❌ TRANSLATE] Faltan parámetros requeridos');
    return res.status(400).json({ message: "Faltan parámetros: 'text', 'source', 'target'." });
  }

  console.log(`[🔍 TRANSLATE] Texto a traducir: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

  try {
    // Use detailed flow so frontend can show source/candidates
    const result = await translateTextHybridDetailed(text, source, target);
    console.log(`[✅ TRANSLATE] Traducción exitosa | Provider: ${result.source} | Variante: ${result.variantUsed || 'N/A'}`);
    // result: { translation, source, candidates, variantUsed }
    return res.json({
      originalText: text,
      translatedText: result.translation,
      sourceLanguage: source,
      targetLanguage: target,
      provider: result.source,
      candidates: result.candidates,
      variantUsed: result.variantUsed
    });
  } catch (error) {
    console.error('[❌ TRANSLATE] Error principal:', error.message);
    // fallback to legacy behavior
    try {
      console.log('[⚠️ TRANSLATE] Intentando método de fallback...');
      const translatedText = await translateTextHybrid(text, source, target);
      console.log('[✅ TRANSLATE] Traducción exitosa con fallback');
      return res.json({ 
        originalText: text, 
        translatedText, 
        sourceLanguage: source, 
        targetLanguage: target, 
        provider: 'fallback' 
      });
    } catch (err) {
      console.error('[❌ TRANSLATE] Error en fallback:', err.message);
      return res.status(500).json({ message: 'Error al traducir texto. Intenta nuevamente.' });
    }
  }
};