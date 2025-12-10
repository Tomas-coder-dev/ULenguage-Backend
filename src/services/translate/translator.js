const { Translate } = require('@google-cloud/translate').v2;
const QuechuaCusqueno = require('../../models/QuechuaCusqueno');
const { scrapeGlosbe } = require('./glosbeScraper');

const translate = new Translate();

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
      
      // Búsqueda exacta por spanish
      let term = await QuechuaCusqueno.findOne({ spanish: spanishNorm })
        .sort({ frequency: -1 }) // Prioriza más frecuentes
        .lean();
      
      // Si no encuentra, buscar en variants (ortografías alternativas)
      if (!term) {
        term = await QuechuaCusqueno.findOne({ variants: spanishNorm })
          .sort({ frequency: -1 })
          .lean();
      }
      
      // Si no encuentra, intentar búsqueda por texto completo (fuzzy)
      if (!term) {
        const fuzzyResults = await QuechuaCusqueno.find(
          { $text: { $search: spanishNorm } },
          { score: { $meta: 'textScore' } }
        )
        .sort({ score: { $meta: 'textScore' }, frequency: -1 })
        .limit(3)
        .lean();
        
        if (fuzzyResults && fuzzyResults.length > 0) {
          term = fuzzyResults[0];
          // Devolver también candidatos fuzzy
          const fuzzyCandidates = fuzzyResults.map(t => ({ 
            value: t.quechua_cusqueno, 
            provider: 'db-fuzzy',
            spanish: t.spanish,
            score: t.score
          }));
          
          // Incrementar frequency del término usado
          await QuechuaCusqueno.findByIdAndUpdate(term._id, { $inc: { frequency: 1 } });
          
          return { 
            translation: term.quechua_cusqueno, 
            source: 'db-fuzzy', 
            candidates: fuzzyCandidates, 
            variantUsed: spanishNorm 
          };
        }
      }
      
      if (term && term.quechua_cusqueno) {
        // Incrementar frequency del término usado
        await QuechuaCusqueno.findByIdAndUpdate(term._id, { $inc: { frequency: 1 } });
        
        return { 
          translation: term.quechua_cusqueno, 
          source: 'db', 
          candidates: [{ value: term.quechua_cusqueno, provider: 'db', spanish: term.spanish }], 
          variantUsed: spanishNorm 
        };
      }
    }
  } catch (err) {
    const { warn } = require('../../utils/logger');
    warn('translateTextHybridDetailed: DB lookup error: %s', err.message || err);
  }

  // 2) Try Glosbe with variants
  const variants = generateVariants(text);
  for (const variant of variants) {
    try {
      const glosbeResults = await scrapeGlosbe(source, target, variant);
      if (Array.isArray(glosbeResults) && glosbeResults.length > 0) {
        // Filter out candidates that are identical to the query (case-insensitive)
        let filtered = glosbeResults.filter(r => r.toLowerCase().trim() !== String(variant).toLowerCase().trim());

        // Remove obvious noise coming from the site (brand, UI labels) or too-short tokens
        filtered = filtered.filter(r => {
          if (!r) return false;
          const low = r.toLowerCase().trim();
          if (low.includes('glosbe') || low.includes('translate') || low.includes('tradu')) return false;
          // discard entries with less than 2 letters or mostly non-letter content
          const letters = (low.match(/[a-záéíóúñü\w]/gi) || []).length;
          if (letters < 2) return false;
          // discard if it's purely punctuation or digits
          if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(low)) return false;
          return true;
        });

        // If after filtering we have valid candidates, use them; else fall back to raw results
        const candidatesList = filtered.length > 0 ? filtered : glosbeResults;

        // If candidatesList still contains only noise (e.g., 'glosbe'), skip this variant
        const onlyNoise = candidatesList.every(r => {
          const low = String(r).toLowerCase();
          return low.includes('glosbe') || low.trim().length === 0;
        });
        if (onlyNoise) {
          const { warn } = require('../../utils/logger');
          warn('translateTextHybridDetailed: Glosbe returned only noisy candidates for variant "%s": %o', variant, glosbeResults);
          continue; // try next variant
        }

        const exact = candidatesList.find(r => r.toLowerCase() === variant.toLowerCase());
        const chosen = exact || candidatesList[0];
        const candidates = candidatesList.map(v => ({ value: v, provider: 'glosbe' }));

        // If the chosen candidate equals the variant (no real translation), skip and continue
        if (String(chosen).toLowerCase().trim() === String(variant).toLowerCase().trim()) {
          continue;
        }

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
    const { error } = require('../../utils/logger');
    error('translateTextHybridDetailed - Google Translate error: %s', err.message || err);
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
    const { error: logError } = require('../../utils/logger');
    logError('ERROR en Google Translate API: %o', error);
    return "Error en la traducción automática.";
  }
}

module.exports = { translateTextHybrid, translateTextHybridDetailed, translateTextGoogle };
