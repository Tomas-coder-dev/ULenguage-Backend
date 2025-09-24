const { Translate } = require('@google-cloud/translate').v2;

// Inicializa el cliente de traducción apuntando a tu archivo de credenciales.
// La librería buscará el archivo en la raíz del proyecto.
const translate = new Translate({
  keyFilename: 'google-credentials.json' 
});

async function translateTextGoogle(text, targetLanguage) {
  try {
    // Llama a la API de Google
    let [translations] = await translate.translate(text, targetLanguage);
    
    // Aseguramos que la respuesta sea siempre un array
    translations = Array.isArray(translations) ? translations : [translations];
    
    // Devuelve el primer (y único) resultado
    return translations[0]; 
  } catch (error) {
    console.error('ERROR en Google Translate API:', error);
    // Propagamos el error para que el controlador lo maneje
    throw new Error('La traducción falló en el servicio de Google.');
  }
}

module.exports = { translateTextGoogle };