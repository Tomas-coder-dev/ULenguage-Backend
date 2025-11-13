/**
 * Middleware de logging para auditoría de peticiones HTTP
 * Registra información detallada de cada petición al backend
 */

const { info, warn, error } = require('../utils/logger');

// Simple request id generator (timestamp + random hex)
function genRequestId() {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffff).toString(16)}`;
}

const logRequest = (req, res, next) => {
  const reqId = genRequestId();
  req.reqId = reqId;

  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'Unknown';

  const base = { reqId, method, url, ip, userAgent };

  // Log básico de la petición entrante (structured)
  info({ event: 'request:start', ...base });

  // Si hay usuario autenticado, añadirlo
  if (req.user && req.user.id) {
    info({ event: 'request:user', reqId, userId: req.user.id, userEmail: req.user.email || 'N/A' });
  }

  // Log del body si no es GET (ocultar contraseñas)
  if (method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.googleToken) sanitizedBody.googleToken = '***';
    if (sanitizedBody.facebookToken) sanitizedBody.facebookToken = '***';
    try {
      info({ event: 'request:body', reqId, body: sanitizedBody });
    } catch (e) {
      warn({ event: 'request:body:error', reqId, error: e.message });
    }
  }

  // Capturar el inicio del tiempo de respuesta
  const startTime = Date.now();

  // Interceptar la respuesta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const level = statusCode < 400 ? 'info' : (statusCode < 500 ? 'warn' : 'error');
    const msg = { event: 'request:finish', reqId, statusCode, duration };
    if (level === 'info') info(msg); else if (level === 'warn') warn(msg); else error(msg);
  });

  next();
};

module.exports = logRequest;
