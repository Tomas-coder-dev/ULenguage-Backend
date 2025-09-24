const { translateTextGoogle } = require('./translator');

exports.translateText = async (req, res) => {
  const { text, target } = req.body;
  // El idioma de origen ("source") es opcional con la API de Google, lo detecta solo.

  if (!text || !target) {
    return res.status(400).json({ error: "Faltan parámetros: se requiere 'text' y 'target'." });
  }

  try {
    const translatedText = await translateTextGoogle(text, target);
    
    res.json({
      originalText: text,
      translatedText,
      targetLanguage: target
    });
  } catch (error) {
    res.status(500).json({ error: "Error durante la traducción.", details: error.message });
  }
};