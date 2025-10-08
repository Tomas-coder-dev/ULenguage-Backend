const { processImageForCulture, processAndTranslate } = require('./ocr.service');
const fs = require('fs');

/**
 * Endpoint que usa Google Vision y Gemini, con idioma elegible.
 */
exports.analyzeAndExplain = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se subió ninguna imagen." });
  }

  const imagePath = req.file.path;
  const targetLang = (req.body.targetLang || 'es').trim();

  try {
    const result = await processImageForCulture(imagePath, targetLang);
    res.json(result);
  } catch (error) {
    console.error("Error en analyzeAndExplain:", error);
    res.status(500).json({ error: "El análisis falló.", details: error.message });
  } finally {
    fs.unlink(imagePath, () => {});
  }
};

/**
 * Endpoint que usa Google Vision, Gemini y el Traductor explícito.
 */
exports.analyzeExplainAndTranslate = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No se subió ninguna imagen." });
    }

    const imagePath = req.file.path;
    const targetLang = (req.body.targetLang || 'es').trim();

    try {
        const result = await processAndTranslate(imagePath, targetLang);
        res.json(result);
    } catch (error) {
        console.error("Error en analyzeExplainAndTranslate:", error);
        res.status(500).json({ error: "El análisis y traducción falló.", details: error.message });
    } finally {
        fs.unlink(imagePath, () => {});
    }
};