const express = require('express');
const multer = require('multer');
const { extractText, extractTextAutoLang } = require('./ocr.controller');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/extract-text', upload.single('image'), extractText);
router.post('/extract-text-auto', upload.single('image'), extractTextAutoLang);

module.exports = router;