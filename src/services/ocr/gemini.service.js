/**
 * server/services/gemini.service.js
 *
 * Ajustes para respuestas moderadas y completas:
 * - DEFAULT_TIMEOUT_MS aumentado a 45s.
 * - MAX_EXPLANATION_CHARS ajustado a 450 (2-3 oraciones, con contexto).
 * - MAX_PLACE_CHARS para descripciones de lugares reducido a 220.
 * - Prompt ajustado para solicitar 2-3 oraciones y máximo X caracteres.
 * - withTimeout devuelve { ok, value, error, timeout }.
 */

const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const { translateTextGoogle } = require('../translate/translator'); // Ajusta el path si es necesario

const GEMINI_ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

// Timeout aumentado a 45s (los LLM pueden tardar)
const DEFAULT_TIMEOUT_MS = 45000;
// Longitud moderada para explicaciones (2-3 oraciones; suficiente detalle, sin ser muy extensas)
const MAX_EXPLANATION_CHARS = 450;
// Descripciones de lugar algo más cortas
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

/**
 * Normaliza y limita texto — recorta solo si excede maxChars.
 */
function sanitizeAndLimit(text, maxChars) {
  if (!text) return '';
  let s = String(text).trim();
  // Normalizar saltos de línea y espacios
  s = s.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
  // Eliminar espacios extra en líneas
  s = s.split('\n').map(line => line.trim()).join('\n');
  if (s.length > maxChars) {
    return s.slice(0, maxChars - 3).trim() + '...';
  }
  return s;
}

/**
 * Genera una breve descripción turística de un lugar usando Gemini y la traduce a otros idiomas.
 */
async function getPlaceDescriptionIA(place) {
  const placeName = place?.name || 'este lugar';
  const prompt = `Eres un guía turístico andino. Describe en términos atractivos y respetuosos el lugar "${placeName}" (Cusco, Perú).
Responde en español, en 1–2 oraciones, y usa un máximo de ${MAX_PLACE_CHARS} caracteres. Incluye contexto cultural relevante si aplica, pero evita detalles técnicos o largos.`;

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
      console.warn(`getPlaceDescriptionIA - Gemini request timed out after ${duration}ms`);
    } else if (!respWrap.ok) {
      console.error('getPlaceDescriptionIA - Gemini error:', respWrap.error?.response?.data || respWrap.error?.message || respWrap.error);
    } else {
      const response = respWrap.value;
      const raw = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      description_es = sanitizeAndLimit(raw, MAX_PLACE_CHARS);
      console.log(`getPlaceDescriptionIA - Gemini responded in ${duration}ms`);
    }
  } catch (err) {
    console.error('getPlaceDescriptionIA - unexpected error:', err?.message || err);
    description_es = '';
  }

  if (!description_es) description_es = 'Descripción no disponible por el momento.';

  // Traducciones (fallback a translateTextGoogle)
  let description_en = 'Description not available at the moment.';
  let description_qu = 'Manaraq kashanmi willakuy.';

  try {
    const trEnWrap = await withTimeout(translateTextGoogle(description_es, 'en'), 8000, null);
    if (trEnWrap && trEnWrap.ok && trEnWrap.value) description_en = trEnWrap.value;
  } catch (e) { /* ignore */ }

  try {
    const trQuWrap = await withTimeout(translateTextGoogle(description_es, 'qu'), 8000, null);
    if (trQuWrap && trQuWrap.ok && trQuWrap.value) description_qu = trQuWrap.value;
  } catch (e) { /* ignore */ }

  return {
    es: description_es,
    en: description_en,
    qu: description_qu
  };
}

/**
 * Obtiene una explicación cultural de Gemini en el idioma targetLang.
 * Devuelve { explanation: string, lang: string }.
 * Prompt diseñado para 2–3 oraciones y máximo MAX_EXPLANATION_CHARS caracteres.
 */
async function getCulturalExplanation(text, labels = [], objects = [], targetLang = 'es') {
  const lang = (String(targetLang || 'es')).toLowerCase().split(/[-_]/)[0];

  // Caso sin contenido
  if ((!text || !String(text).trim()) && (!Array.isArray(labels) || labels.length === 0) && (!Array.isArray(objects) || objects.length === 0)) {
    const baseMsg = 'No se detectó contenido en la imagen para analizar.';
    if (lang === 'es') return { explanation: baseMsg, lang };
    try {
      const trWrap = await withTimeout(translateTextGoogle(baseMsg, lang), 6000, null);
      if (trWrap && trWrap.ok && trWrap.value) return { explanation: trWrap.value, lang };
    } catch (e) { /* ignore */ }
    return { explanation: baseMsg, lang };
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
`;

  // Intento principal con Gemini
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
      console.warn(`getCulturalExplanation - Gemini timed out after ${duration}ms`);
    } else if (!respWrap.ok) {
      console.error('getCulturalExplanation - Gemini error:', respWrap.error?.response?.data || respWrap.error?.message || respWrap.error);
    } else {
      const response = respWrap.value;
      let geminiText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      geminiText = sanitizeAndLimit(geminiText, MAX_EXPLANATION_CHARS);
      if (geminiText) return { explanation: geminiText, lang };
      console.log(`getCulturalExplanation - Gemini responded in ${duration}ms but text was empty/insufficient`);
    }
  } catch (err) {
    console.error('getCulturalExplanation - unexpected Gemini error:', err?.message || err);
  }

  // Fallback: generar en español y traducir si target != 'es'
  const fallbackBaseEs = 'No se pudo generar una explicación cultural en este momento.';
  if (lang === 'es') {
    return { explanation: fallbackBaseEs, lang };
  }

  try {
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
        }
      }
    } else if (respEsWrap && respEsWrap.timeout) {
      console.warn(`getCulturalExplanation (es fallback) - Gemini timed out after ${durEs}ms`);
    } else if (respEsWrap && respEsWrap.error) {
      console.error('getCulturalExplanation (es fallback) - Gemini error:', respEsWrap.error?.response?.data || respEsWrap.error?.message || respEsWrap.error);
    }
  } catch (e) {
    console.warn('getCulturalExplanation - fallback es unexpected error:', e?.message || e);
  }

  // Último recurso: traducir mensaje por defecto
  try {
    const translatedDefaultWrap = await withTimeout(translateTextGoogle(fallbackBaseEs, lang), 6000, null);
    if (translatedDefaultWrap && translatedDefaultWrap.ok && translatedDefaultWrap.value) {
      return { explanation: sanitizeAndLimit(translatedDefaultWrap.value, MAX_EXPLANATION_CHARS), lang };
    } else if (translatedDefaultWrap && translatedDefaultWrap.timeout) {
      console.warn('getCulturalExplanation - translateTextGoogle(default) timed out');
    }
  } catch (e) { /* ignore */ }

  return { explanation: fallbackBaseEs, lang };
}

module.exports = {
  getCulturalExplanation,
  getPlaceDescriptionIA
};