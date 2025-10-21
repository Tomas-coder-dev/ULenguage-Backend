const axios = require('axios');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const { translateTextGoogle } = require('../translate/translator'); // Ajusta el path si es necesario

/**
 * Genera una breve descripción turística de un lugar usando Gemini y la traduce a otros idiomas.
 * @param {object} place - Objeto de Google Places API (debe tener al menos name, type, location).
 * @returns {Promise<{es: string, en: string, qu: string}>}
 */
async function getPlaceDescriptionIA(place) {
  // Construye un prompt descriptivo y breve
  const prompt = `
Eres un guía turístico andino. Describe en máximo 2 frases y menos de 150 caracteres el lugar "${place.name}" en Cusco, Perú, de forma interesante, en español, para turistas.
Incluye contexto cultural si es relevante.
`;

  let description_es;
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    description_es = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    // Limitar longitud
    if (description_es && description_es.length > 150) {
      description_es = description_es.slice(0, 147).trim() + '...';
    }
  } catch (error) {
    console.error("Error generando descripción Gemini:", error.response?.data || error.message);
  }

  // Fallback a mensaje por defecto si la IA falla
  if (!description_es) {
    description_es = "Descripción no disponible por el momento.";
  }

  // Traduce al inglés y quechua
  let description_en = "Description not available at the moment.";
  let description_qu = "Manaraq kashanmi willakuy.";
  try {
    description_en = await translateTextGoogle(description_es, 'en');
  } catch {}
  try {
    description_qu = await translateTextGoogle(description_es, 'qu');
  } catch {}

  return {
    es: description_es,
    en: description_en || "Description not available at the moment.",
    qu: description_qu || "Manaraq kashanmi willakuy."
  };
}

/**
 * Obtiene una explicación cultural breve y precisa de Gemini y la traduce si es necesario.
 * @param {string} text
 * @param {string[]} labels
 * @param {object[]} objects
 * @param {string} targetLang
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

module.exports = {
  getCulturalExplanation,
  getPlaceDescriptionIA
};