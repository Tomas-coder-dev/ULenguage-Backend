const express = require('express');
const multer = require('multer');
const { extractText, extractTextAutoLang, extractTextAndTranslate } = require('./ocr.controller');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/extract-text', upload.single('image'), extractText);
router.post('/extract-text-auto', upload.single('image'), extractTextAutoLang);

// NUEVA RUTA: OCR + Detección de idioma + Traducción automática
router.post('/extract-text-and-translate', upload.single('image'), extractTextAndTranslate);

module.exports = router;