const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

/**
 * Analiza una imagen con Google Vision API.
 * @param {string} imagePath - Ruta del archivo de imagen.
 * @returns {Promise<{text: string, lang: string, labels: string[]}>}
 */
async function analyzeImageWithVision(imagePath) {
  // Realiza OCR y detección de idioma al mismo tiempo
  const [textDetectionResult] = await client.textDetection(imagePath);
  const fullTextAnnotation = textDetectionResult.fullTextAnnotation;
  const text = fullTextAnnotation ? fullTextAnnotation.text : '';
  const lang = fullTextAnnotation ? (fullTextAnnotation.pages[0]?.property?.detectedLanguages[0]?.languageCode || 'und') : 'und';

  // Detección de objetos/etiquetas
  const [labelDetectionResult] = await client.labelDetection(imagePath);
  const labels = labelDetectionResult.labelAnnotations.map(label => label.description);

  return { text, lang, labels };
}

module.exports = { analyzeImageWithVision };