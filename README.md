# 🌟 ULenguage Backend

<div align="center">

**Plataforma de traducción quechua para turistas en Cusco**

![ULenguage Logo](https://via.placeholder.com/200x80/4A90E2/FFFFFF?text=ULenguage)

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green.svg)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-5.1.0-blue.svg)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-2.5-flash-yellow.svg)](https://ai.google.dev/)
[![Google Vision](https://img.shields.io/badge/Google%20Vision-API-blue.svg)](https://cloud.google.com/vision)
[![Coverage](https://img.shields.io/badge/coverage-70%25-brightgreen.svg)](https://github.com/Tomas-coder-dev/ULenguage-Backend)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

</div>

## 📖 Descripción

ULenguage Backend es el servidor que alimenta la aplicación de traducción quechua-español-inglés diseñada para turistas que visitan Cusco, Perú. Este backend incluye autenticación JWT, gestión de planes, procesamiento OCR para reconocimiento de texto en imágenes, explicación cultural automática usando Gemini AI, y una base de datos sembrada con contenido cultural quechua auténtico.

## ✨ Características implementadas

- 🔐 **Autenticación JWT completa** (registro y login)
- 🖼️ **OCR con Google Vision API y Tesseract.js** (reconocimiento de texto y objetos en imágenes)
- 🤖 **Explicación cultural automática** usando **Gemini 2.5 Flash**
- 🌎 **Traducción automática** (Quechua, Español, Inglés, Inglés, etc.) con Google Translate
- 📚 **Documentación Swagger** interactiva en `/api/docs`
- 📊 **Gestión de planes** (Gratuito y Premium)
- 🌱 **Seeders con 50+ términos quechua** culturalmente auténticos
- 🧪 **Tests unitarios** con cobertura ≥70%
- 🔒 **Seguridad robusta** con bcryptjs y CORS

## 🚀 Inicio rápido

### Prerrequisitos

- [Node.js](https://nodejs.org/) v16 o superior
- [MongoDB](https://www.mongodb.com/) v5.0 o superior
- [Google Cloud Service Account JSON](https://cloud.google.com/vision/docs/auth) para Vision API
- Clave de API Gemini 2.5 Flash ([Google AI Studio](https://aistudio.google.com/app/apikey))

### 1. Clonar e instalar

```bash
git clone https://github.com/Tomas-coder-dev/ULenguage-Backend.git
cd ULenguage-Backend
npm install
```

### 2. Configurar entorno

```bash
cp .env.example .env
# Edita .env con tus valores
# GEMINI_API_KEY=tu_clave_gemini
# GOOGLE_APPLICATION_CREDENTIALS=./ruta/service-account.json
```

### 3. Instalar dependencias IA

```bash
npm install @google-cloud/vision axios
```

### 4. Sembrar base de datos

```bash
npm run seed
```

### 5. Ejecutar servidor

```bash
npm run dev  # Desarrollo
npm start    # Producción
```

¡Servidor en `http://localhost:5000`! 🎉

## 📡 Endpoints API

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de usuario con email/password |
| POST | `/api/auth/login` | Inicio de sesión tradicional |
| POST | `/api/auth/google` | Autenticación con Google OAuth2. Body: `{tokenId}` |
| GET | `/api/auth/google/url` | Obtener URL de autorización de Google (web) |
| GET | `/api/auth/google/callback` | Callback de Google OAuth (redireccionamiento) |

### Planes y Contenido
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/planes` | Listar planes disponibles |
| POST | `/api/seed` | Ejecutar seeders |

### 🏆 Sistema de Logros por Zonas Turísticas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/achievements/unlock` | Desbloquear logro (GPS o QR). Body: `{lat, lon, zoneId, method}` |
| POST | `/api/achievements/sync` | Sincronizar logros offline. Body: `{achievements: [...]}` |
| GET | `/api/achievements/me` | Obtener logros del usuario autenticado |
| GET | `/api/achievements/zones` | Listar todas las zonas turísticas |
| GET | `/api/achievements/zones/nearby` | Buscar zonas cercanas. Query: `?lat=X&lon=Y&radius=5000` |

### OCR y Traducción con IA
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/ocr/analyze` | OCR + explicación cultural (Vision + Gemini). Permite elegir idioma con `targetLang` (ej: `qu`, `es`, `en`). |
| POST | `/api/ocr/analyze-and-translate` | OCR + explicación cultural + traducción. Devuelve texto y explicación en idioma elegido. |
| POST | `/api/ocr/extract-text` | OCR con idioma específico (`?lang=spa|eng|que`) |
| POST | `/api/ocr/extract-text-auto` | OCR con detección automática |
| POST | `/api/translate` | Traducir texto |

### Documentación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/docs` | Swagger UI interactivo |

## 🧪 Testing

```bash
npm test                    # Ejecutar tests
npm test -- --coverage      # Con cobertura
```

## 🗃️ Modelos de datos

### Usuario (User)
```javascript
{
  name: String,        // Nombre completo
  email: String,       // Email único
  password: String,    // Hash bcryptjs
  plan: String,        // 'free' | 'premium'
  googleId: String     // Para OAuth (Sprint 2)
}
```

### Plan
```javascript
{
  name: String,        // "Gratuito" | "Premium"
  description: String, // Descripción del plan
  price: Number,       // 0 | 5.99
  features: [String]   // Lista de características
}
```

### Contenido Cultural (Content)
```javascript
{
  term: String,         // Término en quechua
  translationEs: String,// Traducción al español
  translationEn: String,// Traducción al inglés
  context: String,      // Contexto cultural
  pronunciation: String,// Guía de pronunciación
  category: String      // Categoría temática
}
```

## 🌱 Datos sembrados

El seeder incluye **52 términos quechua** organizados en:

- 🤝 **Saludos** (5 términos)
- 👨‍👩‍👧‍👦 **Familia** (7 términos) 
- 🍽️ **Comida** (6 términos)
- 🏔️ **Lugares y naturaleza** (6 términos)
- 🎭 **Cultura y ceremonias** (5 términos)
- 🔢 **Números** (5 términos)
- 🦙 **Animales** (5 términos)
- ⏰ **Tiempo** (4 términos)
- 🎨 **Colores** (4 términos)
- 💬 **Términos básicos** (5 términos)

## 🔐 Seguridad

- ✅ **Contraseñas hasheadas** con bcryptjs (salt=10)
- ✅ **JWT tokens** con expiración de 7 días
- ✅ **CORS configurado** solo para localhost:3000
- ✅ **Variables sensibles** en .env (nunca committeadas)
- ✅ **Validaciones robustas** en todos los endpoints
- ✅ **Manejo seguro de errores** sin exponer stack traces

## 🛠️ Scripts disponibles

```bash
npm start          # Iniciar servidor producción
npm run dev        # Servidor desarrollo (nodemon)
npm test           # Ejecutar tests con cobertura
npm run seed       # Poblar base de datos
```

## ⚙️ Producción y logging (PM2)

Hay un documento con instrucciones para ejecutar el servicio con PM2 y diagnosticar fallos relacionados con Google APIs: `docs/pm2.md`.
En la raíz hay un `ecosystem.config.js` de ejemplo que puedes ajustar y usar con `pm2 start ecosystem.config.js --env production`.
## 🌐 Documentación API

Accede a la documentación interactiva en: `http://localhost:5000/api/docs`

## 👥 Equipo

- **Andrés** - Backend Developer  
- **Fabricio** - Backend Developer
- **Institución**: [Tecsup](https://www.tecsup.edu.pe/)

## 🖼️ Funcionalidades OCR Inteligente

### Endpoints OCR IA

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/ocr/analyze` | OCR + explicación cultural automática (Vision + Gemini). Recibe imagen y parámetro `targetLang` para idioma. |
| POST | `/api/ocr/analyze-and-translate` | OCR + explicación + traducción (Vision + Gemini + Translate). |
| POST | `/api/ocr/extract-text` | OCR con idioma específico (`?lang=spa|eng|que`) |
| POST | `/api/ocr/extract-text-auto` | OCR con detección automática de idioma |
| POST | `/api/translate` | Traducir texto (Quechua ↔ Español/Inglés) |

### Configuración OCR + IA

- **Google Vision API** para OCR y detección de objetos/etiquetas en imágenes
- **Gemini 2.5 Flash** para explicación cultural inteligente
- **Google Translate API** para traducción automática
- **Tesseract.js** para reconocimiento óptico de caracteres adicional
- **Franc** para detección automática de idioma
- **Archivos .traineddata** para Quechua, Español e Inglés

### Ejemplo de uso OCR IA

```bash
# OCR + explicación cultural en idioma elegido
POST /api/ocr/analyze
Content-Type: multipart/form-data
Body:
  - image=archivo_imagen.jpg
  - targetLang=qu   # Ejemplo para explicación en quechua

# OCR + explicación + traducción
POST /api/ocr/analyze-and-translate
Content-Type: multipart/form-data
Body:
  - image=archivo_imagen.jpg
  - targetLang=en   # Ejemplo para explicación y traducción en inglés
```

## 📄 Licencia

Este proyecto está bajo la Licencia ISC - ver el archivo [LICENSE](LICENSE) para más detalles.