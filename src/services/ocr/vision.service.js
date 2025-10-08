const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

/**
 * Analiza una imagen con Google Vision API.
 * @param {string} imagePath - Ruta del archivo de imagen.
 * @param {string[]} languageHints - Sugerencias de idioma para OCR (ej: ['es', 'qu', 'en'])
 * @returns {Promise<{text: string, lang: string, labels: string[], objects: object[]}>}
 */
async function analyzeImageWithVision(imagePath, languageHints = ['es', 'qu', 'en']) {
  // OCR con sugerencia de idioma
  const [textDetectionResult] = await client.textDetection({
    image: { source: { filename: imagePath } },
    imageContext: { languageHints }
  });
  const fullTextAnnotation = textDetectionResult.fullTextAnnotation;
  const text = fullTextAnnotation ? fullTextAnnotation.text.trim() : '';
  const lang = fullTextAnnotation ? (fullTextAnnotation.pages[0]?.property?.detectedLanguages[0]?.languageCode || 'und') : 'und';

  // Detección de objetos/etiquetas
  const [labelDetectionResult] = await client.labelDetection(imagePath);
  const labels = labelDetectionResult.labelAnnotations.map(label => label.description);

  // Detección avanzada de objetos (bounding box y score)
  const [objectDetectionResult] = await client.objectLocalization(imagePath);
  const objects = objectDetectionResult.localizedObjectAnnotations.map(obj => ({
    name: obj.name,
    score: obj.score,
    boundingBox: obj.boundingPoly.normalizedVertices
  }));

  return { text, lang, labels, objects };
}

module.exports = { analyzeImageWithVision };