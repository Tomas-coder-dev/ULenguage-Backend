const express = require('express');
const { register, login } = require('../controllers/authController');
const { 
  googleAuth, 
  getGoogleAuthUrl, 
  googleCallback 
} = require('../controllers/googleAuthController');

const router = express.Router();

// Rutas tradicionales
router.post('/register', register);
router.post('/login', login);

// Rutas de Google OAuth
router.post('/google', googleAuth);
router.get('/google/url', getGoogleAuthUrl);
router.get('/google/callback', googleCallback);

module.exports = router;
