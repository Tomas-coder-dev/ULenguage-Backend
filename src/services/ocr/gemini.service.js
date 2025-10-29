/**
 * server/services/gemini.service.js
 *
 * Encapsula llamadas a la API Generative Language (Gemini) para:
 *  - generar explicaciones culturales breves en el idioma solicitado
 *  - generar descripciones breves de lugares y (opcionalmente) traducirlas
 *
 * Requisitos:
 * - processImageForCulture/ocr.service.js espera que getCulturalExplanation acepte
 *   (text, labels, objects, targetLang) y devuelva { explanation: string, lang: string }.
 *
 * Comportamiento principal:
 * - Le pide explícitamente al LLM que responda en el idioma targetLang.
 * - Limita la longitud de la respuesta.
 * - Tiene fallback: si la respuesta está vacía o insuficiente, intenta una estrategia de respaldo
 *   (reintento o traducción vía translateTextGoogle).
 */

const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const { translateTextGoogle } = require('../translate/translator'); // Ajusta el path si es necesario

const GEMINI_ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

const DEFAULT_TIMEOUT_MS = 14000;
const MAX_EXPLANATION_CHARS = 120;
const MAX_PLACE_CHARS = 150;

/**
 * Helper: ejecuta una promesa con timeout (fallback si expira).
 */
async function withTimeout(promise, ms = DEFAULT_TIMEOUT_MS, fallback = null) {
  let timer;
  const timeout = new Promise((resolve) =>
    timer = setTimeout(() => resolve(fallback), ms)
  );
  const result = await Promise.race([promise, timeout]);
  clearTimeout(timer);
  return result;
}

/**
 * Normaliza y limita texto
 */
function sanitizeAndLimit(text, maxChars) {
  if (!text) return '';
  let s = String(text).trim();
  // eliminar múltiples saltos de línea iniciales/finales
  s = s.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
  if (s.length > maxChars) {
    s = s.slice(0, maxChars - 3).trim() + '...';
  }
  return s;
}

/**
 * Genera una breve descripción turística de un lugar usando Gemini y la traduce a otros idiomas.
 * Mantiene el comportamiento anterior pero con timeouts y fallback robusto.
 * @param {object} place - { name, ... }
 * @returns {Promise<{es: string, en: string, qu: string}>}
 */
async function getPlaceDescriptionIA(place) {
  const placeName = place?.name || 'este lugar';
  const prompt = `
Eres un guía turístico andino. Describe en máximo 2 frases y menos de ${MAX_PLACE_CHARS} caracteres el lugar "${placeName}" en Cusco, Perú, de forma interesante y concisa, en español para turistas.
Incluye contexto cultural si es relevante y evita detalles irrelevantes.
`;

  let description_es = '';
  try {
    const axiosPromise = axios.post(
      GEMINI_ENDPOINT(GEMINI_API_KEY),
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const response = await withTimeout(axiosPromise, DEFAULT_TIMEOUT_MS, null);
    const raw = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    description_es = sanitizeAndLimit(raw, MAX_PLACE_CHARS);
  } catch (err) {
    console.error('getPlaceDescriptionIA - Gemini error:', err?.response?.data || err?.message || err);
    description_es = '';
  }

  if (!description_es) {
    description_es = 'Descripción no disponible por el momento.';
  }

  // Traducciones (fallback a translateTextGoogle). Si fallan, usamos textos por defecto.
  let description_en = 'Description not available at the moment.';
  let description_qu = 'Manaraq kashanmi willakuy.'; // ejemplo fallback en quechua

  try {
    const trEn = await withTimeout(translateTextGoogle(description_es, 'en'), 8000, null);
    if (trEn) description_en = trEn;
  } catch (e) { /* ignore */ }

  try {
    const trQu = await withTimeout(translateTextGoogle(description_es, 'qu'), 8000, null);
    if (trQu) description_qu = trQu;
  } catch (e) { /* ignore */ }

  return {
    es: description_es,
    en: description_en,
    qu: description_qu
  };
}

/**
 * Obtiene una explicación cultural breve y precisa de Gemini en el idioma targetLang.
 * - Devuelve un objeto: { explanation: string, lang: targetLang }
 * - Si Gemini falla o devuelve vacío, intenta fallback con translateTextGoogle.
 *
 * @param {string} text - texto detectado (puede estar vacío)
 * @param {string[]} labels - etiquetas detectadas por Vision
 * @param {object[]} objects - array de objetos detectados (pueden tener .name, .score, boundingBox)
 * @param {string} targetLang - 'es'|'en'|'qu' etc
 * @returns {Promise<{explanation: string, lang: string}>}
 */
async function getCulturalExplanation(text, labels = [], objects = [], targetLang = 'es') {
  // Seguridad: normalizar targetLang
  const lang = (String(targetLang || 'es')).toLowerCase().split(/[-_]/)[0];

  // Si no hay nada que analizar, devolver mensaje corto en targetLang
  if ((!text || !String(text).trim()) && (!Array.isArray(labels) || labels.length === 0) && (!Array.isArray(objects) || objects.length === 0)) {
    const baseMsg = 'No se detectó contenido en la imagen para analizar.';
    if (lang === 'es') return { explanation: baseMsg, lang };
    // intentar traducir el mensaje base al idioma solicitado
    try {
      const tr = await withTimeout(translateTextGoogle(baseMsg, lang), 6000, null);
      return { explanation: tr || baseMsg, lang };
    } catch (e) {
      return { explanation: baseMsg, lang };
    }
  }

  // Construir prompt pidiendo la respuesta en el idioma deseado
  const labelsStr = Array.isArray(labels) && labels.length ? labels.join(', ') : 'Ninguno';
  const objectsStr = Array.isArray(objects) && objects.length ? objects.map(o => o.name || '').join(', ') : '';

  const prompt = `
Analiza el contenido de la imagen y proporciona UNA explicación cultural MUY BREVE.
Texto detectado: "${text && String(text).trim() ? String(text).trim() : 'Ninguno'}"
Etiquetas/objetos detectados: ${labelsStr}
${objectsStr ? `Objetos destacados: ${objectsStr}` : ''}

Tarea: Da una explicación cultural muy breve (máx 2 oraciones y menos de ${MAX_EXPLANATION_CHARS} caracteres) sobre este contenido en contexto andino.
Responde EN EL IDIOMA: ${lang}.
Sé claro, directo y conciso. Evita respuestas largas, juicios políticos o información no verificada.
`;

  // Llamada a Gemini con timeout
  let geminiText = '';
  try {
    const axiosPromise = axios.post(
      GEMINI_ENDPOINT(GEMINI_API_KEY),
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const response = await withTimeout(axiosPromise, DEFAULT_TIMEOUT_MS, null);
    geminiText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    geminiText = sanitizeAndLimit(geminiText, MAX_EXPLANATION_CHARS);
  } catch (err) {
    console.error('getCulturalExplanation - Gemini error:', err?.response?.data || err?.message || err);
    geminiText = '';
  }

  // Si Gemini devolvió algo válido, lo retornamos (ya en targetLang porque lo pedimos en el prompt)
  if (geminiText && geminiText.length > 0) {
    return { explanation: geminiText, lang };
  }

  // --- Fallback: si Gemini falla o devuelve vacío ---
  // Estrategia: intentar generar en español (si target != 'es') y traducirlo,
  // o simplemente devolver un mensaje por defecto traducido.
  const fallbackBaseEs = 'No se pudo generar una explicación cultural en este momento.';
  if (lang === 'es') {
    // si pedían español y falló, devolver mensaje en español
    return { explanation: fallbackBaseEs, lang };
  }

  // intentamos generar en español como respaldo
  let geminiEs = '';
  try {
    const promptEs = prompt + '\nResponde en el idioma: es.'; // forzar español
    const axiosPromise = axios.post(
      GEMINI_ENDPOINT(GEMINI_API_KEY),
      { contents: [{ parts: [{ text: promptEs }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const respEs = await withTimeout(axiosPromise, DEFAULT_TIMEOUT_MS, null);
    geminiEs = respEs?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    geminiEs = sanitizeAndLimit(geminiEs, MAX_EXPLANATION_CHARS);
  } catch (err) {
    console.error('getCulturalExplanation - Gemini fallback (es) error:', err?.response?.data || err?.message || err);
    geminiEs = '';
  }

  // Si conseguimos algo en español, intentamos traducirlo al idioma pedido
  if (geminiEs) {
    try {
      const translated = await withTimeout(translateTextGoogle(geminiEs, lang), 8000, null);
      if (translated && String(translated).trim().length > 0) {
        return { explanation: sanitizeAndLimit(translated, MAX_EXPLANATION_CHARS), lang };
      }
    } catch (e) {
      console.warn('getCulturalExplanation - translate fallback failed:', e?.message || e);
    }
  }

  // Último recurso: traducir mensaje por defecto
  try {
    const translatedDefault = await withTimeout(translateTextGoogle(fallbackBaseEs, lang), 6000, null);
    return { explanation: sanitizeAndLimit(translatedDefault || fallbackBaseEs, MAX_EXPLANATION_CHARS), lang };
  } catch (e) {
    return { explanation: fallbackBaseEs, lang };
  }
}

module.exports = {
  getCulturalExplanation,
  getPlaceDescriptionIA
};