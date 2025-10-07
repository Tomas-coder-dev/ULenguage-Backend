const express = require('express');
const multer = require('multer');
const { analyzeAndExplain, analyzeExplainAndTranslate } = require('./ocr.controller');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// --- NUEVAS RUTAS CON IA ---
// Ruta principal que usa Vision y Gemini
router.post('/analyze', upload.single('image'), analyzeAndExplain);

// Ruta que además traduce el resultado
router.post('/analyze-and-translate', upload.single('image'), analyzeExplainAndTranslate);


// --- RUTAS ANTIGUAS (si quieres mantenerlas) ---
// const { extractText, extractTextAutoLang, extractTextAndTranslate } = require('./ocr.controller');
// router.post('/extract-text', upload.single('image'), extractText);
// router.post('/extract-text-auto', upload.single('image'), extractTextAutoLang);
// router.post('/extract-text-and-translate', upload.single('image'), extractTextAndTranslate);

module.exports = router;