const { translateTextHybrid } = require('./translator');

exports.translateText = async (req, res) => {
  const { text, source, target } = req.body;
  if (!text || !source || !target) {
    return res.status(400).json({ error: "Faltan parámetros: 'text', 'source', 'target'." });
  }

  try {
    const translatedText = await translateTextHybrid(text, source, target);
    res.json({
      originalText: text,
      translatedText,
      sourceLanguage: source,
      targetLanguage: target
    });
  } catch (error) {
    res.status(500).json({ error: "Error durante la traducción.", details: error.message });
  }
};