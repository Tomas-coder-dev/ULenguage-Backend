const { Translate } = require('@google-cloud/translate').v2;
const QuechuaCusqueno = require('../../models/QuechuaCusqueno');
const { scrapeGlosbe } = require('../glosbeScraper');

const translate = new Translate();

// friendly messages
const messages = {
  es: "Palabra no encontrada.",
  en: "Word not found.",
  quz: "Simikuwanqachu tariq.",
  qu: "Simikuwanqachu tariq."
};

function normLang(code) {
  if (!code) return 'und';
  return String(code).toLowerCase().split(/[-_]/)[0];
}

function removeAccents(s) {
  if (!s) return s;
  const accentMap = { 'á':'a','é':'e','í':'i','ó':'o','ú':'u','Á':'A','É':'E','Í':'I','Ó':'O','Ú':'U','ñ':'n','Ñ':'N' };
  return s.split('').map(c => accentMap[c] || c).join('');
}

function normalizeQuery(s) {
  if (!s) return '';
  let out = String(s).trim().toLowerCase();
  out = out.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\"?¿¡]/g, '');
  out = out.replace(/\s{2,}/g, ' ');
  return out;
}

function generateVariants(text) {
  const norm = normalizeQuery(text);
  if (!norm) return [];
  const set = new Set();
  set.add(norm);
  set.add(removeAccents(norm));
  if (norm.endsWith('s') && norm.length > 3) {
    set.add(norm.slice(0, -1));
    set.add(removeAccents(norm.slice(0, -1)));
  }
  set.add(norm.replace(/^(el |la |los |las |un |una )/, ''));
  set.add(removeAccents(norm.replace(/^(el |la |los |las |un |una )/, '')));
  return Array.from(set);
}

/**
 * translateTextHybridDetailed
 * Returns: { translation, source: 'db'|'glosbe'|'google'|'none', candidates: [], variantUsed }
 */
async function translateTextHybridDetailed(text, sourceLanguage, targetLanguage) {
  const source = normLang(sourceLanguage);
  const target = normLang(targetLanguage);

  if (!text || !source || !target) {
    return { translation: messages[target] || 'Palabra no encontrada.', source: 'none', candidates: [], variantUsed: null };
  }

  // 1) DB lookup for Spanish -> Quechua (support both 'quz' and 'qu')
  try {
    if (source === 'es' && (target === 'quz' || target === 'qu')) {
      const spanishNorm = String(text).trim().toLowerCase();
      const term = await QuechuaCusqueno.findOne({ spanish: spanishNorm }).lean();
      if (term && term.quenchua_cusqueno) {
        return { translation: term.quenchua_cusqueno, source: 'db', candidates: [{ value: term.quenchua_cusqueno, provider: 'db' }], variantUsed: spanishNorm };
      }
      // also tolerate field name quechua_cusqueno (model uses quechua_cusqueno)
      if (term && term.quew) { /* nothing, safety placeholder */ }
    }
  } catch (err) {
    console.warn('translateTextHybridDetailed: DB lookup error', err.message || err);
  }

  // 2) Try Glosbe with variants
  const variants = generateVariants(text);
  for (const variant of variants) {
    try {
      const glosbeResults = await scrapeGlosbe(source, target, variant);
      if (Array.isArray(glosbeResults) && glosbeResults.length > 0) {
        // prefer exact match (case-insensitive) else first
        const exact = glosbeResults.find(r => r.toLowerCase() === variant.toLowerCase());
        const chosen = exact || glosbeResults[0];
        const candidates = glosbeResults.map(v => ({ value: v, provider: 'glosbe' }));
        return { translation: chosen, source: 'glosbe', candidates, variantUsed: variant };
      }
    } catch (err) {
      // continue to next variant
    }
  }

  // 3) Fallback to Google Translate (or other IA)
  try {
    let [translations] = await translate.translate(text, target);
    translations = Array.isArray(translations) ? translations : [translations];
    const googleTranslation = translations[0];
    if (googleTranslation && googleTranslation.trim().length > 0 && googleTranslation.toLowerCase() !== String(text).toLowerCase()) {
      return { translation: googleTranslation, source: 'google', candidates: [{ value: googleTranslation, provider: 'google' }], variantUsed: null };
    }
  } catch (err) {
    console.error('translateTextHybridDetailed - Google Translate error:', err.message || err);
  }

  // 4) No result
  return { translation: messages[target] || 'Palabra no encontrada.', source: 'none', candidates: [], variantUsed: null };
}

// Legacy function kept for backward compatibility (returns string)
async function translateTextHybrid(text, sourceLanguage, targetLanguage) {
  const det = await translateTextHybridDetailed(text, sourceLanguage, targetLanguage);
  return det.translation;
}

/**
 * Traducción directa con Google Translate (mantengo)
 */
async function translateTextGoogle(text, targetLanguage) {
  try {
    let [translations] = await translate.translate(text, targetLanguage);
    translations = Array.isArray(translations) ? translations : [translations];
    const googleTranslation = translations[0];
    if (googleTranslation && googleTranslation.trim().toLowerCase() !== text.trim().toLowerCase()) {
      return googleTranslation;
    }
    return "No se pudo traducir el texto.";
  } catch (error) {
    console.error('ERROR en Google Translate API:', error);
    return "Error en la traducción automática.";
  }
}

module.exports = { translateTextHybrid, translateTextHybridDetailed, translateTextGoogle };