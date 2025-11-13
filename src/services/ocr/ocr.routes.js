const express = require('express');
const multer = require('multer');
const path = require('path');
const { analyzeAndExplain, analyzeExplainAndTranslate, getOcrStatus } = require('./ocr.controller');

const router = express.Router();

// Configuración de Multer con límites y filtros
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB máximo
    files: 1 // Solo un archivo por request
  },
  fileFilter: (req, file, cb) => {
    // Validar tipos MIME aceptados
    const allowedMimes = ['image/jpeg', 'image/pjpeg', 'image/jpg', 'image/png', 'image/webp'];
    // Validar extensiones aceptadas (por si el mimetype no es fiable)
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];

    const ext = path.extname(file.originalname || '').toLowerCase();

    if (allowedMimes.includes((file.mimetype || '').toLowerCase()) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'), false);
    }
  }
});

// --- NUEVAS RUTAS CON IA ---
// Health check del servicio OCR
router.get('/status', getOcrStatus);

// Ruta principal que usa Vision y Gemini
router.post('/analyze', upload.single('image'), analyzeAndExplain);

// Ruta que además traduce el resultado
router.post('/analyze-and-translate', upload.single('image'), analyzeExplainAndTranslate);

// Middleware para manejar errores de Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'La imagen es demasiado grande. Tamaño máximo: 5 MB.',
        code: 'FILE_TOO_LARGE',
        maxSize: '5 MB'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Solo se permite subir un archivo.',
        code: 'TOO_MANY_FILES'
      });
    }
    return res.status(400).json({ 
      message: 'Error al subir archivo.',
      code: 'UPLOAD_ERROR',
      details: error.message
    });
  }
  
  if (error && error.message === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ 
      message: 'Tipo de archivo no válido. Usa: JPG, JPEG, PNG o WEBP.',
      code: 'INVALID_FILE_TYPE',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', '.jpeg']
    });
  }
  
  next(error);
});

// --- RUTAS ANTIGUAS (si quieres mantenerlas) ---
// const { extractText, extractTextAutoLang, extractTextAndTranslate } = require('./ocr.controller');
// router.post('/extract-text', upload.single('image'), extractText);
// router.post('/extract-text-auto', upload.single('image'), extractTextAutoLang);
// router.post('/extract-text-and-translate', upload.single('image'), extractTextAndTranslate);

module.exports = router;