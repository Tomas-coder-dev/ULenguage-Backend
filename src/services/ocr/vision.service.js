<<<<<<< HEAD
=======
/**
 * server/services/vision.service.js
 *
 * Wrapper robusto para Google Cloud Vision ImageAnnotatorClient.
 * - Realiza OCR (textDetection / documentTextDetection) con sugerencias de idioma.
 * - Extrae idioma detectado de forma segura (revisando páginas / propiedades).
 * - Obtiene etiquetas (labelDetection) y objetos localizados (objectLocalization).
 * - Maneja errores y devuelve estructuras limpias y predecibles.
 *
 * Nota: requiere que GOOGLE_APPLICATION_CREDENTIALS esté configurado en el entorno
 * para que ImageAnnotatorClient funcione correctamente.
 */

>>>>>>> main
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

/**
<<<<<<< HEAD
=======
 * Intenta extraer el idioma detectado del fullTextAnnotation de forma segura.
 * Recorre páginas y detectedLanguages y devuelve el primer code encontrado.
 */
function extractDetectedLang(fullTextAnnotation) {
  try {
    if (!fullTextAnnotation || !Array.isArray(fullTextAnnotation.pages)) return 'und';
    for (const page of fullTextAnnotation.pages) {
      if (page?.property?.detectedLanguages && page.property.detectedLanguages.length > 0) {
        const code = page.property.detectedLanguages[0]?.languageCode;
        if (code) return String(code).toLowerCase();
      }
    }
    // fallback: try to inspect other levels (blocks/paragraphs) if needed
    return 'und';
  } catch (e) {
    return 'und';
  }
}

/**
>>>>>>> main
 * Analiza una imagen con Google Vision API.
 * @param {string} imagePath - Ruta del archivo de imagen.
 * @param {string[]} languageHints - Sugerencias de idioma para OCR (ej: ['es', 'qu', 'en'])
 * @returns {Promise<{text: string, lang: string, labels: string[], objects: object[]}>}
 */
async function analyzeImageWithVision(imagePath, languageHints = ['es', 'qu', 'en']) {
<<<<<<< HEAD
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
=======
  try {
    // Usar documentTextDetection para OCR más completo (incluye fullTextAnnotation)
    const [textDetectionResult] = await client.documentTextDetection({
      image: { source: { filename: imagePath } },
      imageContext: { languageHints }
    });

    const fullTextAnnotation = textDetectionResult.fullTextAnnotation || null;
    const rawText = fullTextAnnotation && fullTextAnnotation.text ? String(fullTextAnnotation.text) : '';
    // Limpiar texto: trim y normalizar saltos de línea
    const text = rawText ? rawText.trim().replace(/\r\n/g, '\n') : '';

    const lang = extractDetectedLang(fullTextAnnotation);

    // Label detection (etiquetas generales)
    let labels = [];
    try {
      const [labelDetectionResult] = await client.labelDetection({
        image: { source: { filename: imagePath } }
      });
      if (labelDetectionResult && Array.isArray(labelDetectionResult.labelAnnotations)) {
        labels = labelDetectionResult.labelAnnotations.map(label => label.description).filter(Boolean);
      }
    } catch (labelErr) {
      console.warn('Vision labelDetection failed:', labelErr?.message || labelErr);
      labels = [];
    }

    // Object localization (objetos con bounding box y score)
    let objects = [];
    try {
      const [objectDetectionResult] = await client.objectLocalization({
        image: { source: { filename: imagePath } }
      });
      const localized = objectDetectionResult && Array.isArray(objectDetectionResult.localizedObjectAnnotations)
        ? objectDetectionResult.localizedObjectAnnotations
        : [];

      objects = localized.map(obj => {
        // normalizedVertices puede venir como undefined en casos raros
        const boundingBox = Array.isArray(obj.boundingPoly?.normalizedVertices)
          ? obj.boundingPoly.normalizedVertices.map(v => ({ x: v.x, y: v.y }))
          : (Array.isArray(obj.normalizedVertices) ? obj.normalizedVertices : null);

        return {
          name: obj.name || '',
          score: typeof obj.score === 'number' ? obj.score : (obj.score ? Number(obj.score) : 0),
          boundingBox
        };
      });
    } catch (objErr) {
      console.warn('Vision objectLocalization failed or no objects found:', objErr?.message || objErr);
      objects = [];
    }

    return { text, lang, labels, objects };
  } catch (err) {
    // En caso de error global, logueamos y devolvemos estructura vacía para que el servicio superior maneje el fallback.
    console.error('analyzeImageWithVision error:', err?.message || err);
    return { text: '', lang: 'und', labels: [], objects: [] };
  }
>>>>>>> main
}

module.exports = { analyzeImageWithVision };