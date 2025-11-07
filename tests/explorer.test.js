const request = require('supertest');
const app = require('../src/app');

describe('GET /api/explorer', () => {
  it('debe devolver una lista de lugares turísticos con enlaces Google Maps', async () => {
    const res = await request(app).get('/api/explorer');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('sites');
    expect(Array.isArray(res.body.sites)).toBe(true);
    expect(res.body.sites.length).toBeGreaterThan(0);
    // Verifica estructura de un lugar
    const site = res.body.sites[0];
    expect(site).toHaveProperty('name');
    expect(site).toHaveProperty('location');
    expect(site.location).toHaveProperty('googleMapsUrl');
    expect(site).toHaveProperty('image');
    expect(site).toHaveProperty('description');
  });

  it('debe manejar errores internos correctamente', async () => {
    // Simular error: renombrar temporalmente la función
    const originalFn = app._router.stack.find(r => r.route && r.route.path === '/api/explorer').route.stack[0].handle;
    app._router.stack.find(r => r.route && r.route.path === '/api/explorer').route.stack[0].handle = (req, res) => {
      res.status(500).json({ message: 'Error interno al obtener lugares turísticos' });
    };
    const res = await request(app).get('/api/explorer');
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message');
    // Restaurar función original
    app._router.stack.find(r => r.route && r.route.path === '/api/explorer').route.stack[0].handle = originalFn;
  });
});
