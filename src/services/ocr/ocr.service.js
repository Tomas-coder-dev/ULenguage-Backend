const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const fs = require('fs');

/**
 * Preprocesa la imagen para mejorar el OCR y luego extrae el texto.
 * @param {string} imagePath - Ruta temporal de la imagen recibida.
 * @param {string} lang - Idioma para Tesseract (por ej. 'eng', 'spa', 'que').
 * @returns {Promise<string>} - Texto extraído de la imagen.
 */
exports.processImageAndExtractText = async (imagePath, lang = 'eng') => {
  // Preprocesamiento de imagen: escala de grises, normalización, resize (opcional)
  const processedPath = `${imagePath}_processed.png`;

  await sharp(imagePath)
    .grayscale()
    .normalize()
    //.resize(1024) // opcional: redimensionar si las imágenes suelen ser muy grandes
    .toFile(processedPath);

  // OCR con Tesseract usando los archivos locales de idioma
  const { data: { text } } = await Tesseract.recognize(
    processedPath,
    lang,
    {
      langPath: './tessdata'
    }
  );

  // Borra la imagen procesada
  fs.unlinkSync(processedPath);

  return text;
};