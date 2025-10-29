/**
 * server/services/ocr.service.js
 *
 * Orquesta Google Vision + Gemini + traductor híbrido.
 * - Detecta texto/objetos con Vision.
 * - Para cada objeto (y para cada texto si aplica) genera explicaciones culturales
 *   precomputadas en varios idiomas (por defecto: es, en, qu).
 * - Traduce opcionalmente los nombres cortos de los objetos a los mismos idiomas.
 *
 * Resultado: objeto JSON que el frontend puede usar para mostrar instantáneamente
 * explicaciones en cualquiera de los idiomas precomputados y para seleccionar
 * explicaciones individuales por objeto.
 *
 * Requisitos:
 * - getCulturalExplanation(text, labels, objects, targetLang) en gemini.service.js
 *   debe aceptar targetLang y devolver string (o { explanation, lang }).
 * - translateTextHybrid(text, sourceLang, targetLang) en translate/translator.js
 *   debe devolver string (o '' si falla).
 */

const { analyzeImageWithVision } = require('./vision.service');
const { getCulturalExplanation } = require('./gemini.service');
const { translateTextHybrid } = require('../translate/translator');

const DEFAULT_LANGS = ['es', 'en', 'qu'];
const MAX_EXPLANATION_LENGTH = 220;

/**
 * Safely call an async function with timeout.
 * If the promise doesn't resolve within ms, returns fallback.
 */
async function withTimeout(promise, ms = 15000, fallback = '') {
  let timer;
  const timeout = new Promise((resolve) =>
    timer = setTimeout(() => resolve(fallback), ms)
  );
  const result = await Promise.race([promise, timeout]);
  clearTimeout(timer);
  return result;
}

/**
 * Normaliza nombre de idioma (ej. 'es', 'en', 'qu').
 */
function normalizeLangCode(code) {
  if (!code) return 'und';
  return String(code).toLowerCase().split(/[-_]/)[0];
}

/**
 * Genera explicaciones para un texto/objeto en todos los idiomas pedidos.
 * - input: { text?, objectName?, labels?, objects? }
 * - langs: array de códigos de idioma
 * Devuelve: { es: "...", en: "...", qu: "..." }
 */
async function generateExplanationsForItem(input, langs = DEFAULT_LANGS) {
  const results = {};
  await Promise.all(langs.map(async (lang) => {
    try {
      // getCulturalExplanation puede devolver string o { explanation, lang }
      const raw = await withTimeout(
        getCulturalExplanation(input.text || input.objectName || '', input.labels || [], input.objects || [], lang),
        14000,
        ''
      );

      let explanation = '';
      if (!raw) {
        explanation = '';
      } else if (typeof raw === 'string') {
        explanation = raw;
      } else if (typeof raw === 'object' && raw.explanation) {
        explanation = raw.explanation;
      } else {
        explanation = String(raw);
      }

      explanation = explanation.trim();
      if (explanation.length > MAX_EXPLANATION_LENGTH) {
        explanation = explanation.slice(0, MAX_EXPLANATION_LENGTH - 3).trim() + '...';
      }
      results[normalizeLangCode(lang)] = explanation;
    } catch (err) {
      console.error(`generateExplanationsForItem error for lang=${lang}:`, err?.message || err);
      results[normalizeLangCode(lang)] = '';
    }
  }));
  return results;
}

/**
 * Traduce un nombre corto (objeto) a todos los idiomas pedidos usando translateTextHybrid.
 * Devuelve: { es: "", en: "", qu: "" } (valores vacíos si falla).
 */
async function translateNameAllLangs(name, sourceLang = 'und', langs = DEFAULT_LANGS) {
  const results = {};
  await Promise.all(langs.map(async (lang) => {
    try {
      // Si el idioma destino coincide con la fuente, devolvemos el original
      if (!name) {
        results[normalizeLangCode(lang)] = '';
        return;
      }
      if (normalizeLangCode(lang) === normalizeLangCode(sourceLang)) {
        results[normalizeLangCode(lang)] = name;
        return;
      }
      const tr = await withTimeout(
        translateTextHybrid(name, sourceLang || 'und', lang),
        8000,
        ''
      );
      results[normalizeLangCode(lang)] = (tr || '').trim();
    } catch (err) {
      console.warn(`translateNameAllLangs failed ${sourceLang}->${lang}:`, err?.message || err);
      results[normalizeLangCode(lang)] = '';
    }
  }));
  return results;
}

/**
 * Principal: procesa la imagen y devuelve explicaciones por objeto y por texto.
 *
 * response shape:
 * {
 *   texts: [ { text: "...", explanations: { es:"", en:"", qu:"" } }, ... ],
 *   detectedLang: "en",
 *   labels: [...],
 *   objects: [
 *     {
 *       name: "Sculpture",
 *       score: 0.92,
 *       boundingBox: [...],
 *       translatedNames: { es: "Escultura", en: "Sculpture", qu: "..." },
 *       explanations: { es: "...", en: "...", qu: "..." }
 *     }
 *   ],
 *   explanationProvidedLangs: ['es','en','qu'],
 *   requestedLang: 'es'
 * }
 */
async function processImageForCulture(imagePath, requestedLang = 'es', langsToReturn = DEFAULT_LANGS) {
  // 1) Vision analysis
  const visionResult = await analyzeImageWithVision(imagePath, langsToReturn);
  const textRaw = visionResult.text || '';
  const detectedLang = visionResult.lang || 'und';
  const labels = Array.isArray(visionResult.labels) ? visionResult.labels : [];
  const visionObjects = Array.isArray(visionResult.objects) ? visionResult.objects : [];

  // 2) Normalize texts
  const texts = textRaw
    .split('\n')
    .map(t => t.trim())
    .filter(Boolean);

  // 3) Process objects in parallel
  const objectsProcessed = await Promise.all(visionObjects.map(async (obj) => {
    const objName = obj.name || '';
    const objScore = typeof obj.score === 'number' ? obj.score : (obj.score ? Number(obj.score) : 0);
    const boundingBox = obj.boundingBox || obj.boundingPoly || null;

    // a) precompute translated names (optional but helpful for UI)
    let translatedNames = {};
    try {
      translatedNames = await translateNameAllLangs(objName, detectedLang, langsToReturn);
    } catch (e) {
      translatedNames = langsToReturn.reduce((acc, l) => (acc[l] = '', acc), {});
    }

    // b) precompute explanations per language for this object
    let explanations = {};
    try {
      explanations = await generateExplanationsForItem({ objectName: objName, labels, objects: [obj] }, langsToReturn);
    } catch (e) {
      explanations = langsToReturn.reduce((acc, l) => (acc[l] = '', acc), {});
    }

    return {
      name: objName,
      score: objScore,
      boundingBox,
      translatedNames,
      explanations
    };
  }));

  // 4) Optionally: generate explanations for detected texts (if any)
  const textsProcessed = await Promise.all(texts.map(async (t) => {
    let expls = {};
    try {
      expls = await generateExplanationsForItem({ text: t, labels, objects: visionObjects }, langsToReturn);
    } catch (e) {
      expls = langsToReturn.reduce((acc, l) => (acc[l] = '', acc), {});
    }
    return {
      text: t,
      explanations: expls
    };
  }));

  // 5) Build response
  const response = {
    texts: textsProcessed,
    detectedLang,
    labels,
    objects: objectsProcessed,
    explanationProvidedLangs: langsToReturn.map(normalizeLangCode),
    requestedLang: normalizeLangCode(requestedLang)
  };

  return response;
}

/**
 * Alias (mantener compatibilidad)
 */
async function processAndTranslate(imagePath, targetLang = 'es', langsToReturn = DEFAULT_LANGS) {
  return processImageForCulture(imagePath, targetLang, langsToReturn);
}

module.exports = { processImageForCulture, processAndTranslate };