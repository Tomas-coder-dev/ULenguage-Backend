# 🔐 Google OAuth2 - Guía de Integración ULenguage

## 📋 Configuración Inicial

### 1. Credenciales de Google Cloud Console

Las credenciales ya están configuradas en `.env`:

```env
GOOGLE_CLIENT_ID=785759594484-ip3v1edfo185b6idd3cgb0vs721nei5a.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### 2. URIs Autorizados

✅ **Orígenes autorizados de JavaScript:**
- `http://localhost:3000`
- `http://localhost:5000`

✅ **URIs de redireccionamiento autorizados:**
- `http://localhost:5000/callback/auth/google`
- `http://localhost:5000/auth/google`

---

## 🚀 Flujos de Autenticación

### Flujo 1: Mobile/Desktop (Recomendado para Flutter)

**Proceso:**
1. El cliente (Flutter) obtiene el `tokenId` usando Google Sign-In
2. Envía el `tokenId` al backend
3. Backend verifica el token con Google
4. Retorna JWT propio del backend

**Endpoint:** `POST /api/auth/google`

**Request:**
```json
{
  "tokenId": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU0Y..."
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Juan Pérez",
  "email": "juan@gmail.com",
  "avatar": "https://lh3.googleusercontent.com/a/...",
  "plan": "free",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isNewUser": false
}
```

**Errores posibles:**
- `400`: Token no enviado
- `401`: Token expirado o inválido
- `500`: Error del servidor

---

### Flujo 2: Web (OAuth Redirect)

**Proceso:**
1. Frontend obtiene URL de autorización: `GET /api/auth/google/url`
2. Redirige al usuario a Google
3. Google redirige a: `http://localhost:5000/api/auth/google/callback?code=...`
4. Backend procesa el código y redirige a frontend con token

**Paso 1:** Obtener URL de autorización

```bash
GET /api/auth/google/url
```

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "message": "Redirige al usuario a esta URL para iniciar sesión con Google"
}
```

**Paso 2:** Usuario autoriza en Google

**Paso 3:** Callback automático
```
GET /api/auth/google/callback?code=4/0AY0e-g7...
```

Backend redirige a:
```
http://localhost:3000/auth/callback?token=eyJhbG...&user={...}
```

---

## 💻 Integración en Flutter

### Instalación de dependencias

```yaml
# pubspec.yaml
dependencies:
  google_sign_in: ^6.1.5
  http: ^1.1.0
```

### Código de ejemplo

```dart
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class GoogleAuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  Future<Map<String, dynamic>?> signInWithGoogle() async {
    try {
      // 1. Iniciar sesión con Google
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        print('Usuario canceló el login');
        return null;
      }

      // 2. Obtener autenticación
      final GoogleSignInAuthentication googleAuth = 
          await googleUser.authentication;

      // 3. Enviar token al backend
      final response = await http.post(
        Uri.parse('http://localhost:5000/api/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'tokenId': googleAuth.idToken,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('Login exitoso: ${data['name']}');
        
        // Guardar token JWT en almacenamiento local
        // await storage.write(key: 'jwt_token', value: data['token']);
        
        return data;
      } else {
        print('Error: ${response.body}');
        return null;
      }
    } catch (error) {
      print('Error al iniciar sesión: $error');
      return null;
    }
  }

  Future<void> signOut() async {
    await _googleSignIn.signOut();
  }
}
```

### Uso en widget

```dart
ElevatedButton(
  onPressed: () async {
    final authService = GoogleAuthService();
    final user = await authService.signInWithGoogle();
    
    if (user != null) {
      Navigator.pushReplacementNamed(context, '/home');
    }
  },
  child: Row(
    children: [
      Image.asset('assets/google_logo.png', height: 24),
      SizedBox(width: 12),
      Text('Continuar con Google'),
    ],
  ),
)
```

---

## 🔄 Modelo de Usuario Actualizado

El modelo `User` ahora soporta ambos métodos de autenticación:

```javascript
{
  name: String,           // Requerido
  email: String,          // Único, requerido
  password: String,       // Requerido SOLO si no hay googleId
  googleId: String,       // Único, opcional (para OAuth)
  avatar: String,         // URL de foto de perfil
  plan: String,           // 'free' | 'premium'
  timestamps: true        // createdAt, updatedAt
}
```

**Reglas de validación:**
- Si `googleId` existe → `password` NO es obligatorio
- Si `googleId` NO existe → `password` SÍ es obligatorio
- Un usuario puede tener ambos (cuenta vinculada)

---

## 🧪 Testing

```bash
# Ejecutar tests de Google OAuth
npm test -- tests/googleAuth.test.js

# Ejecutar todos los tests
npm test
```

**Tests implementados:**
- ✅ Validación de tokenId requerido
- ✅ Manejo de tokens inválidos
- ✅ Generación de URL de autorización
- ✅ Callback sin código de autorización
- ✅ Creación de usuario con googleId
- ✅ Usuario sin googleId (registro normal)

---

## 🛡️ Seguridad

### Verificaciones implementadas

1. **Validación de token:** Se verifica directamente con Google usando `google-auth-library`
2. **Email verificado:** Solo se aceptan cuentas con email verificado
3. **Audience check:** Se valida que el token fue generado para este CLIENT_ID
4. **Expiración:** Tokens expirados son rechazados automáticamente
5. **JWT propio:** Después de validar, se genera un JWT del backend (7 días)

### Buenas prácticas

- ✅ Nunca expongas `GOOGLE_CLIENT_SECRET` en el frontend
- ✅ Usa HTTPS en producción
- ✅ Configura CORS correctamente
- ✅ Rotación de secrets periódica en Google Cloud Console
- ✅ Monitorea intentos de login fallidos

---

## 🐛 Troubleshooting

### Error: "Token used too late"
**Causa:** El token de Google expiró (válido por 1 hora)  
**Solución:** Solicitar un nuevo token al usuario

### Error: "Invalid token signature"
**Causa:** CLIENT_ID incorrecto o token manipulado  
**Solución:** Verificar `.env` y regenerar token

### Error: "redirect_uri_mismatch"
**Causa:** La URI de callback no está autorizada  
**Solución:** Agregar en Google Cloud Console → Credenciales

### Usuario creado sin googleId
**Causa:** Registro normal con email/password antes de vincular  
**Solución:** La vinculación es automática al usar `/api/auth/google`

---

## 📊 Flujo Completo (Diagrama)

```
┌─────────────┐
│   Flutter   │
│   Client    │
└──────┬──────┘
       │ 1. Google Sign In
       ▼
┌─────────────────┐
│  Google OAuth   │ 2. Devuelve idToken
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ POST /api/auth/ │ 3. Envía tokenId
│     google      │
└──────┬──────────┘
       │ 4. Verifica con Google
       ▼
┌─────────────────┐
│ Google Auth API │ 5. Token válido
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   ULenguage DB  │ 6. Crea/actualiza user
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Generate JWT   │ 7. Token propio (7d)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Response JSON   │ 8. {token, user}
└─────────────────┘
```

---

## 📝 Checklist de Implementación

### Backend (✅ Completado)
- [x] Instalar `google-auth-library`
- [x] Configurar `.env` con credenciales
- [x] Actualizar modelo `User` con `googleId` y `avatar`
- [x] Crear `googleAuthController.js`
- [x] Agregar rutas `/api/auth/google`
- [x] Middleware de validación de token
- [x] Tests unitarios
- [x] Documentación en README

### Frontend (Pendiente)
- [ ] Instalar `google_sign_in` en Flutter
- [ ] Configurar `google-services.json` (Android)
- [ ] Configurar `GoogleService-Info.plist` (iOS)
- [ ] Implementar `GoogleAuthService`
- [ ] Crear UI de botón "Continuar con Google"
- [ ] Manejar estados de carga y error
- [ ] Persistir JWT en almacenamiento local

---

## 🔗 Referencias

- [Google Sign-In Flutter](https://pub.dev/packages/google_sign_in)
- [Google Auth Library Node.js](https://github.com/googleapis/google-auth-library-nodejs)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

---

**Última actualización:** Sprint 4 - Octubre 2025  
**Autor:** Equipo ULenguage - Tecsup
