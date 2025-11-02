const { translateTextHybridDetailed, translateTextHybrid } = require('./translator');

exports.translateText = async (req, res) => {
  const { text, source, target } = req.body;
  if (!text || !source || !target) {
    return res.status(400).json({ message: "Faltan parámetros: 'text', 'source', 'target'." });
  }

  try {
    // Use detailed flow so frontend can show source/candidates
    const result = await translateTextHybridDetailed(text, source, target);
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
    console.error('[Translate][ERROR]', error);
    // fallback to legacy behavior
    try {
      const translatedText = await translateTextHybrid(text, source, target);
      return res.json({ 
        originalText: text, 
        translatedText, 
        sourceLanguage: source, 
        targetLanguage: target, 
        provider: 'fallback' 
      });
    } catch (err) {
      console.error('[Translate][Fallback][ERROR]', err);
      return res.status(500).json({ message: 'Error al traducir texto. Intenta nuevamente.' });
    }
  }
};