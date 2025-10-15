/**
 * @desc   Redirigir automáticamente a Google OAuth (flujo web)
 * @route  GET /api/auth/google/redirect
 * @access Public
 */
const redirectToGoogleAuth = (req, res) => {
  const apiUrl = process.env.URL_API || 'http://localhost:5000';
  const redirectUri = `${apiUrl}/api/auth/google/callback`;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=code&` +
    `scope=profile email&` +
    `access_type=offline`;
  return res.redirect(authUrl);
};
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Inicializar el cliente OAuth2 con client_id, client_secret y redirect_uri
const apiUrl = process.env.URL_API || 'http://localhost:5000';
const redirectUri = `${apiUrl}/api/auth/google/callback`;
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

/**
 * @desc   Autenticar usuario con Google OAuth2
 * @route  POST /api/auth/google
 * @access Public
 */
const googleAuth = async (req, res) => {
  try {
    const { tokenId, idToken, token: googleToken } = req.body;

    // Aceptar cualquiera de los nombres comunes para el token
    const authToken = tokenId || idToken || googleToken;

    if (!authToken) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[GoogleAuth] Token de Google no recibido en request:', req.body);
      }
      return res.status(400).json({ 
        message: 'Token de Google es requerido (tokenId, idToken o token)' 
      });
    }

    // Verificar el token con Google
    const ticket = await client.verifyIdToken({
      idToken: authToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Verificar que el email esté verificado
    if (!payload.email_verified) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[GoogleAuth] Email de Google no verificado:', email);
      }
      return res.status(400).json({ 
        message: 'Email de Google no verificado' 
      });
    }

    // Buscar si el usuario ya existe
    let user = await User.findOne({ email });

    if (user) {
      // Si existe pero no tiene googleId, vincular la cuenta
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture || user.avatar;
        await user.save();
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[GoogleAuth] Usuario existente vinculado a Google: ${email}`);
        }
      }
    } else {
      // Crear nuevo usuario con Google
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture || '',
        password: Math.random().toString(36).slice(-8), // Password temporal (no se usará)
        plan: 'free'
      });
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[GoogleAuth] Nuevo usuario creado con Google: ${email}`);
      }
    }

    // Generar JWT
    const token = generateToken(user._id);

    if (process.env.NODE_ENV === 'production') {
      // Log en producción (solo info relevante, sin datos sensibles)
      console.log(`[PROD][GoogleAuth] Login Google para usuario: ${email}, id: ${user._id}`);
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
      token,
      isNewUser: !user.googleId // Indica si es primera vez con Google
    });

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[GoogleAuth][ERROR]', error);
    } else {
      // Log en producción (sin stack, solo mensaje)
      console.error(`[PROD][GoogleAuth][ERROR]`, error.message);
    }

    if (error.message.includes('Token used too late')) {
      return res.status(401).json({ 
        message: 'Token de Google expirado, por favor inicia sesión nuevamente' 
      });
    }

    if (error.message.includes('Invalid token')) {
      return res.status(401).json({ 
        message: 'Token de Google inválido' 
      });
    }

    res.status(500).json({ 
      message: 'Error al autenticar con Google',
      error: error.message 
    });
  }
};

/**
 * @desc   Obtener URL de autorización de Google (opcional, para web)
 * @route  GET /api/auth/google/url
 * @access Public
 */
const getGoogleAuthUrl = (req, res) => {
  const apiUrl = process.env.URL_API || 'http://localhost:5000';
  const redirectUri = `${apiUrl}/api/auth/google/callback`;

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=code&` +
    `scope=profile email&` +
    `access_type=offline`;

  res.json({ 
    authUrl,
    message: 'Redirige al usuario a esta URL para iniciar sesión con Google' 
  });
};

/**
 * @desc   Callback de Google OAuth (para flujo web)
 * @route  GET /api/auth/google/callback
 * @access Public
 */
const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ 
        message: 'Código de autorización no recibido' 
      });
    }

    const frontendUrl = process.env.URL_FRONTEND || 'http://localhost:3000';

    // Intercambiar el código por tokens (ya no es necesario pasar client_secret ni redirect_uri)
    const { tokens } = await client.getToken(code);

    // Verificar el ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Buscar o crear usuario
    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture || user.avatar;
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture || '',
        password: Math.random().toString(36).slice(-8),
        plan: 'free'
      });
    }

    const token = generateToken(user._id);

    // Redirigir al frontend con el token
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan
    }))}`);

  } catch (error) {
    console.error('Error en callback de Google:', error);
    const frontendUrl = process.env.URL_FRONTEND || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Error al autenticar con Google')}`);
  }
};

module.exports = { 
  googleAuth, 
  getGoogleAuthUrl, 
  googleCallback,
  redirectToGoogleAuth
};
