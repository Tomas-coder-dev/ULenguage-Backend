const Tesseract = require('tesseract.js');
const sharp = require('sharp');

// Import franc dinamically to handle ES module
let franc;
try {
  franc = require('franc').franc;
} catch (error) {
  // Fallback for testing or when franc is not available
  franc = (text) => 'spa'; // Default to Spanish
}
const fs = require('fs');

// IMPORTA LAS LISTAS DESDE wordlists.js
const { QUECHUA_WORDS, ENGLISH_WORDS } = require('./wordlists');

const SUPPORTED_LANGUAGES = {
  que: "Quechua",
  spa: "Español",
  eng: "Inglés"
};

exports.extractText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded." });
    }
    const lang = req.query.lang || 'spa';
    if (!['spa', 'eng', 'que'].includes(lang)) {
      return res.status(400).json({ error: "Unsupported language. Use 'spa', 'eng', or 'que'." });
    }

    const processedPath = `${req.file.path}_processed.png`;
    await sharp(req.file.path)
      .grayscale()
      .normalize()
      .toFile(processedPath);

    const { data: { text } } = await Tesseract.recognize(
      processedPath,
      lang,
      {
        langPath: './tessdata',
        gzip: false
      }
    );

    fs.unlink(processedPath, () => {});

    res.json({
      text,
      lang,
      langName: SUPPORTED_LANGUAGES[lang] || "Desconocido"
    });
  } catch (error) {
    res.status(500).json({ error: "OCR processing failed.", details: error.message });
  }
};

exports.extractTextAutoLang = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded." });
    }

    const processedPath = `${req.file.path}_processed.png`;
    await sharp(req.file.path)
      .grayscale()
      .normalize()
      .toFile(processedPath);

    // Primer OCR en español para obtener texto base
    const { data: { text } } = await Tesseract.recognize(
      processedPath,
      'spa',
      {
        langPath: './tessdata',
        gzip: false
      }
    );

    // Limpieza avanzada del texto para mejor detección
    const cleanText = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\n\r]+/g, ' ')
      .replace(/[^a-zA-Z\s]/g, '')
      .toLowerCase()
      .trim();

    // Heurística usando las listas externas
    const quechuaWordsCount = QUECHUA_WORDS.filter(w => cleanText.includes(w)).length;
    const englishWordsCount = ENGLISH_WORDS.filter(w => cleanText.includes(w)).length;

    let detectedLang = 'und';
    let francResults = [];
    let confidenceMsg = "";
    const only = ['que', 'spa', 'eng'];

    if (cleanText.length >= 20) {
      const francLang = franc(cleanText, { only });
      francResults = francLang ? [[francLang, 1]] : [];

      // Heurística: Forzar Quechua o Inglés si hay suficientes palabras clave
      if (quechuaWordsCount >= 2) {
        detectedLang = 'que';
        confidenceMsg = "Detectadas varias palabras quechua, forzando idioma Quechua.";
      } else if (englishWordsCount >= 2) {
        detectedLang = 'eng';
        confidenceMsg = "Detectadas varias palabras en inglés, forzando idioma Inglés.";
      } else {
        detectedLang = francLang || 'und';
        // En la versión moderna de franc no hay puntaje/ranking
      }
    } else {
      confidenceMsg = "Texto demasiado corto para detectar idioma de forma confiable.";
    }

    // Si detectó quechua o inglés, rehace OCR con ese idioma
    let finalText = text;
    if (detectedLang !== 'spa' && detectedLang !== 'und') {
      const { data: { text: newText } } = await Tesseract.recognize(
        processedPath,
        detectedLang,
        {
          langPath: './tessdata',
          gzip: false
        }
      );
      finalText = newText;
    }

    fs.unlink(processedPath, () => {});

    res.json({
      text: finalText,
      detectedLang,
      detectedLangName: SUPPORTED_LANGUAGES[detectedLang] || "Desconocido",
      francRanking: francResults.map(([lang, score]) => ({
        lang,
        langName: SUPPORTED_LANGUAGES[lang] || lang,
        score
      })),
      confidenceMsg,
      quechuaWordsCount,
      englishWordsCount
    });
  } catch (error) {
    res.status(500).json({ error: "OCR processing failed.", details: error.message });
  }
};