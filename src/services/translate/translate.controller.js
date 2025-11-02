const { translateTextHybridDetailed, translateTextHybrid } = require('./translate/translator');

exports.translateText = async (req, res) => {
  const { text, source, target } = req.body;
  if (!text || !source || !target) {
    return res.status(400).json({ error: "Faltan parámetros: 'text', 'source', 'target'." });
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
    console.error('translate.controller error:', error);
    // fallback to legacy behavior
    try {
      const translatedText = await translateTextHybrid(text, source, target);
      return res.json({ originalText: text, translatedText, sourceLanguage: source, targetLanguage: target, provider: 'fallback' });
    } catch (err) {
      return res.status(500).json({ error: "Error durante la traducción.", details: err.message || error.message });
    }
  }
};