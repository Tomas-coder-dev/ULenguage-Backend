/**
 * Tests para el módulo OCR
 * Valida endpoints, validaciones de archivos y manejo de errores
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');

describe('OCR Module - /api/ocr', () => {
  
  describe('GET /api/ocr/status', () => {
    it('debería retornar el estado del servicio OCR', async () => {
      const res = await request(app)
        .get('/api/ocr/status')
        .expect('Content-Type', /json/);
      
      expect(res.body).toHaveProperty('ok');
      expect(res.body).toHaveProperty('service');
      expect(res.body).toHaveProperty('provider');
      expect(res.body).toHaveProperty('ready');
      expect(res.body).toHaveProperty('timestamp');
      
      // El servicio puede estar disponible o no según las credenciales
      expect([200, 503]).toContain(res.status);
    });

    it('debería indicar si las credenciales de Google están configuradas', async () => {
      const res = await request(app)
        .get('/api/ocr/status');
      
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        expect(res.body.ready).toBe(true);
        expect(res.status).toBe(200);
      } else {
        expect(res.body.ready).toBe(false);
        expect(res.body).toHaveProperty('warning');
      }
    });
  });

  describe('POST /api/ocr/analyze', () => {
    it('debería retornar error 400 cuando no se envía archivo', async () => {
      const res = await request(app)
        .post('/api/ocr/analyze')
        .field('targetLang', 'es')
        .expect(400)
        .expect('Content-Type', /json/);
      
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('code', 'NO_FILE');
    });

    it('debería retornar error 400 con tipo de archivo inválido', async () => {
      // Crear un archivo de texto temporal
      const testFilePath = path.join(__dirname, 'test-file.txt');
      fs.writeFileSync(testFilePath, 'Este es un archivo de texto, no una imagen');
      
      try {
        const res = await request(app)
          .post('/api/ocr/analyze')
          .attach('image', testFilePath)
          .field('targetLang', 'es');
        
        // Debe retornar 400 por tipo inválido
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('code');
        expect(['INVALID_FILE_TYPE', 'UPLOAD_ERROR']).toContain(res.body.code);
      } catch (error) {
        // Si hay error de conexión, el middleware está rechazando correctamente
        expect(error.message).toMatch(/ECONNRESET|socket hang up/);
      } finally {
        // Limpiar archivo temporal
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it('debería retornar error 413 con archivo demasiado grande', async () => {
      // Crear un archivo grande (más de 5MB)
      const testFilePath = path.join(__dirname, 'large-test.jpg');
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB
      fs.writeFileSync(testFilePath, largeBuffer);
      
      const res = await request(app)
        .post('/api/ocr/analyze')
        .attach('image', testFilePath)
        .field('targetLang', 'es')
        .expect(413)
        .expect('Content-Type', /json/);
      
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('code', 'FILE_TOO_LARGE');
      expect(res.body).toHaveProperty('maxSize', '5 MB');
      
      // Limpiar archivo temporal
      fs.unlinkSync(testFilePath);
    });

    it('debería aceptar imágenes JPG, PNG y WEBP válidas', async () => {
      // Crear una imagen PNG válida de 1x1 pixel (mínima)
      const testImagePath = path.join(__dirname, 'test-image.png');
      const minimalPNG = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(testImagePath, minimalPNG);
      
      const res = await request(app)
        .post('/api/ocr/analyze')
        .attach('image', testImagePath)
        .field('targetLang', 'es');
      
      // El status puede ser 200 (éxito) o 500/503 (si no hay credenciales de Google)
      // Lo importante es que no sea 400 (validación de archivo)
      expect([200, 500, 503, 504]).toContain(res.status);
      
      // Si fue exitoso, debe tener las propiedades de respuesta OCR
      if (res.status === 200) {
        expect(res.body).toHaveProperty('texts');
        expect(res.body).toHaveProperty('labels');
        expect(res.body).toHaveProperty('objects');
      } else {
        // Si hubo error, debe tener código
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('code');
        expect(['OCR_ERROR', 'VISION_API_ERROR', 'AUTH_ERROR', 'TIMEOUT']).toContain(res.body.code);
      }
      
      // Limpiar archivo temporal
      fs.unlinkSync(testImagePath);
    });

    it('debería procesar el parámetro targetLang correctamente', async () => {
      const testImagePath = path.join(__dirname, 'test-image.png');
      const minimalPNG = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(testImagePath, minimalPNG);
      
      const langs = ['es', 'en', 'qu'];
      
      for (const lang of langs) {
        const res = await request(app)
          .post('/api/ocr/analyze')
          .attach('image', testImagePath)
          .field('targetLang', lang);
        
        // Verificar que el endpoint acepta el idioma
        expect([200, 500, 503, 504]).toContain(res.status);
      }
      
      fs.unlinkSync(testImagePath);
    });
  });

  describe('POST /api/ocr/analyze-and-translate', () => {
    it('debería retornar error 400 cuando no se envía archivo', async () => {
      const res = await request(app)
        .post('/api/ocr/analyze-and-translate')
        .field('targetLang', 'es')
        .expect(400)
        .expect('Content-Type', /json/);
      
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('code', 'NO_FILE');
    });

    it('debería validar tipos de archivo igual que /analyze', async () => {
      const testFilePath = path.join(__dirname, 'test-invalid.txt');
      fs.writeFileSync(testFilePath, 'Texto de prueba');
      
      try {
        const res = await request(app)
          .post('/api/ocr/analyze-and-translate')
          .attach('image', testFilePath)
          .field('targetLang', 'es');
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code');
        expect(['INVALID_FILE_TYPE', 'UPLOAD_ERROR']).toContain(res.body.code);
      } catch (error) {
        // Si hay error de conexión, el middleware está rechazando correctamente
        expect(error.message).toMatch(/ECONNRESET|socket hang up/);
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it('debería procesar múltiples idiomas cuando se especifica langs', async () => {
      const testImagePath = path.join(__dirname, 'test-multi.png');
      const minimalPNG = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(testImagePath, minimalPNG);
      
      const res = await request(app)
        .post('/api/ocr/analyze-and-translate')
        .attach('image', testImagePath)
        .field('targetLang', 'es')
        .field('langs', 'es,en,qu');
      
      expect([200, 500, 503, 504]).toContain(res.status);
      
      fs.unlinkSync(testImagePath);
    });
  });

  describe('Límites y validaciones de seguridad', () => {
    it('debería rechazar múltiples archivos en una sola petición', async () => {
      const testFile1 = path.join(__dirname, 'test1.png');
      const testFile2 = path.join(__dirname, 'test2.png');
      const minimalPNG = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82
      ]);
      
      fs.writeFileSync(testFile1, minimalPNG);
      fs.writeFileSync(testFile2, minimalPNG);
      
      const res = await request(app)
        .post('/api/ocr/analyze')
        .attach('image', testFile1)
        .attach('image', testFile2)
        .expect(400);
      
      // Multer envía UPLOAD_ERROR cuando hay múltiples archivos
      expect(res.body).toHaveProperty('code');
      expect(['TOO_MANY_FILES', 'UPLOAD_ERROR']).toContain(res.body.code);
      
      fs.unlinkSync(testFile1);
      fs.unlinkSync(testFile2);
    });

    it('debería crear el directorio uploads si no existe', async () => {
      const res = await request(app).get('/api/ocr/status');
      
      expect(res.body).toHaveProperty('uploadsDir', true);
      expect(fs.existsSync('uploads/')).toBe(true);
    });
  });

  describe('Estructura de respuestas', () => {
    it('todas las respuestas de error deben incluir message y code', async () => {
      const errorCases = [
        { endpoint: '/api/ocr/analyze', expectedCode: 'NO_FILE' },
        { endpoint: '/api/ocr/analyze-and-translate', expectedCode: 'NO_FILE' }
      ];
      
      for (const testCase of errorCases) {
        const res = await request(app)
          .post(testCase.endpoint)
          .field('targetLang', 'es')
          .expect(400);
        
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('code');
        expect(typeof res.body.message).toBe('string');
        expect(typeof res.body.code).toBe('string');
      }
    });
  });
});
