const express = require('express');
const { register, login } = require('../controllers/authController');
const { 
  googleAuth, 
  getGoogleAuthUrl, 
  googleCallback,
  redirectToGoogleAuth
} = require('../controllers/googleAuthController');

const router = express.Router();

// Rutas tradicionales
router.post('/register', register);
router.post('/login', login);

// Perfil del usuario autenticado
const { protect } = require('../middlewares/authMiddleware');
const { getProfile } = require('../controllers/authController');
router.get('/profile', protect, getProfile);

// Rutas de Google OAuth
router.post('/google', googleAuth);
router.get('/google/url', getGoogleAuthUrl);
router.get('/google/callback', googleCallback);
router.get('/google/redirect', redirectToGoogleAuth);

module.exports = router;
