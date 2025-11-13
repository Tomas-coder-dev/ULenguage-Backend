# PM2 y Diagnóstico para ULenguage Backend

Este documento explica cómo ejecutar el servidor con PM2 en un servidor Linux/Windows (WSL) y cómo usar los logs para diagnosticar fallas relacionadas con APIs externas (Google Vision / Gemini / Translate).

## 1) Instalar PM2

En el servidor (Node.js ya instalado):

```powershell
npm install -g pm2
```

## 2) Archivo de ejemplo `ecosystem.config.js`

Colocar el archivo `ecosystem.config.js` en la raíz del repo (hay un ejemplo en este repo).

Ejecutar:

```powershell
pm2 start ecosystem.config.js --env production
```

## 3) Revisar logs en tiempo real

Para ver logs consolidados de la aplicación:

```powershell
pm2 logs ulenguage-backend --lines 200
```

Para ver solo errores:

```powershell
pm2 logs ulenguage-backend --err
```

## 4) Ubicación de logs generados por winston

El logger integrado escribe:
- `logs/combined.log` — todos los mensajes en formato JSON
- `logs/error.log` — solo errores

En producción, usa `tail -f logs/combined.log` o `less` para leerlos.

## 5) Cómo correlacionar una petición con los logs (requestId)

El middleware de logging añade un `reqId` único a cada petición. Busca entradas en `combined.log` con `request:start` y el mismo `reqId` para ver el flujo completo (inicio, body, finish, errores). Ejemplo:

```json
{ "event":"request:start", "reqId":"klsj12-1a2b", "method":"POST", "url":"/api/ocr/analyze" }
{ "event":"request:body", "reqId":"klsj12-1a2b", "body":{ ... } }
{ "event":"request:finish", "reqId":"klsj12-1a2b", "statusCode":500 }
```

Si buscas en `error.log` verás stacks y objetos de error (`error` y `metadata`) que ayudan a diagnosticar fallos.

## 6) Diagnóstico específico para fallas con Google APIs

Pasos para investigar por qué Vision/Gemini/Translate fallan:

1. Verificar variables de entorno en PM2:
   - `pm2 env <id>` o revisar `ecosystem.config.js`.
   - Revisar que `GOOGLE_APPLICATION_CREDENTIALS` apunte al JSON correcto y accesible por el usuario que ejecuta PM2.

2. Probar desde el servidor (sin pasar por la app):

```powershell
node -e "const vision=require('@google-cloud/vision'); const c=new vision.ImageAnnotatorClient(); c.documentTextDetection({image:{source:{filename:'/path/to/sample.jpg'}}}).then(r=>console.log('OK',r[0]?.fullTextAnnotation?.text?.slice(0,100))).catch(e=>console.error(e));"
```

3. Revisar conectividad de salida (egress) al dominio `generativelanguage.googleapis.com` y a `vision.googleapis.com` (puedes usar `curl` o `Test-NetConnection` en PowerShell).

4. Revisar permisos del Service Account JSON:
   - La cuenta debe tener roles/permissions para Vision API y, si aplica, para Generative Language (Gemini) y Translate.

5. Aumentar el nivel de logs temporalmente:
   - Establece `LOG_LEVEL=debug` en `ecosystem.config.js` y reinicia PM2 para obtener más detalles.

6. Buscar timeouts y latencias:
   - En `combined.log` busca eventos del servicio Gemini/Vision con campos `timed out` o `timed out after`.

7. Verificar cuotas y errores de API desde Google Cloud Console:
   - Errores 403 (permission) o 429 (quota) aparecen en la consola.

8. Si la app lanza errores 5xx, copia el `reqId` y revisa todos los logs relacionados para ver la cadena de eventos y la causa raíz.

## 7) PM2 como servicio (Linux)

```bash
pm2 startup systemd
pm2 save
```

## 8) Buenas prácticas

- No exportar credenciales en el repo. Usa variables de entorno o mount de secretos.
- Mantén rotación de logs: PM2 puede integrarse con logrotate.
- Revisa `logs/error.log` tras reproducciones del fallo.

---

Si quieres, puedo:
- Añadir una ruta de healthcheck más detallada (`/api/health`) que valide Google APIs y devuelva un `reqId` para pruebas.
- Añadir interceptores axios para loggear requests/response hacia Gemini (útil para ver payloads y tiempos).
