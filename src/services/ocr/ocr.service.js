/**
 * server/services/ocr.service.js
 *
 * Ajuste: devolver tanto la explicación completa como una preview corta.
 * - explanations: mapa con textos (completos, con límite alto)
 * - explanationsPreview: mapa con textos cortos (p. ej. 220 chars) para listados
 *
 * Resto de comportamiento idéntico: Vision -> Gemini -> traducción híbrida.
 *
 * Mejoras añadidas:
 * - robustez y timeouts alrededor de llamadas a servicios externos
 * - normalización consistente de códigos de idioma
 * - manejo de errores por item para evitar que un fallo detenga todo
 * - pequeñas defensas (arrays/empty checks, dedupe labels)
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

function ensureArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [v];
}

/**
 * Genera explicaciones para un texto/objeto en todos los idiomas pedidos.
 * Devuelve: { full: {es: '', en: '', qu: ''}, preview: {es:'', ...} }
 *
 * - Envuelve llamadas a getCulturalExplanation con timeout y defensas.
 */
async function generateExplanationsForItem(input, langs = DEFAULT_LANGS) {
  const full = {};
  const preview = {};
  const langsNormalized = (langs || DEFAULT_LANGS).map(normalizeLangCode);

  await Promise.all(langsNormalized.map(async (lang) => {
    try {
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
      } else if (typeof raw === 'object') {
        // Some implementations can return { explanation, lang } or { es: "...", en: "..." }
        if (raw.explanation && typeof raw.explanation === 'string') {
          explanation = raw.explanation;
        } else if (raw[lang] && typeof raw[lang] === 'string') {
          explanation = raw[lang];
        } else {
          // fallback to JSON stringify (safe)
          explanation = JSON.stringify(raw);
        }
      } else {
        explanation = String(raw);
      }

      explanation = safeString(explanation);

      // store full (with a high cap) and preview (short)
      full[lang] = makeFull(explanation);
      preview[lang] = makePreview(explanation);
    } catch (err) {
      console.error(`generateExplanationsForItem error for lang=${lang}:`, err?.message || err);
      full[lang] = '';
      preview[lang] = '';
    }
  }));

  return { full, preview };
}

/**
 * Traduce un nombre corto (objeto) a todos los idiomas pedidos usando translateTextHybrid.
 * Devuelve: { es: "", en: "", qu: "" } (valores vacíos si falla).
 *
 * Usamos withTimeout para evitar bloqueos.
 */
async function translateNameAllLangs(name, sourceLang = 'und', langs = DEFAULT_LANGS) {
  const results = {};
  const langsNormalized = (langs || DEFAULT_LANGS).map(normalizeLangCode);
  await Promise.all(langsNormalized.map(async (lang) => {
    try {
      if (!name) {
        results[lang] = '';
        return;
      }
      if (lang === normalizeLangCode(sourceLang)) {
        results[lang] = name;
        return;
      }
      const tr = await withTimeout(
        translateTextHybrid(name, sourceLang || 'und', lang),
        8000,
        ''
      );
      results[lang] = (tr || '').trim();
    } catch (err) {
      console.warn(`translateNameAllLangs failed ${sourceLang}->${lang}:`, err?.message || err);
      results[lang] = '';
    }
  }));
  return results;
}

/**
 * Principal: procesa la imagen y devuelve explicaciones por objeto y por texto.
 * Ahora cada objeto/texto incluye:
 * - explanations: { es: "texto completo", ... }
 * - explanationsPreview: { es: "texto corto", ... }
 *
 * Mejoras:
 * - defensas contra valores nulos
 * - dedupe de labels
 * - timeouts y manejo por item para que un fallo no cancele todo
 */
async function processImageForCulture(imagePath, requestedLang = 'es', langsToReturn = DEFAULT_LANGS) {
  // 1) Vision analysis (envuelto en try para fallback)
  let visionResult = {};
  try {
    visionResult = await withTimeout(analyzeImageWithVision(imagePath, langsToReturn), 30000, {});
  } catch (err) {
    console.warn('analyzeImageWithVision failed:', err?.message || err);
    visionResult = {};
  }

  const textRaw = safeString(visionResult.text || '');
  const detectedLang = visionResult.lang ? normalizeLangCode(visionResult.lang) : 'und';

  const rawLabels = ensureArray(visionResult.labels).map(l => safeString(l)).filter(Boolean);
  // dedupe labels
  const labels = Array.from(new Set(rawLabels));

  const visionObjects = ensureArray(visionResult.objects);

  // 2) Normalize texts (split lines, trim)
  const texts = textRaw
    .split('\n')
    .map(t => t.trim())
    .filter(Boolean);

  // 3) Process objects in parallel with item-level error handling
  const langsNormalized = (langsToReturn || DEFAULT_LANGS).map(normalizeLangCode);

  const objectsProcessed = await Promise.all(visionObjects.map(async (obj) => {
    try {
      const objName = safeString(obj.name || '');
      const objScore = (typeof obj.score === 'number') ? obj.score : (obj.score ? Number(obj.score) : 0);
      const boundingBox = obj.boundingBox || obj.boundingPoly || null;

      // a) precompute translated names (optional but helpful for UI)
      let translatedNames = {};
      try {
        translatedNames = await translateNameAllLangs(objName, detectedLang, langsNormalized);
      } catch (e) {
        translatedNames = langsNormalized.reduce((acc, l) => { acc[l] = ''; return acc; }, {});
      }

      // b) precompute explanations per language for this object
      let explanations = {};
      let explanationsPreview = {};
      try {
        const gen = await generateExplanationsForItem({ objectName: objName, labels, objects: [obj] }, langsNormalized);
        explanations = gen.full || {};
        explanationsPreview = gen.preview || {};
      } catch (e) {
        explanations = langsNormalized.reduce((acc, l) => { acc[l] = ''; return acc; }, {});
        explanationsPreview = langsNormalized.reduce((acc, l) => { acc[l] = ''; return acc; }, {});
      }

      return {
        name: objName,
        score: objScore,
        boundingBox,
        translatedNames,
        explanations,
        explanationsPreview
      };
    } catch (err) {
      console.error('Error processing object:', err?.message || err);
      return {
        name: safeString(obj && obj.name ? obj.name : ''),
        score: typeof obj.score === 'number' ? obj.score : 0,
        boundingBox: obj.boundingBox || obj.boundingPoly || null,
        translatedNames: langsNormalized.reduce((acc, l) => { acc[l] = ''; return acc; }, {}),
        explanations: langsNormalized.reduce((acc, l) => { acc[l] = ''; return acc; }, {}),
        explanationsPreview: langsNormalized.reduce((acc, l) => { acc[l] = ''; return acc; }, {})
      };
    }
  }));

  // 4) Optionally: generate explanations for detected texts (if any)
  const textsProcessed = await Promise.all(texts.map(async (t) => {
    try {
      const gen = await generateExplanationsForItem({ text: t, labels, objects: visionObjects }, langsNormalized);
      return {
        text: t,
        explanations: gen.full || {},
        explanationsPreview: gen.preview || {}
      };
    } catch (e) {
      return {
        text: t,
        explanations: langsNormalized.reduce((acc, l) => { acc[l] = ''; return acc; }, {}),
        explanationsPreview: langsNormalized.reduce((acc, l) => { acc[l] = ''; return acc; }, {})
      };
    }
  }));

  // 5) Build response
  const response = {
    texts: textsProcessed,
    detectedLang,
    labels,
    objects: objectsProcessed,
    explanationProvidedLangs: langsNormalized,
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
