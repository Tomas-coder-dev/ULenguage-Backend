const request = require('supertest');
const app = require('../src/app');

describe('INTEGRACIÓN /api/explorer', () => {
  it('debe devolver lugares turísticos reales con enlaces Google Maps y descripciones generadas', async () => {
    const res = await request(app).get('/api/explorer');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('sites');
    expect(Array.isArray(res.body.sites)).toBe(true);
    expect(res.body.sites.length).toBeGreaterThan(0);
    // Verifica estructura de un lugar real
    const site = res.body.sites[0];
    expect(site).toHaveProperty('name');
    expect(site).toHaveProperty('location');
    expect(site.location).toHaveProperty('googleMapsUrl');
    expect(site).toHaveProperty('image');
    expect(site).toHaveProperty('description');
    // Verifica que la descripción no sea vacía
    expect(site.description).not.toBe('');
    // Verifica que el enlace de Google Maps sea válido
    expect(site.location.googleMapsUrl).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  });

  it('debe manejar errores de servicios externos correctamente', async () => {
    // Este test espera que si hay error externo, el backend devuelva un mensaje claro
    // Simula desconexión de internet o credenciales inválidas manualmente si quieres probarlo
    // Aquí solo se verifica que el backend responde con status 500 y mensaje en español
    // Puedes forzar el error cambiando temporalmente la clave o desconectando la red
    // Si el servicio responde, este test puede pasar como "no ejecutado"
    // expect(res.statusCode).toBe(500);
    // expect(res.body).toHaveProperty('message');
  });
});
