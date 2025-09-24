# Ulenguage Backend

Backend en Node.js diseñado para ser un servicio completo de procesamiento de lenguaje, combinando **Reconocimiento Óptico de Caracteres (OCR)** con **Tesseract.js** y un potente servicio de **Traducción de Idiomas** a través de la API de Google Translate.

## ✨ Características Principales

-   **OCR Avanzado**: Extrae texto de imágenes utilizando Tesseract.js.
-   **Detección de Idioma**: Identifica automáticamente si el texto extraído es Quechua, Español o Inglés.
-   **Traducción Multi-idioma**: Traduce texto entre cualquier par de idiomas soportado por Google Translate.
-   **Arquitectura Modular**: Servicios de OCR y Traducción separados para fácil mantenimiento y escalabilidad.

## 📋 Requisitos Previos

-   **Node.js** (v16 o superior)
-   **npm** (v8 o superior)
-   Una **Cuenta de Google Cloud** con un proyecto activo para la API de Traducción.

## 🚀 Instalación y Configuración

Sigue estos pasos para poner en marcha el servidor localmente.

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Tomas-coder-dev/Ulenguage_Backend.git
cd Ulenguage_Backend
```

### 2. Instalar Dependencias de Node.js
Este comando leerá el `package.json` e instalará todas las dependencias necesarias.
```bash
npm install
```

### 3. Configurar Credenciales de Google Translate
El servicio de traducción requiere un archivo de credenciales de una **Cuenta de Servicio** de Google Cloud.

1.  **Crea una Cuenta de Servicio** en tu proyecto de Google Cloud.
2.  Asígnale el rol **`Usuario de la API de Cloud Translation`**.
3.  Genera una **nueva clave JSON** para esa cuenta y descárgala.
4.  Renombra el archivo descargado a `google-credentials.json`.
5.  Coloca el archivo `google-credentials.json` en la **carpeta raíz** de tu proyecto.

### 4. Configurar Tesseract (OCR)
Para que el OCR funcione, necesitas los archivos de datos de entrenamiento (`.traineddata`) para cada idioma.

1.  Descarga los archivos para **Español, Inglés y Quechua**.
    -   [Español (spa.traineddata)](https://github.com/tesseract-ocr/tessdata_fast/raw/main/spa.traineddata)
    -   [Inglés (eng.traineddata)](https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata)
    -   [Quechua (que.traineddata)](https://github.com/tesseract-ocr/tessdata_fast/raw/main/que.traineddata)
2.  Crea una carpeta llamada `tessdata` en la raíz del proyecto y coloca los tres archivos dentro.

### 5. ¡Importante! Configurar .gitignore
Para evitar subir tus credenciales secretas a GitHub, abre tu archivo `.gitignore` y asegúrate de que contenga las siguientes líneas:
```
# Dependencias de Node
node_modules/

# Archivo de credenciales de Google Cloud
google-credentials.json

# Archivos de subida temporal
uploads/
```

## 📂 Estructura del Proyecto
```
Ulenguage_Backend/
├── .gitignore
├── node_modules/
├── package.json
├── google-credentials.json  <-- Archivo de credenciales (¡ignorado por git!)
├── src/
│   ├── server.js              <-- Servidor principal de Express
│   └── services/
│       ├── ocr/
│       └── translate/
└── tessdata/
    ├── eng.traineddata
    ├── que.traineddata
    └── spa.traineddata
```

## ▶️ Ejecución

-   **Modo Desarrollo** (con reinicio automático al guardar cambios):
    ```bash
    npm run dev
    ```

-   **Modo Producción**:
    ```bash
    npm start
    ```
El servidor se iniciará en `http://localhost:4000`.

## 📡 Endpoints de la API

### Servicio de OCR

#### 1. Extraer texto y detectar idioma
- **Endpoint**: `POST /api/ocr/extract-text-auto`
- **Body**: `form-data`
  - `image` → (file) El archivo de imagen a procesar.

### Servicio de Traducción

#### 2. Traducir texto
- **Endpoint**: `POST /api/translate`
- **Body**: `raw (JSON)`
  ```json
  {
    "text": "Wasiymi qosqo llaqtapi.",
    "target": "es"
  }
  ```
  - `text`: El texto que deseas traducir.
  - `target`: El código del idioma al que quieres traducir (ej: "en" para inglés, "es" para español).

## 🛠️ Dependencias Clave

-   **Express**: Framework para el servidor web.
-   **CORS**: Middleware para permitir peticiones cruzadas.
-   **Multer**: Middleware para manejar la subida de archivos (`multipart/form-data`).
-   **Tesseract.js**: Motor de OCR para extraer texto de imágenes.
-   **Sharp**: Procesador de imágenes de alto rendimiento, usado por Tesseract.js.
-   **Franc**: Librería para detectar el idioma del texto.
-   **@google-cloud/translate**: Cliente oficial de Google para la API de Traducción.

## ✍️ Autor

-   **Tomas-coder-dev** (y colaboradores)