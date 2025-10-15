const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const { translateTextGoogle } = require('../translate/translator'); // Ajusta el path si es necesario

/**
 * Obtiene una explicación cultural breve y precisa de Gemini y la traduce si es necesario.
 * @param {string} text - Texto extraído de la imagen.
 * @param {string[]} labels - Etiquetas de la imagen.
 * @param {object[]} objects - Detalles avanzados de objetos (opcional)
 * @param {string} targetLang - Idioma destino ('es', 'en', 'qu', etc.)
 * @returns {Promise<string>}
 */
async function getCulturalExplanation(text, labels, objects = [], targetLang = 'es') {
  if (!text && labels.length === 0 && objects.length === 0) {
    return "No se detectó contenido en la imagen para analizar.";
  }

  // Prompt mejorado: pide explicación muy breve y clara
  let prompt = `
Analiza el contenido de la imagen.
Texto detectado: "${text || 'Ninguno'}"
Etiquetas/objetos detectados: ${labels.length > 0 ? labels.join(', ') : 'Ninguno'}
${objects.length > 0 ? `Objetos destacados: ${objects.map(o => o.name).join(', ')}` : ''}

Tarea: Da una explicación cultural muy breve (máx 2 oraciones y menos de 120 caracteres) sobre este contenido en contexto andino. Sé claro, directo y conciso. Evita respuestas largas.
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

    // Limitar a 120 caracteres para asegurar brevedad
    explanation = explanation.length > 120 ? explanation.slice(0, 117).trim() + '...' : explanation.trim();

    // Traducir explicación si el idioma destino no es español
    if (targetLang && targetLang !== 'es') {
      explanation = await translateTextGoogle(explanation, targetLang.trim());
    }

    return explanation;
  } catch (error) {
    console.error("Error al llamar a Gemini API:", error.response?.data || error.message);
    return 'Hubo un error al conectar con la IA para generar la explicación.';
  }
}

module.exports = { getCulturalExplanation };