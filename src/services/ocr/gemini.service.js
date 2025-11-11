const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const { translateTextGoogle } = require('../translate/translator'); // ajusta path si es necesario

const GEMINI_ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

// Timeouts y límites
const DEFAULT_TIMEOUT_MS = 45000; // 45s
const MAX_EXPLANATION_CHARS = 450;
const MAX_PLACE_CHARS = 220;

/**
 * Helper: ejecuta una promesa con timeout y devuelve objeto indicando resultado.
 * Devuelve: { ok: boolean, value: any, error?: any, timeout?: boolean }
 */
async function withTimeout(promise, ms = DEFAULT_TIMEOUT_MS, fallback = null) {
  let timer;
  const p = Promise.resolve(promise)
    .then((value) => ({ ok: true, value }))
    .catch((error) => ({ ok: false, error }));

  const timeoutP = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, timeout: true, value: fallback }), ms);
  });

  const result = await Promise.race([p, timeoutP]);
  clearTimeout(timer);
  return result;
}

/** Normaliza y limita texto — recorta solo si excede maxChars. */
function sanitizeAndLimit(text, maxChars) {
  if (!text) return '';
  let s = String(text).trim();
  s = s.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
  s = s.split('\n').map(line => line.trim()).join('\n');
  if (s.length > maxChars) return s.slice(0, maxChars - 3).trim() + '...';
  return s;
}

/** Normaliza código de idioma */
function normalizeLang(code) {
  if (!code) return 'und';
  return String(code).toLowerCase().split(/[-_]/)[0];
}

/**
 * getPlaceDescriptionIA
 * - Acepta un objeto place o un string con el nombre.
 * - Devuelve { es, en, qu } con textos sanitizados y acotados.
 * - Usa Gemini si está disponible; si no, devuelve fallback o intenta traducciones.
 */
async function getPlaceDescriptionIA(placeOrName) {
  if (!GEMINI_API_KEY) {
    console.warn('getPlaceDescriptionIA - GEMINI_API_KEY no configurada; devolviendo fallback.');
    const fallbackEs = 'Descripción no disponible por configuración.';
    const [en, qu] = await Promise.all([
      (async () => { try { return await translateTextGoogle(fallbackEs, 'en'); } catch { return 'Description not available.'; } })(),
      (async () => { try { return await translateTextGoogle(fallbackEs, 'qu'); } catch { return 'Manaraq kashanmi willakuy.'; } })()
    ]);
    return { es: fallbackEs, en: en || 'Description not available.', qu: qu || 'Manaraq kashanmi willakuy.' };
  }

  const placeName = (typeof placeOrName === 'string') ? placeOrName : (placeOrName?.name || placeOrName?.place_name || '');
  const titleForPrompt = placeName && String(placeName).trim().length ? String(placeName).trim() : 'este lugar';

  const prompt = `Eres un guía turístico andino. Describe de forma atractiva y respetuosa el lugar "${titleForPrompt}" (Cusco, Perú) en 1–2 oraciones, enfocándote en lo más llamativo y culturalmente relevante. Usa máximo ${MAX_PLACE_CHARS} caracteres. Evita detalles técnicos y asegúrate de mantener un tono respetuoso hacia la cultura local.`;

  let description_es = '';

  try {
    const start = Date.now();
    const axiosPromise = axios.post(
      GEMINI_ENDPOINT(GEMINI_API_KEY),
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' }, timeout: DEFAULT_TIMEOUT_MS }
    );

    const respWrap = await withTimeout(axiosPromise, DEFAULT_TIMEOUT_MS, null);
    const duration = Date.now() - start;

    if (respWrap.timeout) {
      console.warn(`getPlaceDescriptionIA - Gemini request timed out after ${duration}ms for "${titleForPrompt}"`);
    } else if (!respWrap.ok) {
      console.error('getPlaceDescriptionIA - Gemini error:', respWrap.error?.response?.data || respWrap.error?.message || respWrap.error);
    } else {
      const response = respWrap.value;
      const raw = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      description_es = sanitizeAndLimit(raw, MAX_PLACE_CHARS);
      console.log(`getPlaceDescriptionIA - Gemini responded in ${duration}ms for "${titleForPrompt}"`);
    }
  } catch (err) {
    console.error('getPlaceDescriptionIA - unexpected error:', err?.message || err);
    description_es = '';
  }

  if (!description_es) description_es = 'Descripción no disponible por el momento.';

  // Traducciones (fallback a translateTextGoogle). En caso de falla, usar mensajes por defecto.
  let description_en = 'Description not available at the moment.';
  let description_qu = 'Manaraq kashanmi willakuy.';

  try {
    const trEnWrap = await withTimeout(translateTextGoogle(description_es, 'en'), 8000, null);
    if (trEnWrap && trEnWrap.ok && trEnWrap.value) description_en = sanitizeAndLimit(trEnWrap.value, MAX_PLACE_CHARS);
  } catch (e) { /* ignore */ }

  try {
    const trQuWrap = await withTimeout(translateTextGoogle(description_es, 'qu'), 8000, null);
    if (trQuWrap && trQuWrap.ok && trQuWrap.value) description_qu = sanitizeAndLimit(trQuWrap.value, MAX_PLACE_CHARS);
  } catch (e) { /* ignore */ }

  return {
    es: description_es,
    en: description_en,
    qu: description_qu
  };
}

/**
 * getCulturalExplanation
 * - Genera una explicación cultural breve (2-3 oraciones) en el idioma targetLang.
 * - Flujo:
 *    1) Si no hay contenido, devuelve mensaje por defecto (o traducido).
 *    2) Intenta Gemini con prompt específico.
 *    3) Si falla o la respuesta es insuficiente, intenta fallback: pedir en español y traducir al targetLang.
 *    4) Si todo falla, retorna mensaje por defecto traducido/normalizado.
 */
async function getCulturalExplanation(text, labels = [], objects = [], targetLang = 'es') {
  const lang = normalizeLang(targetLang);
  const hasContent = (text && String(text).trim()) || (Array.isArray(labels) && labels.length) || (Array.isArray(objects) && objects.length);
  const baseMsgEs = 'No se detectó contenido en la imagen para analizar.';

  if (!hasContent) {
    if (lang === 'es') return { explanation: baseMsgEs, lang };
    try {
      const trWrap = await withTimeout(translateTextGoogle(baseMsgEs, lang), 6000, null);
      if (trWrap && trWrap.ok && trWrap.value) return { explanation: sanitizeAndLimit(trWrap.value, MAX_EXPLANATION_CHARS), lang };
    } catch (e) { /* ignore */ }
    return { explanation: baseMsgEs, lang };
  }

  const labelsStr = Array.isArray(labels) && labels.length ? labels.join(', ') : 'Ninguno';
  const objectsStr = Array.isArray(objects) && objects.length ? objects.map(o => o.name || '').join(', ') : '';

  const prompt = `
Analiza brevemente el contenido de la imagen y proporciona UNA explicación cultural clara y respetuosa.
Texto detectado: "${text && String(text).trim() ? String(text).trim() : 'Ninguno'}"
Etiquetas/objetos detectados: ${labelsStr}
${objectsStr ? `Objetos destacados: ${objectsStr}` : ''}

Tarea: Da una explicación cultural de 2–3 oraciones (suficiente contexto, sin ser extensa) y utiliza como máximo ${MAX_EXPLANATION_CHARS} caracteres.
Responde EN EL IDIOMA: ${lang}.
Sé informativo, conciso y evita juicios políticos o aseveraciones no verificadas.
  `.trim();

  // 1) Intento principal con Gemini en el idioma pedido
  try {
    if (!GEMINI_API_KEY) {
      console.warn('getCulturalExplanation - GEMINI_API_KEY no configurada; se intentará fallback de traducción si es posible.');
    } else {
      const start = Date.now();
      const axiosPromise = axios.post(
        GEMINI_ENDPOINT(GEMINI_API_KEY),
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { 'Content-Type': 'application/json' }, timeout: DEFAULT_TIMEOUT_MS }
      );

      const respWrap = await withTimeout(axiosPromise, DEFAULT_TIMEOUT_MS, null);
      const duration = Date.now() - start;

      if (respWrap.timeout) {
        console.warn(`getCulturalExplanation - Gemini timed out after ${duration}ms`);
      } else if (!respWrap.ok) {
        console.error('getCulturalExplanation - Gemini error:', respWrap.error?.response?.data || respWrap.error?.message || respWrap.error);
      } else {
        const response = respWrap.value;
        const geminiText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const sanitized = sanitizeAndLimit(geminiText, MAX_EXPLANATION_CHARS);
        if (sanitized && sanitized.length > 0) return { explanation: sanitized, lang };
        console.log(`getCulturalExplanation - Gemini responded in ${duration}ms but text was empty/insufficient`);
      }
    }
  } catch (err) {
    console.error('getCulturalExplanation - unexpected Gemini error:', err?.message || err);
  }

  // 2) Fallback: generar en español y traducir si target != 'es'
  const fallbackBaseEs = 'No se pudo generar una explicación cultural en este momento.';
  if (lang === 'es') {
    return { explanation: fallbackBaseEs, lang };
  }

  try {
    if (GEMINI_API_KEY) {
      const startEs = Date.now();
      const axiosPromiseEs = axios.post(
        GEMINI_ENDPOINT(GEMINI_API_KEY),
        { contents: [{ parts: [{ text: prompt + '\nResponde en el idioma: es.' }] }] },
        { headers: { 'Content-Type': 'application/json' }, timeout: DEFAULT_TIMEOUT_MS }
      );

      const respEsWrap = await withTimeout(axiosPromiseEs, DEFAULT_TIMEOUT_MS, null);
      const durEs = Date.now() - startEs;

      if (respEsWrap.ok && respEsWrap.value) {
        let geminiEs = respEsWrap.value?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        geminiEs = sanitizeAndLimit(geminiEs, MAX_EXPLANATION_CHARS);
        if (geminiEs) {
          const trWrap = await withTimeout(translateTextGoogle(geminiEs, lang), 8000, null);
          if (trWrap && trWrap.ok && trWrap.value) {
            return { explanation: sanitizeAndLimit(trWrap.value, MAX_EXPLANATION_CHARS), lang };
          } else {
            return { explanation: sanitizeAndLimit(geminiEs, MAX_EXPLANATION_CHARS), lang };
          }
        }
      } else if (respEsWrap && respEsWrap.timeout) {
        console.warn(`getCulturalExplanation (es fallback) - Gemini timed out after ${durEs}ms`);
      } else if (respEsWrap && respEsWrap.error) {
        console.error('getCulturalExplanation (es fallback) - Gemini error:', respEsWrap.error?.response?.data || respEsWrap.error?.message || respEsWrap.error);
      }
    }
  } catch (e) {
    console.warn('getCulturalExplanation - fallback es unexpected error:', e?.message || e);
  }

  // 3) Último recurso: traducir mensaje por defecto
  try {
    const translatedDefaultWrap = await withTimeout(translateTextGoogle(fallbackBaseEs, lang), 6000, null);
    if (translatedDefaultWrap && translatedDefaultWrap.ok && translatedDefaultWrap.value) {
      return { explanation: sanitizeAndLimit(translatedDefaultWrap.value, MAX_EXPLANATION_CHARS), lang };
    } else if (translatedDefaultWrap && translatedDefaultWrap.timeout) {
      console.warn('getCulturalExplanation - translateTextGoogle(default) timed out');
    }
  } catch (e) {
    /* ignore */
  }

  return { explanation: fallbackBaseEs, lang };
}

module.exports = {
  getCulturalExplanation,
  getPlaceDescriptionIA
};