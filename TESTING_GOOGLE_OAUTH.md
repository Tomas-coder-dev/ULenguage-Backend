# 🧪 Testing Google OAuth2 - Guía Completa

## 🎯 Opciones de Testing

### Opción 1: Testing con Flutter App (Recomendado)

Esta es la forma más natural de probar Google OAuth2.

#### Pasos:

1. **Inicia el backend**
   ```bash
   cd ULenguage-Backend
   npm run dev
   ```

2. **Inicia la app Flutter**
   ```bash
   cd ULenguage-Frontend
   flutter run
   ```

3. **Prueba el login**
   - Haz clic en "Continuar con Google"
   - Selecciona tu cuenta de Google
   - Observa los logs en la consola

4. **Verifica en la consola**
   ```
   ✅ Google Sign-In exitoso
   Email: usuario@gmail.com
   Name: Usuario Test
   ✅ Backend autenticado correctamente
   Token JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

### Opción 2: Testing con Postman (Avanzado)

Esta opción requiere obtener primero un `idToken` válido.

#### Método A: Usando la App Flutter

1. Ejecuta la app Flutter en modo debug
2. Activa los logs en `auth_service.dart` (ya están activados)
3. Haz login con Google
4. Copia el `idToken` que aparece en la consola

#### Método B: Usando Google OAuth Playground

1. Ve a https://developers.google.com/oauthplayground/
2. En "Step 1", selecciona:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
3. Haz clic en "Authorize APIs"
4. Inicia sesión con tu cuenta de Google
5. En "Step 2", haz clic en "Exchange authorization code for tokens"
6. Copia el `id_token` (no el `access_token`)

#### Envía el request a Postman:

```http
POST http://localhost:5000/api/auth/google
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2OTM4N..."
}
```

#### Respuesta esperada:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Usuario Test",
  "email": "usuario@gmail.com",
  "avatar": "https://lh3.googleusercontent.com/a/ACg8ocK...",
  "plan": "free",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isNewUser": false
}
```

---

## 🔍 Debugging

### Ver logs detallados en Flutter

El servicio `AuthService` ya tiene logs activados. Observa la consola de Flutter:

```dart
debugPrint('✅ Google Sign-In exitoso');
debugPrint('Email: ${googleUser.email}');
debugPrint('Name: ${googleUser.displayName}');
debugPrint('✅ Backend autenticado correctamente');
debugPrint('Token JWT: ${data['token']}');
```

### Ver logs en el Backend

El backend también tiene logs en `googleAuthController.js`:

```javascript
console.log('✅ Usuario autenticado con Google');
console.log('Email:', email);
console.log('Google ID:', googleId);
```

---

## ⚠️ Errores Comunes

### Error: "Token de Google es requerido"

**Causa**: El backend no recibió el `idToken`.

**Solución**:
- Verifica que estás enviando `idToken` en el body
- Revisa que no esté vacío o `null`

### Error: "Token used too late"

**Causa**: El `idToken` expiró (duran 1 hora).

**Solución**:
- Obtén un nuevo `idToken`
- Vuelve a hacer login en la app

### Error: "Wrong number of segments in token"

**Causa**: El `idToken` está mal formado o incompleto.

**Solución**:
- Asegúrate de copiar el token completo (incluye puntos `.`)
- No incluyas comillas extras

### Error: "PlatformException(sign_in_failed)"

**Causa**: Configuración incorrecta en Android/iOS.

**Solución**:
1. Verifica `google-services.json` en Android
2. Verifica `Info.plist` en iOS
3. Asegúrate de que el SHA-1 esté registrado (solo Android)

---

## 🧪 Scripts de Testing

### Test automático del endpoint (Node.js)

Crea un archivo `test-google-auth.js`:

```javascript
const axios = require('axios');

const testGoogleAuth = async () => {
  // Reemplaza con un idToken válido
  const idToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6...';
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/google', {
      idToken
    });
    
    console.log('✅ Login exitoso:');
    console.log('Usuario:', response.data.name);
    console.log('Email:', response.data.email);
    console.log('Token:', response.data.token.substring(0, 20) + '...');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testGoogleAuth();
```

Ejecuta:
```bash
node test-google-auth.js
```

---

## 📊 Verificar en MongoDB

Después de un login exitoso, verifica que el usuario se creó:

```bash
mongosh ulenguage
```

```javascript
db.users.find({ email: "usuario@gmail.com" }).pretty()
```

Deberías ver algo como:

```json
{
  "_id": ObjectId("..."),
  "name": "Usuario Test",
  "email": "usuario@gmail.com",
  "googleId": "1234567890123456789",
  "avatar": "https://lh3.googleusercontent.com/...",
  "plan": "free",
  "createdAt": ISODate("2025-10-15T..."),
  "updatedAt": ISODate("2025-10-15T...")
}
```

---

## ✅ Checklist de Testing

- [ ] Backend corriendo en `http://localhost:5000`
- [ ] MongoDB corriendo en `mongodb://localhost:27017`
- [ ] Variable `GOOGLE_CLIENT_ID` en `.env`
- [ ] App Flutter configurada (Android o iOS)
- [ ] Google Sign-In exitoso en la app
- [ ] Token JWT recibido en la respuesta
- [ ] Usuario creado en MongoDB
- [ ] Avatar de Google guardado
- [ ] Plan "free" asignado por defecto

---

## 🎓 Flujo Completo Explicado

```
┌─────────────┐
│ Flutter App │
└──────┬──────┘
       │ 1. Usuario hace clic en "Continuar con Google"
       ▼
┌─────────────────┐
│ Google Sign-In  │
│   (SDK nativo)  │
└──────┬──────────┘
       │ 2. Muestra UI de Google y solicita consentimiento
       ▼
┌──────────────┐
│ Google OAuth │
└──────┬───────┘
       │ 3. Devuelve idToken (JWT firmado por Google)
       ▼
┌─────────────┐
│ Flutter App │
└──────┬──────┘
       │ 4. Envía idToken al backend
       ▼
┌──────────────────────┐
│ Backend Express.js   │
│ (googleAuthController)│
└──────┬───────────────┘
       │ 5. Verifica idToken con Google
       ▼
┌──────────────┐
│ Google API   │
└──────┬───────┘
       │ 6. Confirma que el token es válido
       ▼
┌──────────────────┐
│ Backend          │
│ - Busca usuario  │
│ - Crea si no     │
│   existe         │
│ - Genera JWT     │
└──────┬───────────┘
       │ 7. Devuelve JWT propio + datos del usuario
       ▼
┌─────────────┐
│ Flutter App │
│ - Guarda JWT│
│ - Navega a  │
│   Home      │
└─────────────┘
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de Flutter
2. Revisa los logs del backend
3. Verifica la configuración en Google Cloud Console
4. Asegúrate de que el `GOOGLE_CLIENT_ID` coincida en todos lados
5. Consulta la [documentación oficial](https://pub.dev/packages/google_sign_in)

---

## 🚀 Próximos Pasos

Una vez que el login funcione:

1. Implementa persistencia del token (SharedPreferences o secure_storage)
2. Agrega refresh token para renovar sesiones
3. Implementa logout completo
4. Agrega manejo de sesiones expiradas
5. Implementa "Recordar sesión"
