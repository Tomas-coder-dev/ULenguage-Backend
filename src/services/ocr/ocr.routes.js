const express = require('express');
const multer = require('multer');
const { extractText, extractTextAutoLang, extractTextAndTranslate } = require('./ocr.controller');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/extract-text', upload.single('image'), extractText);
router.post('/extract-text-auto', upload.single('image'), extractTextAutoLang);
router.post('/extract-text-and-translate', upload.single('image'), extractTextAndTranslate);

module.exports = router;