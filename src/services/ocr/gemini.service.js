const axios = require('axios');
const util = require('util');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const { translateTextGoogle } = require('../translate/translator'); // ajustar path si hace falta
const { info, warn, error } = require('../../utils/logger');

const GEMINI_ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

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

/** Simple fallback built from place data */
function simplePlaceFallback(place) {
  if (!place) return 'No hay información disponible para este lugar.';
  const parts = [];
  const name = place.name || place.place_name || '';
  const vic = place.vicinity || place.formatted_address || '';
  if (name) parts.push(`${name}`);
  if (vic) parts.push(`${vic}`);
  if (Array.isArray(place.types) && place.types.length) parts.push(`Tipo: ${place.types.slice(0,3).join(', ')}`);
  if (typeof place.rating === 'number') parts.push(`Valoración: ${place.rating}`);
  return parts.length ? `${parts.join(' — ')}.` : 'Información básica disponible.';
}

/**
 * getPlaceDescriptionIA
 * - Acepta un objeto `place` (Google Place) o un nombre string.
 * - Devuelve { es, en, qu } con textos sanitizados y acotados.
 * - Usa Gemini si está disponible; si no, devuelve fallback y traduce.
 *
 * Mejoras:
 * - Si el place.types sugiere "cafe/restaurant/bar" se pide al LLM describir ambiente, oferta y momento ideal.
 * - Si el place.types sugiere "museum,tourist_attraction" se pide contexto cultural y relevancia histórica.
 * - Si no se detecta tipo claro, se solicita una descripción equilibrada.
 */
async function getPlaceDescriptionIA(placeOrName) {
  // If GEMINI not configured, fallback immediately (but still try to provide useful fallback)
  if (!GEMINI_API_KEY) {
    warn('getPlaceDescriptionIA - GEMINI_API_KEY no configurada; devolviendo fallback.');
    const fallbackEs = simplePlaceFallback(placeOrName) || 'Descripción no disponible por configuración.';
    const [en, qu] = await Promise.all([
      (async () => { try { return await translateTextGoogle(fallbackEs, 'en'); } catch { return 'Description not available.'; } })(),
      (async () => { try { return await translateTextGoogle(fallbackEs, 'qu'); } catch { return 'Manaraq kashanmi willakuy.'; } })()
    ]);
    return { es: fallbackEs, en: en || 'Description not available.', qu: qu || 'Manaraq kashanmi willakuy.' };
  }

  const place = (typeof placeOrName === 'string') ? { name: placeOrName } : (placeOrName || {});
  const name = place.name || place.place_name || '';
  const vicinity = place.vicinity || place.formatted_address || '';
  const typesArr = Array.isArray(place.types) ? place.types.map(t => String(t).toLowerCase()) : [];
  const types = typesArr.join(', ');
  const rating = typeof place.rating === 'number' ? String(place.rating) : (place.rating ? String(place.rating) : '');
  const contextPieces = [];
  if (vicinity) contextPieces.push(`Ubicación: ${vicinity}`);
  if (types) contextPieces.push(`Tipos: ${types}`);
  if (rating) contextPieces.push(`Rating: ${rating}`);
  const contextText = contextPieces.join(' | ');

  // Ajustar instrucciones según tipo detectado
  let styleHint = '';
  if (typesArr.some(t => ['museum', 'art_gallery', 'tourist_attraction', 'historic', 'point_of_interest'].includes(t))) {
    styleHint = 'Escribe con foco en el contexto cultural, historia breve y relevancia local. Prioriza información cultural y patrimonio.';
  } else if (typesArr.some(t => ['cafe', 'restaurant', 'bar', 'bakery', 'food'].includes(t))) {
    styleHint = 'Describe el ambiente, ofertas típicas y la mejor hora para visitar; menciona aspectos prácticos (ej. ideal para desayuno, tarde, etc.).';
  } else {
    styleHint = 'Describe qué lo hace interesante o útil para un visitante local o turista, en un tono claro y conciso.';
  }

  const prompt = [
    'Eres un guía turístico local del área andina (Cusco, Perú).',
    `Describe de forma atractiva y respetuosa el lugar: "${name || 'este lugar'}".`,
    contextText ? `Contexto: ${contextText}.` : '',
    styleHint,
    `Escribe 1–2 oraciones, enfocándote en lo más llamativo, culturalmente relevante y útil. Máximo ${MAX_PLACE_CHARS} caracteres.`,
    'Evita frases genéricas, no inventes datos concretos (fechas, cifras) si no están en el contexto, y mantén un tono respetuoso y veraz.'
  ].filter(Boolean).join(' ');

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
      warn('getPlaceDescriptionIA - Gemini request timed out after %dms for "%s"', duration, name || 'N/A');
    } else if (!respWrap.ok) {
      const e = respWrap.error;
      if (e?.response) {
        error('getPlaceDescriptionIA - Gemini HTTP error status=%d body=%s', e.response.status, util.inspect(e.response.data, { depth: 6 }));
      } else {
        error('getPlaceDescriptionIA - Gemini error: %s', util.inspect(e, { depth: 6 }));
      }
    } else {
      const response = respWrap.value;
      // Robust parsing for multiple shapes
      const raw =
        response?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        response?.data?.output?.[0]?.content?.[0]?.text ||
        response?.data?.message?.content?.[0]?.text ||
        '';
      description_es = sanitizeAndLimit(raw, MAX_PLACE_CHARS);
      info('getPlaceDescriptionIA - Gemini responded in %dms for "%s"', duration, name || 'N/A');
    }
  } catch (err) {
    error('getPlaceDescriptionIA - unexpected error: %s', err?.message || util.inspect(err, { depth: 4 }));
    description_es = '';
  }

  if (!description_es) {
    description_es = simplePlaceFallback(place) || 'Descripción no disponible por el momento.';
    info('getPlaceDescriptionIA - using fallback for "%s": %s', name || 'N/A', description_es);
  }

  // Translate to en/qu using translateTextGoogle (withTimeout wrappers)
  let description_en = 'Description not available at the moment.';
  let description_qu = 'Manaraq kashanmi willakuy.';

  try {
    const trEnWrap = await withTimeout(translateTextGoogle(description_es, 'en'), 8000, null);
    if (trEnWrap && trEnWrap.ok && trEnWrap.value) description_en = sanitizeAndLimit(trEnWrap.value, MAX_PLACE_CHARS);
    else if (typeof trEnWrap === 'string' && trEnWrap) description_en = sanitizeAndLimit(trEnWrap, MAX_PLACE_CHARS);
  } catch (e) { warn('getPlaceDescriptionIA - translate en failed: %s', e?.message || e); }

  try {
    const trQuWrap = await withTimeout(translateTextGoogle(description_es, 'qu'), 8000, null);
    if (trQuWrap && trQuWrap.ok && trQuWrap.value) description_qu = sanitizeAndLimit(trQuWrap.value, MAX_PLACE_CHARS);
    else if (typeof trQuWrap === 'string' && trQuWrap) description_qu = sanitizeAndLimit(trQuWrap, MAX_PLACE_CHARS);
  } catch (e) { warn('getPlaceDescriptionIA - translate qu failed: %s', e?.message || e); }

  return {
    es: description_es,
    en: description_en,
    qu: description_qu
  };
}

/**
 * getCulturalExplanation
 * - Genera una explicación cultural breve (2-3 oraciones) en el idioma targetLang.
 * - Usa Gemini si está disponible; hace fallback a generar en español y traducir o a traducir un mensaje por defecto.
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
      if (typeof trWrap === 'string' && trWrap) return { explanation: sanitizeAndLimit(trWrap, MAX_EXPLANATION_CHARS), lang };
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
      warn('getCulturalExplanation - GEMINI_API_KEY no configurada; se intentará fallback de traducción si es posible.');
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
        warn('getCulturalExplanation - Gemini timed out after %dms', duration);
      } else if (!respWrap.ok) {
        const e = respWrap.error;
        if (e?.response) {
          error('getCulturalExplanation - Gemini HTTP error status=%d body=%s', e.response.status, util.inspect(e.response.data, { depth: 6 }));
        } else {
          error('getCulturalExplanation - Gemini error: %s', util.inspect(e, { depth: 6 }));
        }
      } else {
        const response = respWrap.value;
        const geminiText =
          response?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          response?.data?.output?.[0]?.content?.[0]?.text ||
          response?.data?.message?.content?.[0]?.text ||
          '';
        const sanitized = sanitizeAndLimit(geminiText, MAX_EXPLANATION_CHARS);
        if (sanitized && sanitized.length > 0) return { explanation: sanitized, lang };
        info('getCulturalExplanation - Gemini responded in %dms but text was empty/insufficient', duration);
      }
    }
  } catch (err) {
    error('getCulturalExplanation - unexpected Gemini error: %s', err?.message || util.inspect(err, { depth: 6 }));
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
          } else if (typeof trWrap === 'string' && trWrap) {
            return { explanation: sanitizeAndLimit(trWrap, MAX_EXPLANATION_CHARS), lang };
          } else {
            return { explanation: sanitizeAndLimit(geminiEs, MAX_EXPLANATION_CHARS), lang };
          }
        }
      } else if (respEsWrap && respEsWrap.timeout) {
        warn('getCulturalExplanation (es fallback) - Gemini timed out after %dms', durEs);
      } else if (respEsWrap && respEsWrap.error) {
        const e = respEsWrap.error;
        if (e?.response) {
          error('getCulturalExplanation (es fallback) - Gemini HTTP error status=%d body=%s', e.response.status, util.inspect(e.response.data, { depth: 6 }));
        } else {
          error('getCulturalExplanation (es fallback) - Gemini error: %s', util.inspect(e, { depth: 6 }));
        }
      }
    }
  } catch (e) {
    warn('getCulturalExplanation - fallback es unexpected error: %s', e?.message || util.inspect(e, { depth: 4 }));
  }

  // 3) Último recurso: traducir mensaje por defecto
  try {
    const translatedDefaultWrap = await withTimeout(translateTextGoogle(fallbackBaseEs, lang), 6000, null);
    if (translatedDefaultWrap && translatedDefaultWrap.ok && translatedDefaultWrap.value) {
      return { explanation: sanitizeAndLimit(translatedDefaultWrap.value, MAX_EXPLANATION_CHARS), lang };
    } else if (translatedDefaultWrap && translatedDefaultWrap.timeout) {
      warn('getCulturalExplanation - translateTextGoogle(default) timed out');
    } else if (typeof translatedDefaultWrap === 'string' && translatedDefaultWrap) {
      return { explanation: sanitizeAndLimit(translatedDefaultWrap, MAX_EXPLANATION_CHARS), lang };
    }
  } catch (e) {
    /* ignore */
  }

  return { explanation: fallbackBaseEs, lang };
}

module.exports = {
  getPlaceDescriptionIA,
  getCulturalExplanation
};