const Tesseract = require('tesseract.js');
const franc = require('franc').franc;
const sharp = require('sharp');
const fs = require('fs');
const axios = require('axios'); // <-- Asegúrate de tener axios instalado

// IMPORTA LAS LISTAS DESDE wordlists.js
const { QUECHUA_WORDS, ENGLISH_WORDS } = require('./wordlists');

const SUPPORTED_LANGUAGES = {
  que: "Quechua",
  qu:  "Quechua",
  spa: "Español",
  eng: "Inglés"
};

exports.extractText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded." });
    }
    const lang = req.query.lang || 'spa';
    if (!['spa', 'eng', 'que', 'qu'].includes(lang)) {
      return res.status(400).json({ error: "Unsupported language. Use 'spa', 'eng', or 'que'." });
    }

    // Cambiar a 'qu' si es quechua, por compatibilidad futura
    const tessLang = lang === 'que' ? 'qu' : lang;

    const processedPath = `${req.file.path}_processed.png`;
    await sharp(req.file.path)
      .grayscale()
      .normalize()
      .toFile(processedPath);

    const { data: { text } } = await Tesseract.recognize(
      processedPath,
      tessLang,
      {
        langPath: './tessdata',
        gzip: false
      }
    );

    fs.unlink(processedPath, () => {});

    res.json({
      text,
      lang: tessLang,
      langName: SUPPORTED_LANGUAGES[tessLang] || "Desconocido"
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
      }
    } else {
      confidenceMsg = "Texto demasiado corto para detectar idioma de forma confiable.";
    }

    // Si detectó quechua o inglés, rehace OCR con ese idioma
    let finalText = text;
    let tessDetectedLang = detectedLang === 'que' ? 'qu' : detectedLang;
    if (tessDetectedLang !== 'spa' && tessDetectedLang !== 'und') {
      const { data: { text: newText } } = await Tesseract.recognize(
        processedPath,
        tessDetectedLang,
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
      detectedLang: tessDetectedLang,
      detectedLangName: SUPPORTED_LANGUAGES[tessDetectedLang] || "Desconocido",
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

// OCR + autodetección + traducción automática
exports.extractTextAndTranslate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded." });
    }
    const target = req.body.target || req.query.target || 'es'; // idioma destino

    // Corrige el target si es 'que' a 'qu' (Google Translate y APIs estándar)
    let fixedTarget = target === 'que' ? 'qu' : target;

    // 1. Preprocesamiento de imagen
    const processedPath = `${req.file.path}_processed.png`;
    await sharp(req.file.path)
      .grayscale()
      .normalize()
      .toFile(processedPath);

    // 2. OCR inicial en español
    const { data: { text } } = await Tesseract.recognize(
      processedPath,
      'spa',
      {
        langPath: './tessdata',
        gzip: false
      }
    );

    // 3. Detección de idioma
    const cleanText = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\n\r]+/g, ' ')
      .replace(/[^a-zA-Z\s]/g, '')
      .toLowerCase()
      .trim();

    const quechuaWordsCount = QUECHUA_WORDS.filter(w => cleanText.includes(w)).length;
    const englishWordsCount = ENGLISH_WORDS.filter(w => cleanText.includes(w)).length;

    let detectedLang = 'und';
    const only = ['que', 'spa', 'eng'];

    if (cleanText.length >= 20) {
      const francLang = franc(cleanText, { only });
      if (quechuaWordsCount >= 2) {
        detectedLang = 'que';
      } else if (englishWordsCount >= 2) {
        detectedLang = 'eng';
      } else {
        detectedLang = francLang || 'und';
      }
    }

    // 4. Si detectó quechua o inglés, rehace OCR con ese idioma (usando 'qu' si es quechua)
    let finalText = text;
    let tessDetectedLang = detectedLang === 'que' ? 'qu' : detectedLang;
    if (tessDetectedLang !== 'spa' && tessDetectedLang !== 'und') {
      const { data: { text: newText } } = await Tesseract.recognize(
        processedPath,
        tessDetectedLang,
        {
          langPath: './tessdata',
          gzip: false
        }
      );
      finalText = newText;
    }

    fs.unlink(processedPath, () => {});

    // 5. Traducción automática (usa tu propio endpoint de traducción)
    let translatedText = "";
    try {
      const { data } = await axios.post('http://localhost:4000/api/translate', {
        text: finalText,
        target: fixedTarget
      });
      translatedText = data.translatedText || "";
    } catch (transError) {
      translatedText = "";
    }

    res.json({
      originalText: finalText,
      detectedLang: tessDetectedLang,
      detectedLangName: SUPPORTED_LANGUAGES[tessDetectedLang] || "Desconocido",
      translatedText,
      target: fixedTarget,
      quechuaWordsCount,
      englishWordsCount
    });
  } catch (error) {
    res.status(500).json({ error: "OCR+Traducción processing failed.", details: error.message });
  }
};