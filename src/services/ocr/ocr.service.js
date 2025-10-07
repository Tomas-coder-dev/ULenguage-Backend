const { analyzeImageWithVision } = require('./vision.service');
const { getCulturalExplanation } = require('./gemini.service');
const { translateTextGoogle } = require('../translate/translator'); // Mantienes tu traductor

/**
 * Procesa una imagen para obtener OCR y explicación cultural, con idioma elegible.
 * @param {string} imagePath - Ruta de la imagen.
 * @param {string} targetLang - Idioma destino para la explicación (ej: 'es', 'en', 'qu'). Default: 'es'
 * @returns {Promise<object>}
 */
async function processImageForCulture(imagePath, targetLang = 'es') {
  const { text, lang, labels } = await analyzeImageWithVision(imagePath);
  let culturalExplanation = await getCulturalExplanation(text, labels);

  // Traducir la explicación cultural si el idioma destino es distinto de español
  if (targetLang && targetLang !== 'es') {
    culturalExplanation = await translateTextGoogle(culturalExplanation, targetLang);
  }

  return {
    text,
    detectedLang: lang,
    labels,
    culturalExplanation,
    explanationLang: targetLang
  };
}

/**
 * Procesa, obtiene explicación y traduce tanto el texto como la explicación.
 * @param {string} imagePath - Ruta de la imagen.
 * @param {string} targetLang - Idioma destino para la traducción (ej: 'es', 'en', 'qu').
 * @returns {Promise<object>}
 */
async function processAndTranslate(imagePath, targetLang = 'es') {
    const { text, detectedLang, labels, culturalExplanation } = await processImageForCulture(imagePath, targetLang);
    
    // Traduce tanto el texto original como la explicación
    const translatedText = await translateTextGoogle(text, targetLang);
    // culturalExplanation ya está traducida si targetLang !== 'es' por la función anterior
    // Pero si quieres aún forzar la traducción aquí, puedes hacerlo así:
    const translatedExplanation = await translateTextGoogle(culturalExplanation, targetLang);

    return {
        text,
        detectedLang,
        labels,
        culturalExplanation, // Ya traducida si targetLang !== 'es'
        translatedText,
        translatedExplanation,
        targetLang
    };
}

module.exports = { processImageForCulture, processAndTranslate };