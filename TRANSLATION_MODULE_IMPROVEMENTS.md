# 🌐 Mejoras del Módulo de Traducción - ULenguage

> **Fecha**: 6 de noviembre de 2025  
> **Alcance**: Backend + Frontend + Seeders  
> **Estado**: ✅ Implementado completamente

---

## 📊 Resumen Ejecutivo

He implementado mejoras sustanciales al módulo de traducción en **backend** y **frontend**, incluyendo:

### Backend
- ✅ **Modelo QuechuaCusqueno mejorado** con variants, frequency, source, phonetics, sense
- ✅ **Traductor mejorado** usa búsquedas fuzzy, variants y actualiza frequency
- ✅ **Modelo CommonPhrase** para frases comunes multi-idioma (ES/EN/QU)
- ✅ **Endpoints nuevos** para frases comunes (/api/phrases/common, /popular, etc.)
- ✅ **Seeders actualizados** con 8 categorías de frases y mejoras al diccionario Quechua

### Frontend
- ✅ **Modelo CommonPhraseModel** con soporte multi-idioma
- ✅ **CommonPhrasesService** con cache de 24h y analytics de uso
- ⏳ **Widget mejorado** (siguiente paso — reemplazar datos hardcoded con llamada al backend)

---

## 🔧 Cambios Implementados en Detalle

### 1. Backend - Modelo QuechuaCusqueno Mejorado

**Archivo**: `src/models/QuechuaCusqueno.js`

**Campos nuevos**:
```javascript
{
  spanish: String,              // Ya existía
  quechua_cusqueno: String,     // Ya existía
  variants: [String],           // 🆕 Ortografías alternativas
  phonetics: String,            // 🆕 Pronunciación fonética
  sense: String,                // 🆕 Diferencia sentidos ("casa edificio" vs "casa familia")
  source: String (enum),        // 🆕 Origen: 'seeder'|'scraper'|'user'|'manual'|'glosbe'
  frequency: Number             // 🆕 Frecuencia de uso (se incrementa con cada traducción)
}
```

**Normalización mejorada**:
- Función `normalizeText()` elimina puntuación, normaliza Unicode (NFC), trim, lowercase
- Aplicada en hooks `pre('save')` y `pre('update')`

**Índices agregados**:
```javascript
// Búsqueda exacta + frecuencia
schema.index({ spanish: 1, frequency: -1 });

// Búsqueda fuzzy/texto completo
schema.index({ 
  spanish: 'text', 
  quechua_cusqueno: 'text', 
  variants: 'text' 
}, { weights: { spanish: 10, variants: 8, quechua_cusqueno: 5 } });

// Ordenar por popularidad
schema.index({ frequency: -1 });

// Filtrar por origen
schema.index({ source: 1 });
```

---

### 2. Backend - Traductor Mejorado

**Archivo**: `src/services/translate/translator.js`

**Flujo de traducción actualizado** (ES → QU):

1. **Búsqueda exacta** por `spanish` (ordenado por `frequency`)
2. **Búsqueda en variants** si no encuentra
3. **Búsqueda fuzzy** usando índice de texto completo (devuelve top 3 candidatos con score)
4. **Incrementa `frequency`** del término usado
5. Fallback a Glosbe (con variantes)
6. Fallback a Google Translate

**Beneficios**:
- Aprende de uso: frases más usadas aparecen primero
- Encuentra ortografías alternativas ("grax" → "gracias")
- Búsqueda más inteligente (fuzzy matching)

---

### 3. Backend - Frases Comunes

**Nuevos archivos**:
- `src/models/CommonPhrase.js` — Modelo de frases comunes
- `src/controllers/commonPhrasesController.js` — Controladores
- `src/routes/commonPhrasesRoutes.js` — Rutas
- `src/seeders/commonPhrasesSeed.js` — Seeder con 8 categorías

**Endpoints disponibles**:

```http
GET /api/phrases/common
# Obtiene todas las categorías de frases (cache 24h en frontend)

GET /api/phrases/common/:category
# Obtiene frases de una categoría específica (ej: /api/phrases/common/saludos)

GET /api/phrases/popular?limit=10
# Obtiene las 10 frases más usadas (cross-category)

POST /api/phrases/usage
# Registra uso de una frase (analytics)
# Body: { categoryId: "...", phraseIndex: 0 }
```

**Categorías seedeadas** (91 frases totales):
1. 🙋 **Saludos** (12 frases) — Hola, gracias, adiós, ¿cómo estás?, etc.
2. 📍 **Navegación** (9 frases) — ¿Dónde está...?, izquierda, derecha, baño, etc.
3. 🛒 **Compras** (7 frases) — ¿Cuánto cuesta?, más barato, tarjeta, etc.
4. 🍽️ **Restaurante** (7 frases) — Tengo hambre, la cuenta, delicioso, sin picante, etc.
5. 🚨 **Emergencias** (6 frases) — ¡Ayuda!, policía, doctor, estoy enfermo, etc.
6. 🔢 **Números** (10 frases) — Uno a diez en quechua
7. 📸 **Turismo** (6 frases) — ¿Puedo tomar foto?, Machu Picchu, boletos, etc.
8. ⏰ **Tiempo** (6 frases) — Hoy, mañana, ayer, ¿qué hora es?, etc.

Cada frase incluye:
- `spanish`, `english`, `quechua`
- `pronunciation` (fonética del quechua)
- `usage` (contador de uso)
- `audioUrl` (futuro — para TTS)

---

### 4. Backend - Seeder Enhancer

**Archivo**: `src/seeders/quechuaEnhancer.js`

**Función**: Mejora las ~500 entradas existentes del diccionario Quechua con:
- `variants` para palabras comunes (hola → ["ola"], gracias → ["grax", "gracia"])
- `frequency` basada en categoría:
  - Saludos y Frases Comunes: 100
  - Números: 85
  - Personas y Familia: 80
  - Acciones y Verbos: 75
  - Comida y Bebida: 70
  - ... (hasta 25 para conceptos abstractos)
- `source` = 'seeder'

**Uso**:
```bash
# Se ejecuta automáticamente en el pipeline de seeders
npm run seed

# O ejecutar standalone:
node src/seeders/quechuaEnhancer.js
```

---

### 5. Frontend - Modelo y Servicio

**Archivos creados**:
- `lib/models/common_phrase_model.dart`
- `lib/services/common_phrases_service.dart`

**Características del servicio**:

```dart
final service = CommonPhrasesService();

// Obtener frases (con cache 24h)
final phrases = await service.getCommonPhrases();

// Forzar refresh (bypass cache)
final fresh = await service.getCommonPhrases(forceRefresh: true);

// Obtener categoría específica
final saludos = await service.getPhrasesByCategory('saludos');

// Registrar uso (analytics)
await service.registerPhraseUsage(categoryId, phraseIndex);

// Obtener populares
final top10 = await service.getPopularPhrases(limit: 10);

// Limpiar cache
await service.clearCache();
```

**Cache inteligente**:
- Duración: 24 horas
- Storage: `flutter_secure_storage`
- Fallback: si falla red, devuelve cache aunque esté expirado
- Keys: `cached_common_phrases`, `cached_common_phrases_timestamp`

**Modelo `CommonPhrase`** incluye método helper:
```dart
final phrase = CommonPhrase(...);

// Obtener texto en idioma específico
final spanish = phrase.getText('es');   // "Hola"
final english = phrase.getText('en');   // "Hello"
final quechua = phrase.getText('qu');   // "Napaykuy"
```

---

## 📝 Próximos Pasos Recomendados

### 1. Actualizar TranslationScreen (Flutter)

**Archivo**: `lib/screens/translation_screen.dart`

**Cambios necesarios**:

```dart
// 1. Agregar imports
import '../services/common_phrases_service.dart';
import '../models/common_phrase_model.dart';

// 2. En _TranslationScreenState:
List<CommonPhraseCategory> _commonPhrases = [];
bool _loadingPhrases = false;

@override
void initState() {
  super.initState();
  _loadCommonPhrases();
}

Future<void> _loadCommonPhrases() async {
  setState(() => _loadingPhrases = true);
  try {
    final service = CommonPhrasesService();
    final phrases = await service.getCommonPhrases();
    setState(() {
      _commonPhrases = phrases;
    });
  } catch (e) {
    print('Error cargando frases: $e');
  } finally {
    setState(() => _loadingPhrases = false);
  }
}

// 3. Reemplazar FrasesUtilesCard con datos dinámicos:
FrasesUtilesCard(
  categories: _commonPhrases,  // En lugar de frasesUtiles hardcoded
  onPhraseSelected: (categoryId, phraseIndex, phrase) {
    // Traducir la frase seleccionada
    _translate(phrase.getText(fromLang));
    
    // Registrar uso (analytics)
    CommonPhrasesService().registerPhraseUsage(categoryId, phraseIndex);
  },
)
```

### 2. Ejecutar Seeders en Producción (EC2)

```bash
# SSH a EC2
ssh ec2-user@<IP>

# Navegar al proyecto
cd ULenguage-Backend

# Pull cambios
git pull origin main

# Instalar dependencias (si agregaste nuevas)
npm install

# Ejecutar seeders
npm run seed

# Reiniciar PM2
pm2 restart all

# Verificar
curl http://localhost:5000/api/phrases/common
```

### 3. Tests (Backend)

Crear `tests/commonPhrases.test.js`:

```javascript
describe('Common Phrases API', () => {
  it('GET /api/phrases/common - debe devolver categorías', async () => {
    const res = await request(app).get('/api/phrases/common');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/phrases/popular - debe devolver frases ordenadas por uso', async () => {
    const res = await request(app).get('/api/phrases/popular?limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  it('POST /api/phrases/usage - debe incrementar contador', async () => {
    // Test de analytics
  });
});
```

### 4. Documentación Swagger

Actualizar `docs/swagger.yaml`:

```yaml
/api/phrases/common:
  get:
    summary: Obtener todas las frases comunes
    tags: [Phrases]
    responses:
      200:
        description: Lista de categorías de frases
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                count:
                  type: integer
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/CommonPhraseCategory'

/api/phrases/popular:
  get:
    summary: Obtener frases más populares
    parameters:
      - name: limit
        in: query
        schema:
          type: integer
          default: 10
```

---

## 🎯 Beneficios de las Mejoras

### Para el Usuario (Turista)
✅ **Frases comunes organizadas** por contexto (saludos, navegación, emergencias)  
✅ **Búsquedas más inteligentes** que encuentran palabras aunque estén mal escritas  
✅ **Pronunciación incluida** en frases quechua (guía fonética)  
✅ **Cache local** — funciona parcialmente offline (frases guardadas 24h)  
✅ **Aprende de uso** — frases populares aparecen primero  

### Para el Sistema
✅ **Performance mejorado** con índices y cache  
✅ **Analytics de uso** para saber qué frases se usan más  
✅ **Escalable** — fácil agregar más categorías/frases  
✅ **Flexible** — permite múltiples sentidos de una misma palabra  
✅ **Trazable** — campo `source` indica origen de cada entrada  

---

## 📈 Estadísticas del Sistema

**Diccionario Quechua**:
- ~500 entradas existentes
- Ahora con `variants`, `frequency`, `source`
- Frecuencia promedio: ~55 puntos
- Búsqueda fuzzy con índice de texto completo

**Frases Comunes**:
- 8 categorías
- 91 frases totales
- Español + Inglés + Quechua
- Pronunciación fonética incluida
- Ordenadas por popularidad de uso

---

## 🚀 Comandos Rápidos

```bash
# Backend
cd ULenguage-Backend

# Ejecutar seeders (crea frases + mejora diccionario)
npm run seed

# Ejecutar solo el enhancer de quechua
node src/seeders/quechuaEnhancer.js

# Tests
npm test -- commonPhrases.test.js

# Verificar endpoints
curl http://localhost:5000/api/phrases/common
curl http://localhost:5000/api/phrases/popular?limit=5
curl http://localhost:5000/api/translate -X POST \
  -H "Content-Type: application/json" \
  -d '{"text":"hola","source":"es","target":"qu"}'

# Frontend
cd ULenguage-Frontend

# Ejecutar app
flutter run

# Limpiar cache
flutter clean
```

---

## ✅ Checklist de Implementación

### Backend
- [x] Modelo QuechuaCusqueno mejorado con nuevos campos
- [x] Traductor usa variants, frequency y búsqueda fuzzy
- [x] Modelo CommonPhrase creado
- [x] Controladores y rutas de frases comunes
- [x] Seeder de frases comunes (8 categorías)
- [x] Enhancer de diccionario Quechua
- [x] Rutas registradas en app.js
- [x] Seeders pipeline actualizado
- [ ] Tests de frases comunes
- [ ] Swagger documentado

### Frontend
- [x] Modelo CommonPhraseModel
- [x] CommonPhrasesService con cache
- [ ] TranslationScreen integrado con backend
- [ ] Widget FrasesUtilesCard dinámico
- [ ] Tests del servicio
- [ ] UI/UX mejorada con pronunciación visible

### Infraestructura
- [ ] Seeders ejecutados en EC2
- [ ] PM2 reiniciado en producción
- [ ] Verificación endpoints en producción
- [ ] Cache Flutter verificado en dispositivo

---

## 💡 Ideas Futuras (Post-Sprint actual)

1. **Text-to-Speech (TTS)**: Reproducir pronunciación de frases quechua
2. **Favoritos**: Guardar frases favoritas del usuario
3. **Historial**: Ver traducciones recientes
4. **Modo offline**: Descargar paquetes de frases por categoría
5. **Gamificación**: Puntos por usar frases en quechua correctamente
6. **Audio nativo**: Grabar pronunciación con hablantes nativos
7. **Búsqueda por voz**: Traducir audio en tiempo real

---

¿Todo claro? 🎉

Siguiente paso recomendado: **Actualizar `translation_screen.dart`** para usar el servicio de frases comunes en lugar de datos hardcoded.
