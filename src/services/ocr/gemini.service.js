const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const { translateTextGoogle } = require('../translate/translator'); // Ajusta el path si es necesario

/**
 * Obtiene una explicación cultural de Gemini y la traduce si es necesario.
 * @param {string} text - Texto extraído de la imagen.
 * @param {string[]} labels - Etiquetas de la imagen.
 * @param {string} targetLang - Idioma destino ('es', 'en', 'qu', etc.)
 * @returns {Promise<string>}
 */
async function getCulturalExplanation(text, labels, targetLang = 'es') {
  if (!text && labels.length === 0) {
    return "No se detectó contenido en la imagen para analizar.";
  }

  const prompt = `
    Analiza el siguiente contenido extraído de una imagen:
    - Texto detectado: "${text || 'Ninguno'}"
    - Objetos/conceptos detectados: ${labels.join(', ')}

    Tarea: Proporciona una breve explicación cultural sobre este contenido, enfocándote en el contexto andino (Perú, Bolivia, Ecuador). Si el contenido no parece tener relación, indícalo. Usa un tono educativo y respetuoso.
  `;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    let explanation = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar una explicación.';

    // Traducir la explicación si el idioma destino no es español
    if (targetLang && targetLang !== 'es') {
      explanation = await translateTextGoogle(explanation, targetLang);
    }

    return explanation;
  } catch (error) {
    console.error("Error al llamar a Gemini API:", error.response?.data || error.message);
    return 'Hubo un error al conectar con la IA para generar la explicación.';
  }
}

module.exports = { getCulturalExplanation };