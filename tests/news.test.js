const request = require('supertest');
const app = require('../src/app');
const News = require('../src/models/News');

describe('📰 News API Tests', () => {
  let server;

  beforeAll(async () => {
    await app.initializeDatabase();
    server = app;
  });

  beforeEach(async () => {
    // Limpiar noticias antes de cada test
    await News.deleteMany({});
  });

  afterAll(async () => {
    await News.deleteMany({});
  });

  describe('GET /api/news', () => {
    beforeEach(async () => {
      // Insertar noticias de prueba en los 3 idiomas
      const testNews = [
        {
          title: 'Noticia en Español 1',
          content: 'Contenido en español sobre cultura cusqueña',
          summary: 'Resumen en español',
          language: 'es',
          category: 'cultura',
          isActive: true,
          publishedAt: new Date('2025-11-03'),
        },
        {
          title: 'Noticia en Español 2',
          content: 'Segunda noticia en español',
          summary: 'Resumen',
          language: 'es',
          category: 'festividad',
          isActive: true,
          publishedAt: new Date('2025-11-02'),
        },
        {
          title: 'Noticia en Español 3',
          content: 'Tercera noticia en español',
          summary: 'Resumen',
          language: 'es',
          category: 'arqueologia',
          isActive: true,
          publishedAt: new Date('2025-11-01'),
        },
        {
          title: 'Noticia en Español 4',
          content: 'Cuarta noticia en español',
          summary: 'Resumen',
          language: 'es',
          category: 'general',
          isActive: true,
          publishedAt: new Date('2025-10-31'),
        },
        {
          title: 'English News 1',
          content: 'Content in English about Cusco culture',
          summary: 'English summary',
          language: 'en',
          category: 'cultura',
          isActive: true,
          publishedAt: new Date('2025-11-03'),
        },
        {
          title: 'Quechua Willakuy 1',
          content: 'Quechua simapi willakuy',
          summary: 'Quechua resumen',
          language: 'qu',
          category: 'tradicion',
          isActive: true,
          publishedAt: new Date('2025-11-03'),
        },
        {
          title: 'Noticia Inactiva',
          content: 'Esta noticia no debe aparecer',
          summary: 'Resumen',
          language: 'es',
          category: 'general',
          isActive: false,
          publishedAt: new Date('2025-11-03'),
        },
      ];

      await News.insertMany(testNews);
    });

    test('Debe devolver las últimas 3 noticias en español por defecto', async () => {
      const response = await request(server).get('/api/news');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.language).toBe('es');
      expect(response.body.count).toBe(3);
      expect(response.body.data).toHaveLength(3);

      // Verificar que estén ordenadas por fecha descendente
      const dates = response.body.data.map((n) => new Date(n.publishedAt));
      expect(dates[0] >= dates[1]).toBe(true);
      expect(dates[1] >= dates[2]).toBe(true);

      // Verificar que solo incluya noticias activas en español
      response.body.data.forEach((news) => {
        expect(news.language).toBe('es');
        expect(news.isActive).toBe(true);
      });
    });

    test('Debe filtrar noticias por idioma inglés', async () => {
      const response = await request(server).get('/api/news?lang=en');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.language).toBe('en');
      expect(response.body.data.length).toBeGreaterThan(0);
      
      response.body.data.forEach((news) => {
        expect(news.language).toBe('en');
        expect(news.isActive).toBe(true);
      });
    });

    test('Debe filtrar noticias por idioma quechua', async () => {
      const response = await request(server).get('/api/news?lang=qu');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.language).toBe('qu');
      expect(response.body.data.length).toBeGreaterThan(0);
      
      response.body.data.forEach((news) => {
        expect(news.language).toBe('qu');
        expect(news.isActive).toBe(true);
      });
    });

    test('Debe respetar el límite de noticias solicitado', async () => {
      const response = await request(server).get('/api/news?lang=es&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    test('Debe devolver español si el idioma no es válido', async () => {
      const response = await request(server).get('/api/news?lang=fr');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.language).toBe('es'); // Fallback a español
    });

    test('No debe incluir noticias inactivas', async () => {
      const response = await request(server).get('/api/news?lang=es&limit=10');

      expect(response.status).toBe(200);
      
      // Verificar que ninguna noticia sea la inactiva
      const inactiveNews = response.body.data.find(
        (news) => news.title === 'Noticia Inactiva'
      );
      expect(inactiveNews).toBeUndefined();
    });

    test('Debe devolver lista vacía si no hay noticias en el idioma', async () => {
      // Eliminar todas las noticias en quechua
      await News.deleteMany({ language: 'qu' });

      const response = await request(server).get('/api/news?lang=qu');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toHaveLength(0);
    });

    test('Debe incluir todos los campos esperados en la respuesta', async () => {
      const response = await request(server).get('/api/news?lang=es&limit=1');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);

      const news = response.body.data[0];
      expect(news).toHaveProperty('_id');
      expect(news).toHaveProperty('title');
      expect(news).toHaveProperty('content');
      expect(news).toHaveProperty('summary');
      expect(news).toHaveProperty('imageUrl');
      expect(news).toHaveProperty('language');
      expect(news).toHaveProperty('category');
      expect(news).toHaveProperty('isActive');
      expect(news).toHaveProperty('publishedAt');
      expect(news).toHaveProperty('author');
      expect(news).toHaveProperty('viewCount');
    });

    test('No debe devolver campos internos como __v', async () => {
      const response = await request(server).get('/api/news?lang=es&limit=1');

      expect(response.status).toBe(200);
      const news = response.body.data[0];
      expect(news).not.toHaveProperty('__v');
    });
  });

  describe('GET /api/news/:id', () => {
    let newsId;

    beforeEach(async () => {
      const news = await News.create({
        title: 'Noticia de Prueba',
        content: 'Contenido de prueba',
        summary: 'Resumen',
        language: 'es',
        category: 'cultura',
        isActive: true,
      });
      newsId = news._id;
    });

    test('Debe obtener una noticia por ID', async () => {
      const response = await request(server).get(`/api/news/${newsId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Noticia de Prueba');
    });

    test('Debe incrementar el contador de vistas', async () => {
      const initialNews = await News.findById(newsId);
      const initialViewCount = initialNews.viewCount;

      await request(server).get(`/api/news/${newsId}`);

      const updatedNews = await News.findById(newsId);
      expect(updatedNews.viewCount).toBe(initialViewCount + 1);
    });

    test('Debe devolver 404 si la noticia no existe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(server).get(`/api/news/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('no encontrada');
    });
  });
});
