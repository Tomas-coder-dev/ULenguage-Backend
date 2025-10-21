const { analyzeImageWithVision } = require('./vision.service');
const { getCulturalExplanation } = require('./gemini.service');
const { translateTextHybrid } = require('../translate/translator'); // usa el híbrido

/**
 * Procesa una imagen y devuelve arrays de textos, objetos, etiquetas y explicaciones culturales.
 * @param {string} imagePath - Ruta de la imagen.
 * @param {string} targetLang - Idioma destino (ej: 'es', 'en', 'qu')
 * @returns {Promise<object>}
 */
async function processImageForCulture(imagePath, targetLang = 'es') {
  const { text, lang, labels, objects } = await analyzeImageWithVision(imagePath, [targetLang, 'es', 'qu', 'en']);

  // Divide el texto detectado por saltos de línea o por palabras clave, si hay varios
  const texts = text ? text.split('\n').map(t => t.trim()).filter(Boolean) : [];

  // Genera explicación cultural para cada texto y cada objeto detectado
  const explanations = [];
  for (const t of texts) {
    const explanation = await getCulturalExplanation(t, labels, objects, targetLang);
    explanations.push(explanation);
  }
  for (const obj of objects) {
    const explanation = await getCulturalExplanation('', [obj.name], [obj], targetLang);
    explanations.push(explanation);
  }

  // Traducción híbrida para cada texto detectado
  const translations = [];
  for (const t of texts) {
    const translation = await translateTextHybrid(t, lang, targetLang);
    translations.push(translation);
  }

  return {
    texts,
    detectedLang: lang,
    labels,
    objects,
    explanations,
    translations,
    explanationLang: targetLang
  };
}

/**
 * Alias para endpoint /api/ocr/analyze-and-translate
 */
async function processAndTranslate(imagePath, targetLang = 'es') {
  // Si quieres lógica diferente, ponla aquí. Si no, solo llama al anterior:
  return await processImageForCulture(imagePath, targetLang);
}

module.exports = { processImageForCulture, processAndTranslate };