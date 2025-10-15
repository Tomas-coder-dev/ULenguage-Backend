const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    }

    // Generar JWT
    const token = generateToken(user._id);

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
    console.error('Error en autenticación Google:', error);
    
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
  const redirectUri = 'http://localhost:5000/api/auth/google/callback';
  
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

    // Intercambiar el código por tokens
    const { tokens } = await client.getToken({
      code,
      redirect_uri: 'http://localhost:5000/api/auth/google/callback',
      client_secret: process.env.GOOGLE_CLIENT_SECRET
    });

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
    res.redirect(`http://localhost:3000/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan
    }))}`);

  } catch (error) {
    console.error('Error en callback de Google:', error);
    res.redirect(`http://localhost:3000/auth/error?message=${encodeURIComponent('Error al autenticar con Google')}`);
  }
};

module.exports = { 
  googleAuth, 
  getGoogleAuthUrl, 
  googleCallback 
};
