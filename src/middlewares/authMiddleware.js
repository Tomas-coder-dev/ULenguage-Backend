const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect middleware
 * - verifica JWT
 * - busca al usuario en BD y anexa campos esenciales a req.user
 * - devuelve 401 si no hay token o es inválido
 */
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.[process.env.COOKIE_NAME || 'ulenguage_token'];
  if (!token) return res.status(401).json({ message: 'No autorizado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').lean();
    if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });

    // Attach normalized user info for downstream middlewares/controllers
    req.user = Object.assign({}, user, { id: String(user._id) });
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Export both default and named to preserve existing import styles
module.exports = protect;
module.exports.protect = protect;
