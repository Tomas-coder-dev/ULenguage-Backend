/**
 * server/services/ocr.service.js
 *
 * Ajuste: devolver tanto la explicación completa como una preview corta.
 * - explanations: mapa con textos (completos, con límite alto)
 * - explanationsPreview: mapa con textos cortos (p. ej. 220 chars) para listados
 *
 * Resto de comportamiento idéntico: Vision -> Gemini -> traducción híbrida.
 */

const { analyzeImageWithVision } = require('./vision.service');
const { getCulturalExplanation } = require('./gemini.service');
const { translateTextHybrid } = require('../translate/translator');

const DEFAULT_LANGS = ['es', 'en', 'qu'];

// Máximo razonable para preview mostrable en lista
const MAX_PREVIEW_LENGTH = 220;
// Límite alto para la explicación completa (evita respuestas infinitas)
const MAX_FULL_LENGTH = 2000;

/**
 * Safely call an async function with timeout.
 * If the promise doesn't resolve within ms, returns fallback.
 */
async function withTimeout(promise, ms = 30000, fallback = '') {
  let timer;
  const timeout = new Promise((resolve) =>
    timer = setTimeout(() => resolve(fallback), ms)
  );
  const result = await Promise.race([promise, timeout]);
  clearTimeout(timer);
  return result;
}

function normalizeLangCode(code) {
  if (!code) return 'und';
  return String(code).toLowerCase().split(/[-_]/)[0];
}

function safeString(x) {
  if (x === null || x === undefined) return '';
  return String(x).trim();
}

function makePreview(text, maxChars = MAX_PREVIEW_LENGTH) {
  const s = safeString(text).replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
  if (!s) return '';
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars - 3).trim() + '...';
}

function makeFull(text, maxChars = MAX_FULL_LENGTH) {
  const s = safeString(text).replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
  if (!s) return '';
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars - 3).trim() + '...';
}

/**
 * Genera explicaciones para un texto/objeto en todos los idiomas pedidos.
 * Devuelve: { full: {es: '', en: '', qu: ''}, preview: {es:'', ...} }
 */
async function generateExplanationsForItem(input, langs = DEFAULT_LANGS) {
  const full = {};
  const preview = {};

  await Promise.all(langs.map(async (lang) => {
    try {
      // getCulturalExplanation puede devolver string o { explanation, lang }
      const raw = await withTimeout(
        getCulturalExplanation(input.text || input.objectName || '', input.labels || [], input.objects || [], lang),
        30000,
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

      explanation = safeString(explanation);

      // store full (with a high cap) and preview (short)
      full[normalizeLangCode(lang)] = makeFull(explanation);
      preview[normalizeLangCode(lang)] = makePreview(explanation);
    } catch (err) {
      console.error(`generateExplanationsForItem error for lang=${lang}:`, err?.message || err);
      full[normalizeLangCode(lang)] = '';
      preview[normalizeLangCode(lang)] = '';
    }
  }));

  return { full, preview };
}

/**
 * Traduce un nombre corto (objeto) a todos los idiomas pedidos usando translateTextHybrid.
 * Devuelve: { es: "", en: "", qu: "" } (valores vacíos si falla).
 */
async function translateNameAllLangs(name, sourceLang = 'und', langs = DEFAULT_LANGS) {
  const results = {};
  await Promise.all(langs.map(async (lang) => {
    try {
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
 * Ahora cada objeto/texto incluye:
 * - explanations: { es: "texto completo", ... }
 * - explanationsPreview: { es: "texto corto", ... }
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
    let explanationsPreview = {};
    try {
      const gen = await generateExplanationsForItem({ objectName: objName, labels, objects: [obj] }, langsToReturn);
      explanations = gen.full || {};
      explanationsPreview = gen.preview || {};
    } catch (e) {
      explanations = langsToReturn.reduce((acc, l) => (acc[l] = '', acc), {});
      explanationsPreview = langsToReturn.reduce((acc, l) => (acc[l] = '', acc), {});
    }

    return {
      name: objName,
      score: objScore,
      boundingBox,
      translatedNames,
      explanations,
      explanationsPreview
    };
  }));

  // 4) Optionally: generate explanations for detected texts (if any)
  const textsProcessed = await Promise.all(texts.map(async (t) => {
    let expls = {};
    let explsPreview = {};
    try {
      const gen = await generateExplanationsForItem({ text: t, labels, objects: visionObjects }, langsToReturn);
      expls = gen.full || {};
      explsPreview = gen.preview || {};
    } catch (e) {
      expls = langsToReturn.reduce((acc, l) => (acc[l] = '', acc), {});
      explsPreview = langsToReturn.reduce((acc, l) => (acc[l] = '', acc), {});
    }
    return {
      text: t,
      explanations: expls,
      explanationsPreview: explsPreview
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