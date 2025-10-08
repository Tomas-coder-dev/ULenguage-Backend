const { Translate } = require('@google-cloud/translate').v2;
const translate = new Translate({ keyFilename: 'google-credentials.json' });
const QuechuaCusqueno = require('../../models/QuechuaCusqueno');
const { scrapeGlosbe } = require('./glosbeScraper');

// Mensajes amigables para "palabra no encontrada" en varios idiomas
const messages = {
  es: "Palabra no encontrada.",
  en: "Word not found.",
  quz: "Simikuwanqachu tariq.",
  qu: "Simikuwanqachu tariq."
  // Puedes agregar más idiomas aquí si lo necesitas
};

/**
 * Traduce texto entre cualquier par de idiomas, priorizando:
 * 1. MongoDB (solo cuando source='es' y target='quz')
 * 2. Scraping Glosbe
 * 3. Google Translate como respaldo
 * 4. Mensaje amigable si no se encuentra ninguna traducción
 */
async function translateTextHybrid(text, sourceLanguage, targetLanguage) {
  // 1. Busca en MongoDB solo si es español → quechua cusqueño
  if (sourceLanguage === 'es' && targetLanguage === 'quz') {
    const term = await QuechuaCusqueno.findOne({ spanish: text.trim().toLowerCase() });
    if (term) {
      return term.quechua_cusqueno;
    }
    // Si no está, sigue al scraper...
  }

  // 2. Scraper para cualquier combinación
  const glosbeResults = await scrapeGlosbe(sourceLanguage, targetLanguage, text);
  if (glosbeResults.length > 0) {
    return glosbeResults[0];
  }

  // 3. Google Translate como respaldo
  try {
    let [translations] = await translate.translate(text, targetLanguage);
    translations = Array.isArray(translations) ? translations : [translations];
    const googleTranslation = translations[0];
    // Si Google devuelve exactamente el mismo texto, consideramos que no encontró traducción
    if (googleTranslation && googleTranslation.trim().toLowerCase() !== text.trim().toLowerCase()) {
      return googleTranslation;
    }
  } catch (error) {
    console.error('ERROR en Google Translate API:', error);
    // Si Google falla, sigue con mensaje por defecto
  }

  // 4. Si no se encuentra, retorna mensaje en el idioma de destino
  return messages[targetLanguage] || "Palabra no encontrada.";
}

/**
 * Traducción directa con Google Translate
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

module.exports = { translateTextHybrid, translateTextGoogle };