# 📊 Sistema de Logs y Auditoría - ULenguage Backend

## 🎯 Resumen de Implementación

Se ha implementado un sistema completo de logs y auditoría para todas las peticiones HTTP y funciones principales del backend de ULenguage.

---

## 🛠️ Componentes Implementados

### 1. **Middleware Global de Logging** 
📁 `src/middlewares/loggerMiddleware.js`

#### Características:
- ✅ Registra automáticamente **todas** las peticiones HTTP
- ✅ Muestra: timestamp, método, URL, IP, User-Agent
- ✅ Oculta información sensible (passwords, tokens)
- ✅ Calcula tiempo de respuesta de cada petición
- ✅ Indica éxito (✅) o error (❌) según el status code

#### Formato de salida:
```
[2025-01-15T10:30:45.123Z] 📥 POST /api/auth/google
  ├─ IP: ::1
  ├─ User-Agent: Mozilla/5.0...
  ├─ Body: { "tokenId": "***" }
  └─ ✅ Respuesta: 200 (345ms)
```

---

### 2. **Logs Específicos por Módulo**

#### 🔐 **Autenticación (Google OAuth)**
📁 `src/controllers/googleAuthController.js`

**Logs agregados:**
- `[🔐 AUTH]` Inicio de autenticación
- `[🔍 AUTH]` Verificación de token con Google
- `[✅ AUTH]` Token verificado exitosamente
- `[🔗 AUTH]` Usuario vinculado a cuenta existente
- `[✨ AUTH]` Nuevo usuario creado
- `[🎫 AUTH]` Token JWT generado
- `[❌ AUTH]` Errores en el proceso

---

#### 🗺️ **Explorer (Lugares Turísticos)**
📁 `src/controllers/explorerController.js`

**Logs agregados:**
- `[🗺️ EXPLORER]` Solicitud de lugares turísticos
- `[✅ EXPLORER]` Lugares enviados exitosamente
- `[❌ EXPLORER]` Error al obtener lugares

---

#### 📸 **OCR (Análisis de Imágenes)**
📁 `src/services/ocr/ocr.controller.js`

**Logs agregados:**
- `[📸 OCR]` Inicio de análisis de imagen
- `[🔍 OCR]` Detalles de la imagen procesada
- `[✅ OCR]` Análisis completado exitosamente
- `[❌ OCR]` Error al analizar imagen

---

#### 🌐 **Traducción**
📁 `src/services/translate/translate.controller.js`

**Logs agregados:**
- `[🌐 TRANSLATE]` Nueva solicitud de traducción
- `[🔍 TRANSLATE]` Texto a traducir (primeros 50 caracteres)
- `[✅ TRANSLATE]` Traducción exitosa con provider y variante
- `[⚠️ TRANSLATE]` Método de fallback activado
- `[❌ TRANSLATE]` Error en traducción

---

#### 💳 **Planes**
📁 `src/controllers/planController.js`

**Logs agregados:**
- `[💳 PLANS]` Solicitud de lista de planes
- `[✅ PLANS]` Planes enviados exitosamente
- `[❌ PLANS]` Error al obtener planes

---

#### 🏆 **Logros (Achievements)**
📁 `src/controllers/achievementController.js`

**Logs agregados:**
- `[🏆 ACHIEVEMENT]` Solicitud de desbloqueo de logro
- `[🔍 ACHIEVEMENT]` Detalles del usuario y zona
- `[⚠️ ACHIEVEMENT]` Logro ya desbloqueado
- `[✅ ACHIEVEMENT]` Logro desbloqueado exitosamente
- `[🔄 ACHIEVEMENT]` Inicio de sincronización offline
- `[✅ ACHIEVEMENT]` Resultado de sincronización
- `[📍 ZONES]` Solicitud de zonas cercanas
- `[❌ ACHIEVEMENT]` Errores en el proceso

---

## 📋 Formato de Logs

### Emojis por Categoría:
- 🔐 **Autenticación**
- 📸 **OCR / Análisis de imágenes**
- 🌐 **Traducción**
- 🗺️ **Explorer / Lugares**
- 💳 **Planes de suscripción**
- 🏆 **Logros / Achievements**
- 📍 **Zonas geográficas**
- ✅ **Operación exitosa**
- ❌ **Error**
- ⚠️ **Advertencia**
- 🔍 **Procesamiento**
- 🔄 **Sincronización**

---

## 🚀 Cómo Usar

### Backend ya configurado
El middleware de logging se aplica automáticamente a **todas las rutas** del backend.

### Ver logs en tiempo real
1. Inicia el backend:
   ```bash
   cd ULenguage-Backend
   npm start
   ```

2. Los logs aparecerán en la consola automáticamente cuando se reciban peticiones.

### Ejemplo de salida completa:
```
[2025-01-15T10:30:45.123Z] 📥 POST /api/auth/google
  ├─ IP: ::1
  ├─ User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
  ├─ Body: {
  "tokenId": "***"
}
[🔐 AUTH] Iniciando autenticación con Google OAuth2
[🔍 AUTH] Verificando token con Google...
[✅ AUTH] Token verificado para: user@example.com (Google ID: 123456789)
[✨ AUTH] Nuevo usuario creado con Google: user@example.com (ID: 67890abc)
[🎫 AUTH] Token JWT generado para usuario: user@example.com
  └─ ✅ Respuesta: 200 (345ms)
```

---

## 🔒 Seguridad

### Datos ocultos automáticamente:
- ✅ `password` → `***`
- ✅ `googleToken` → `***`
- ✅ `facebookToken` → `***`
- ✅ `tokenId` → `***`
- ✅ `idToken` → `***`

### Información registrada:
- ✅ IP del cliente
- ✅ User-Agent
- ✅ Método HTTP y URL
- ✅ Tiempo de respuesta
- ✅ Status code
- ✅ Usuario autenticado (si aplica)

---

## 📌 Notas Importantes

1. **Producción**: Los logs no incluyen información sensible y están optimizados para auditoría.
2. **Desarrollo**: Los logs son más detallados para facilitar debugging.
3. **Performance**: El middleware tiene impacto mínimo en el rendimiento.
4. **Escalabilidad**: Para producción a gran escala, considera integrar con servicios como Winston, Morgan o Loggly.

---

## 🔧 Mantenimiento

### Agregar logs a nuevos controladores:
```javascript
exports.nuevaFuncion = async (req, res) => {
  console.log('[🆕 MODULO] Descripción de la acción');
  
  try {
    // Tu lógica aquí
    console.log('[✅ MODULO] Operación exitosa');
    res.json({ ... });
  } catch (error) {
    console.error('[❌ MODULO] Error:', error.message);
    res.status(500).json({ ... });
  }
};
```

---

## ✅ Checklist de Implementación

- [x] Middleware global de logging
- [x] Logs en autenticación (Google/Facebook)
- [x] Logs en OCR
- [x] Logs en traducción
- [x] Logs en explorer
- [x] Logs en planes
- [x] Logs en achievements/zonas
- [x] Ocultamiento de datos sensibles
- [x] Formato consistente con emojis
- [x] Documentación completa

---

**Fecha de implementación:** 2 de noviembre de 2025  
**Desarrollador:** Asistente de código GitHub Copilot  
**Proyecto:** ULenguage Backend - Tesis Tecsup 2025
