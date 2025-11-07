/**
 * Middleware de logging para auditoría de peticiones HTTP
 * Registra información detallada de cada petición al backend
 */

const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'Unknown';
  
  // Log básico de la petición entrante
  console.log(`\n[${timestamp}] 📥 ${method} ${url}`);
  console.log(`  ├─ IP: ${ip}`);
  console.log(`  ├─ User-Agent: ${userAgent}`);
  
  // Si hay usuario autenticado, mostrarlo
  if (req.user && req.user.id) {
    console.log(`  ├─ Usuario: ${req.user.id} (${req.user.email || 'N/A'})`);
  }
  
  // Log del body si no es GET (ocultar contraseñas)
  if (method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.googleToken) sanitizedBody.googleToken = '***';
    if (sanitizedBody.facebookToken) sanitizedBody.facebookToken = '***';
    console.log(`  ├─ Body:`, JSON.stringify(sanitizedBody, null, 2));
  }
  
  // Capturar el inicio del tiempo de respuesta
  const startTime = Date.now();
  
  // Interceptar la respuesta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusEmoji = statusCode < 400 ? '✅' : '❌';
    
    console.log(`  └─ ${statusEmoji} Respuesta: ${statusCode} (${duration}ms)\n`);
  });
  
  next();
};

module.exports = logRequest;
