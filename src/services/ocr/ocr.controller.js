const { processImageForCulture, processAndTranslate } = require('./ocr.service');
const fs = require('fs');

/** Parse a langs input which can be "es,en,qu" or ['es','en','qu'] */
function parseLangs(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(s => String(s).toLowerCase());
  if (typeof input === 'string') {
    return input
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

/**
 * POST /api/ocr/analyze
 * - multipart upload: file (image)
 * - optional body/query: targetLang (e.g. 'es'), langs (e.g. 'es,en,qu')
 *
 * Behavior:
 * - If client provides `langs`, we request precomputation for those langs.
 * - Otherwise we only request the single requestedLang to avoid extra LLM calls.
 */
exports.analyzeAndExplain = async (req, res) => {
  console.log('[📸 OCR] Iniciando análisis de imagen');
  
  if (!req.file || !req.file.path) {
    console.log('[❌ OCR] No se recibió archivo de imagen');
    return res.status(400).json({ message: 'No se subió ninguna imagen.' });
  }

  const imagePath = req.file.path;
  const targetLang = (req.body.targetLang || req.query.targetLang || 'es').trim().toLowerCase();

  console.log(`[🔍 OCR] Procesando imagen: ${req.file.originalname} | Idioma: ${targetLang}`);

  // If client explicitly provided langs, parse them; otherwise default to only targetLang
  const explicitLangs = req.body.langs || req.query.langs;
  const langsToReturn = explicitLangs ? parseLangs(explicitLangs) : [targetLang];

  try {
    const result = await processImageForCulture(imagePath, targetLang, langsToReturn);
    console.log(`[✅ OCR] Análisis completado exitosamente`);
    return res.json(result);
  } catch (error) {
    console.error('[❌ OCR] Error al analizar imagen:', error.message);
    return res.status(500).json({ message: 'Error al analizar imagen. Intenta nuevamente.' });
  } finally {
    // remove uploaded file (non-blocking). If you want to keep the file for debugging,
    // pass a flag like ?keepFile=1 from the client and check it here.
    fs.unlink(imagePath, () => {});
  }
};

/**
 * POST /api/ocr/analyze-and-translate
 * Alias for analyze+translate — kept for compatibility.
 * Delegates to processAndTranslate (currently an alias of processImageForCulture).
 */
exports.analyzeExplainAndTranslate = async (req, res) => {
  console.log('[📸 OCR] Iniciando análisis y traducción de imagen');
  
  if (!req.file || !req.file.path) {
    console.log('[❌ OCR] No se recibió archivo de imagen');
    return res.status(400).json({ message: 'No se subió ninguna imagen.' });
  }

  const imagePath = req.file.path;
  const targetLang = (req.body.targetLang || req.query.targetLang || 'es').trim().toLowerCase();
  const explicitLangs = req.body.langs || req.query.langs;
  const langsToReturn = explicitLangs ? parseLangs(explicitLangs) : [targetLang];

  console.log(`[🔍 OCR] Procesando y traduciendo imagen: ${req.file.originalname} | Idioma: ${targetLang}`);

  try {
    const result = await processAndTranslate(imagePath, targetLang, langsToReturn);
    console.log(`[✅ OCR] Análisis y traducción completados exitosamente`);
    return res.json(result);
  } catch (error) {
    console.error('[❌ OCR] Error al analizar y traducir:', error.message);
    return res.status(500).json({ message: 'Error al analizar y traducir imagen. Intenta nuevamente.' });
  } finally {
    fs.unlink(imagePath, () => {});
  }
};

/**
 * Optional: endpoint to translate a short text on-demand.
 * Uncomment and expose a route if you want to allow frontend on-demand translations.
 *
 * const { translateTextHybrid } = require('../translate/translator');
 * exports.translateText = async (req, res) => {
 *   const { text, sourceLang = 'und', targetLang = 'es' } = req.body || {};
 *   if (!text) return res.status(400).json({ error: 'No text provided' });
 *   try {
 *     const translated = await translateTextHybrid(text, sourceLang, targetLang);
 *     return res.json({ translated });
 *   } catch (e) {
 *     console.error('translateText error:', e);
 *     return res.status(500).json({ error: 'Translation failed' });
 *   }
 * };
 */