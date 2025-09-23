const Tesseract = require('tesseract.js');
const franc = require('franc');
const sharp = require('sharp');
const fs = require('fs');

const SUPPORTED_LANGUAGES = {
  que: "Quechua",
  spa: "Español",
  eng: "Inglés"
};

// Palabras clave propias del quechua para heurística
const QUECHUA_WORDS = [
  'llaqta', 'tayta', 'sapa', 'kashani', 'amauta', 'wasi', 'munay', 'kanki', 'qosqo',
  'apu', 'wasiyki', 'llakikuy', 'yachay', 'sonqoy', 'kuyay', 'qhapaq', 'sumaq',
  'riqsiy', 'mikhuy', 'tinkuy', 'llankay', 'llamk', 'qelqa', 'tupay', 'yachachiq'
];

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

    // Limpieza avanzada del texto para mejorar la detección
    const cleanText = text
      .normalize('NFD') // quita tildes
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\n\r]+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .toLowerCase()
      .trim();

    // Heurística: contar palabras clave de quechua
    const quechuaWordsCount = QUECHUA_WORDS.filter(w => cleanText.includes(w)).length;

    let detectedLang = 'und';
    let francResults = [];
    let confidenceMsg = "";
    const only = ['que', 'spa', 'eng'];

    if (cleanText.length >= 20) {
      francResults = franc.all(cleanText, { only });

      // Si hay suficientes palabras quechua, forzar a quechua
      if (quechuaWordsCount >= 2) {
        detectedLang = 'que';
        confidenceMsg = "Detectadas varias palabras quechua, forzando idioma Quechua.";
      } else {
        detectedLang = francResults[0][0];
        // Advierte si la detección no es confiable
        if (francResults.length > 1) {
          const diff = francResults[0][1] - francResults[1][1];
          if (francResults[0][1] < 0.5 || diff < 0.13) {
            confidenceMsg = "Advertencia: la detección de idioma es poco confiable.";
          }
        }
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
      quechuaWordsCount
    });
  } catch (error) {
    res.status(500).json({ error: "OCR processing failed.", details: error.message });
  }
};