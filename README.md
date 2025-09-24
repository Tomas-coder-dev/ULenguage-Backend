# 🌟 ULenguage Backend

<div align="center">

**Plataforma de traducción quechua para turistas en Cusco**

![ULenguage Logo](https://via.placeholder.com/200x80/4A90E2/FFFFFF?text=ULenguage)

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green.svg)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-5.1.0-blue.svg)](https://expressjs.com/)
[![Coverage](https://img.shields.io/badge/coverage-70%25-brightgreen.svg)](https://github.com/Tomas-coder-dev/ULenguage-Backend)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

</div>

## 📖 Descripción

ULenguage Backend es el servidor que alimenta la aplicación de traducción quechua-español-inglés diseñada para turistas que visitan Cusco, Perú. Este backend incluye autenticación JWT, gestión de planes, procesamiento OCR para reconocimiento de texto en imágenes, y una base de datos sembrada con contenido cultural quechua auténtico.

## ✨ Características implementadas

- 🔐 **Autenticación JWT completa** (registro y login)
- � **OCR con Tesseract.js** (reconocimiento de texto en imágenes)
- 🤖 **Detección automática de idioma** (Quechua, Español, Inglés)
- �📚 **Documentación Swagger** interactiva en `/api/docs`
- 📊 **Gestión de planes** (Gratuito y Premium)
- 🌱 **Seeders con 50+ términos quechua** culturalmente auténticos
- 🧪 **Tests unitarios** con cobertura ≥70%
- 🔒 **Seguridad robusta** con bcryptjs y CORS

## 🚀 Inicio rápido

### Prerrequisitos

- [Node.js](https://nodejs.org/) v16 o superior
- [MongoDB](https://www.mongodb.com/) v5.0 o superior

### 1. Clonar e instalar

```bash
git clone https://github.com/Tomas-coder-dev/ULenguage-Backend.git
cd ULenguage-Backend
npm install
```

### 2. Configurar entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

### 3. Sembrar base de datos

```bash
npm run seed
```

### 4. Ejecutar servidor

```bash
npm run dev  # Desarrollo
npm start    # Producción
```

¡Servidor en `http://localhost:5000`! 🎉

## 📡 Endpoints API

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Inicio de sesión |

### Planes y Contenido
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/planes` | Listar planes disponibles |
| POST | `/api/seed` | Ejecutar seeders |

### OCR y Traducción
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/ocr/extract-text` | OCR con idioma específico (`?lang=spa\|eng\|que`) |
| POST | `/api/ocr/extract-text-auto` | OCR con detección automática |
| POST | `/api/translate` | Traducir texto |

### Documentación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/docs` | Swagger UI interactivo |

## 🧪 Testing

```bash
npm test                    # Ejecutar tests
npm test -- --coverage     # Con cobertura
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

## 🌐 Documentación API

Accede a la documentación interactiva en: `http://localhost:5000/api/docs`

## 👥 Equipo

- **Andrés** - Backend Developer  
- **Fabricio** - Backend Developer
- **Institución**: [Tecsup](https://www.tecsup.edu.pe/)

## � Funcionalidades OCR

### Endpoints OCR

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/ocr/extract-text` | OCR con idioma específico (`?lang=spa\|eng\|que`) |
| POST | `/api/ocr/extract-text-auto` | OCR con detección automática de idioma |
| POST | `/api/translate` | Traducir texto (Quechua ↔ Español/Inglés) |

### Configuración OCR

- **Tesseract.js** para reconocimiento óptico de caracteres
- **Sharp** para procesamiento de imágenes
- **Franc** para detección automática de idioma
- **Archivos .traineddata** para Quechua, Español e Inglés

### Uso de OCR

```bash
# Extraer texto con idioma específico
POST /api/ocr/extract-text?lang=que
Content-Type: multipart/form-data
Body: image=archivo_imagen.jpg

# Detección automática de idioma
POST /api/ocr/extract-text-auto
Content-Type: multipart/form-data
Body: image=archivo_imagen.jpg
```

## 📄 Licencia

Este proyecto está bajo la Licencia ISC - ver el archivo [LICENSE](LICENSE) para más detalles.
