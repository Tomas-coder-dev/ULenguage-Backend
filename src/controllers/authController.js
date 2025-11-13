const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Register] Intento de registro con email ya existente: ${email}`);
      }
      return res.status(400).json({ message: 'Usuario ya existe' });
    }

    const user = await User.create({ name, email, password });
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Register] Nuevo usuario registrado: ${email}`);
    } else {
      console.log(`[PROD][Register] Registro usuario: ${email}, id: ${user._id}`);
    }
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('[Register][ERROR]', error);
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al registrar usuario. Intenta nuevamente.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Login] Usuario autenticado: ${email}`);
      } else {
        console.log(`[PROD][Login] Login usuario: ${email}, id: ${user._id}`);
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Login] Fallo de login para: ${email}`);
      }
      res.status(401).json({ message: 'Credenciales inválidas' });
    }
  } catch (error) {
    console.error('[Login][ERROR]', error);
    res.status(500).json({ message: 'Error al iniciar sesión. Intenta nuevamente.' });
  }
};

/**
 * @desc  Obtener perfil del usuario autenticado
 * @route GET /api/auth/profile
 * @access Private
 */
const getProfile = async (req, res) => {
  try {
    // protect middleware ahora adjunta req.user sin password
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const { _id, name, email, avatar, plan, role } = req.user;
    return res.json({ _id, name, email, avatar, plan, role });
  } catch (error) {
    console.error('[Profile][ERROR]', error);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

module.exports = { register, login, getProfile };
