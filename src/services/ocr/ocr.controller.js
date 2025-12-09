const { processImageForCulture, processAndTranslate } = require('./ocr.service');
const Translation = require('../../models/Translation');
const fs = require('fs');
const { analyzeImageWithVision } = require('./vision.service');
const { translateTextHybrid } = require('../translate/translator');

/** Parse a langs input which can be "es,en,qu" or ['es','en','qu'] */
function parseLangs(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((s) => String(s).toLowerCase());
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

/**
 * GET /api/ocr/status
 * Health check del servicio OCR
 */
exports.getOcrStatus = async (req, res) => {
  try {
    // Verificar que Google Vision esté disponible
    // (con que exista el módulo y las credenciales, asumimos listo)
    // eslint-disable-next-line global-require
    require('@google-cloud/vision');
    const hasCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    // Verificar directorio de uploads
    const uploadsDir = 'uploads/';
    const uploadsExists = fs.existsSync(uploadsDir);
    if (!uploadsExists) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const status = {
      ok: true,
      service: 'OCR Vision AI',
      provider: 'Google Cloud Vision',
      ready: hasCredentials,
      uploadsDir: uploadsExists || fs.existsSync(uploadsDir),
      timestamp: new Date().toISOString(),
    };

    if (!hasCredentials) {
      status.warning = 'GOOGLE_APPLICATION_CREDENTIALS no configurado';
      status.ready = false;
    }

    return res.status(hasCredentials ? 200 : 503).json(status);
  } catch (error) {
    console.error('[❌ OCR] Error en health check:', error.message);
    return res.status(503).json({
      ok: false,
      service: 'OCR Vision AI',
      ready: false,
      error: 'Servicio no disponible',
      code: 'SERVICE_UNAVAILABLE',
      timestamp: new Date().toISOString(),
    });
  }
};

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
    return res.status(400).json({
      message: 'No se subió ninguna imagen.',
      code: 'NO_FILE',
    });
  }

  const imagePath = req.file.path;
  const targetLang = (req.body.targetLang || req.query.targetLang || 'es')
    .trim()
    .toLowerCase();

  console.log(
    `[🔍 OCR] Procesando imagen: ${req.file.originalname} | Idioma: ${targetLang}`
  );

  // If client explicitly provided langs, parse them; otherwise default to only targetLang
  const explicitLangs = req.body.langs || req.query.langs;
  const langsToReturn = explicitLangs ? parseLangs(explicitLangs) : [targetLang];

  try {
    const result = await processImageForCulture(
      imagePath,
      targetLang,
      langsToReturn
    );
    console.log('[✅ OCR] Análisis completado exitosamente');

    // Registrar traducción si el usuario está autenticado y el servicio devuelve esos campos
    if (
      req.user &&
      result.detectedText &&
      result.translations &&
      result.translations[targetLang]
    ) {
      try {
        const { week, year } = Translation.getCurrentWeek();
        await Translation.create({
          user_id: req.user._id,
          from_lang: 'quechua', // asumimos quechua desde OCR
          to_lang:
            targetLang === 'es'
              ? 'spanish'
              : targetLang === 'en'
              ? 'english'
              : 'spanish',
          original_text: result.detectedText,
          translated_text: result.translations[targetLang],
          translation_method: 'ocr',
          week_number: week,
          year,
        });
        console.log('[✅ TRANSLATION] Traducción OCR registrada');
      } catch (transError) {
        console.warn(
          '[⚠️ TRANSLATION] Error al registrar traducción OCR:',
          transError.message
        );
      }
    }

    return res.json(result);
  } catch (error) {
    console.error('[❌ OCR] Error al analizar imagen:', error.message);
    console.error('[❌ OCR] Stack trace:', error.stack);
    console.error('[❌ OCR] Detalles completos:', error);

    // Determinar código de error específico
    let errorCode = 'OCR_ERROR';
    let statusCode = 500;
    let errorMessage = 'Error al analizar imagen. Intenta nuevamente.';

    if (
      error.message.includes('Vision') ||
      error.message.includes('vision')
    ) {
      errorCode = 'VISION_API_ERROR';
      errorMessage = 'Error al procesar imagen con Vision API.';
    } else if (
      error.message.includes('timeout') ||
      error.message.includes('ETIMEDOUT')
    ) {
      errorCode = 'TIMEOUT';
      errorMessage = 'Tiempo de espera agotado al procesar imagen.';
      statusCode = 504;
    } else if (
      error.message.includes('credentials') ||
      error.message.includes('authentication')
    ) {
      errorCode = 'AUTH_ERROR';
      errorMessage = 'Error de autenticación con servicios externos.';
      statusCode = 503;
    }

    return res.status(statusCode).json({
      message: errorMessage,
      code: errorCode,
    });
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
    return res.status(400).json({
      message: 'No se subió ninguna imagen.',
      code: 'NO_FILE',
    });
  }

  const imagePath = req.file.path;
  const targetLang = (req.body.targetLang || req.query.targetLang || 'es')
    .trim()
    .toLowerCase();
  const explicitLangs = req.body.langs || req.query.langs;
  const langsToReturn = explicitLangs ? parseLangs(explicitLangs) : [targetLang];

  console.log(
    `[🔍 OCR] Procesando y traduciendo imagen: ${req.file.originalname} | Idioma: ${targetLang}`
  );

  try {
    const result = await processAndTranslate(
      imagePath,
      targetLang,
      langsToReturn
    );
    console.log('[✅ OCR] Análisis y traducción completados exitosamente');
    return res.json(result);
  } catch (error) {
    console.error(
      '[❌ OCR] Error al analizar y traducir:',
      error.message
    );

    // Determinar código de error específico
    let errorCode = 'OCR_TRANSLATE_ERROR';
    let statusCode = 500;
    let errorMessage =
      'Error al analizar y traducir imagen. Intenta nuevamente.';

    if (
      error.message.includes('Vision') ||
      error.message.includes('vision')
    ) {
      errorCode = 'VISION_API_ERROR';
      errorMessage = 'Error al procesar imagen con Vision API.';
    } else if (
      error.message.includes('timeout') ||
      error.message.includes('ETIMEDOUT')
    ) {
      errorCode = 'TIMEOUT';
      errorMessage = 'Tiempo de espera agotado al procesar imagen.';
      statusCode = 504;
    } else if (
      error.message.includes('translation') ||
      error.message.includes('translate')
    ) {
      errorCode = 'TRANSLATION_ERROR';
      errorMessage = 'Error en el servicio de traducción.';
    }

    return res.status(statusCode).json({
      message: errorMessage,
      code: errorCode,
    });
  } finally {
    fs.unlink(imagePath, () => {});
  }
};

/**
 * POST /api/ocr/extract-text-and-translate
 * Endpoint simple para el traductor:
 * - Extrae solo texto desde la imagen
 * - Lo traduce al idioma destino (targetLang)
 * - No genera explicaciones culturales ni objetos
 */
exports.extractTextAndTranslate = async (req, res) => {
  console.log('[📸 OCR-SIMPLE] Iniciando OCR simple (texto + traducción)');

  if (!req.file || !req.file.path) {
    console.log('[❌ OCR-SIMPLE] No se recibió archivo de imagen');
    return res.status(400).json({
      message: 'No se subió ninguna imagen.',
      code: 'NO_FILE',
    });
  }

  const imagePath = req.file.path;
  const targetLang = (req.body.targetLang || req.query.targetLang || 'es')
    .trim()
    .toLowerCase();

  try {
    // 1) OCR básico con Vision
    const visionResult = await analyzeImageWithVision(imagePath, [
      'es',
      'qu',
      'en',
    ]);
    const fullText = (visionResult.text || '').trim();
    const detectedLang = (visionResult.lang || 'und').toLowerCase();

    if (!fullText) {
      console.log('[⚠️ OCR-SIMPLE] No se detectó texto en la imagen');
      return res.status(200).json({
        detectedLang,
        fullText: '',
        translatedText: '',
        targetLang,
        message: 'No se detectó texto en la imagen.',
      });
    }

    // 2) Traducir texto completo al idioma destino
    let translatedText = '';
    try {
      translatedText = await translateTextHybrid(
        fullText,
        detectedLang || 'und',
        targetLang
      );
    } catch (e) {
      console.warn(
        '[⚠️ OCR-SIMPLE] Error en traducción híbrida, devolviendo solo texto OCR:',
        e.message || e
      );
      translatedText = '';
    }

    // 3) Registrar traducción si el usuario está autenticado
    if (req.user && translatedText) {
      try {
        const { week, year } = Translation.getCurrentWeek();
        await Translation.create({
          user_id: req.user._id,
          from_lang:
            detectedLang === 'qu'
              ? 'quechua'
              : detectedLang === 'en'
              ? 'english'
              : 'spanish',
          to_lang:
            targetLang === 'es'
              ? 'spanish'
              : targetLang === 'en'
              ? 'english'
              : 'spanish',
          original_text: fullText,
          translated_text: translatedText,
          translation_method: 'ocr-text',
          week_number: week,
          year,
        });
        console.log('[✅ TRANSLATION] Traducción OCR simple registrada');
      } catch (transError) {
        console.warn(
          '[⚠️ TRANSLATION] Error al registrar traducción OCR simple:',
          transError.message
        );
      }
    }

    return res.json({
      detectedLang,
      fullText,
      translatedText,
      targetLang,
    });
  } catch (error) {
    console.error('[❌ OCR-SIMPLE] Error en OCR simple:', error.message);
    return res.status(500).json({
      message: 'Error al extraer y traducir texto. Intenta nuevamente.',
      code: 'OCR_TEXT_ERROR',
    });
  } finally {
    fs.unlink(imagePath, () => {});
  }
};