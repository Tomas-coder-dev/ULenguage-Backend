# Ulenguage Backend OCR

Backend Node.js para procesamiento OCR (reconocimiento de texto en imágenes) y detección automática de idioma (Quechua, Español, Inglés).

## Requisitos

- Node.js >= 16
- npm >= 8

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <URL-del-repo>
   cd Ulenguage_Backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Estructura recomendada**
   ```
   src/
     services/
       ocr/
         ocr.controller.js
         wordlists.js
     server.js
   tessdata/
     spa.traineddata
     eng.traineddata
     que.traineddata
   ```

   > Descarga los archivos `.traineddata` para los idiomas que necesites y colócalos en la carpeta `tessdata`.

## Variables de entorno (opcional)

Puedes configurar el puerto en tu archivo `.env`:

```
PORT=4000
```

## Ejecución

- Para desarrollo:
  ```bash
  npm run dev
  ```
- Para producción:
  ```bash
  npm start
  ```

## Endpoints principales

### 1. Extraer texto forzando idioma

**POST** `/api/ocr/extract-text?lang=spa|eng|que`

- Body: `form-data`
  - `image`: archivo de imagen

### 2. Extraer texto y detectar idioma automáticamente

**POST** `/api/ocr/extract-text-auto`

- Body: `form-data`
  - `image`: archivo de imagen

## Ejemplo en Postman

- Método: POST
- URL: `http://localhost:4000/api/ocr/extract-text-auto`
- Body: form-data
  - Key: `image`
  - Value: Selecciona tu archivo

## Dependencias clave

- [express](https://www.npmjs.com/package/express)
- [multer](https://www.npmjs.com/package/multer)
- [tesseract.js](https://www.npmjs.com/package/tesseract.js)
- [sharp](https://www.npmjs.com/package/sharp)
- [franc](https://www.npmjs.com/package/franc)

## Notas

- Verifica que los archivos `.traineddata` estén en la ruta correcta para cada idioma.
- Puedes personalizar las listas de palabras clave en `wordlists.js` para mejorar la detección.
- Si tienes errores con la librería `franc`, usa:  
  ```js
  const franc = require('franc').franc;
  ```

## Autor

Tomas-coder-dev y colaborador
