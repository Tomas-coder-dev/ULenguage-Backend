const request = require('supertest');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Zone = require('../src/models/Zone');
const Achievement = require('../src/models/Achievement');
const seedZones = require('../src/seeders/zoneSeeder');

let token;
let userId;
let testZone;

beforeAll(async () => {
  await connectDB();
  
  // Limpiar colecciones
  await User.deleteMany({});
  await Zone.deleteMany({});
  await Achievement.deleteMany({});
  
  // Crear usuario de prueba
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Achievement User',
      email: 'achievement@test.com',
      password: 'test1234'
    });
  
  token = userRes.body.token;
  userId = userRes.body._id;
  
  // Sembrar zonas
  await seedZones();
  testZone = await Zone.findOne({ zone_id: 'plaza_armas_cusco' });
});

afterAll(async () => {
  await User.deleteMany({});
  await Zone.deleteMany({});
  await Achievement.deleteMany({});
});

describe('🏆 Achievement System', () => {
  describe('GET /api/achievements/zones', () => {
    it('Debe listar todas las zonas turísticas', async () => {
      const res = await request(app)
        .get('/api/achievements/zones')
        .expect(200);
      
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.zones).toBeInstanceOf(Array);
      expect(res.body.zones[0]).toHaveProperty('zone_id');
      expect(res.body.zones[0]).toHaveProperty('name_es');
      expect(res.body.zones[0]).toHaveProperty('coordinates');
    });
  });

  describe('GET /api/achievements/zones/nearby', () => {
    it('Debe encontrar zonas cercanas a coordenadas dadas', async () => {
      const res = await request(app)
        .get('/api/achievements/zones/nearby')
        .query({ lat: -13.5164, lon: -71.9675, radius: 1000 })
        .expect(200);
      
      expect(res.body.zones).toBeInstanceOf(Array);
    });

    it('Debe fallar sin coordenadas', async () => {
      const res = await request(app)
        .get('/api/achievements/zones/nearby')
        .expect(400);
      
      expect(res.body.message).toContain('Faltan parámetros');
    });
  });

  describe('POST /api/achievements/unlock', () => {
    it('Debe desbloquear logro cuando está dentro del radio', async () => {
      const [lon, lat] = testZone.coordinates;
      
      const res = await request(app)
        .post('/api/achievements/unlock')
        .set('Authorization', `Bearer ${token}`)
        .send({
          lat,
          lon,
          zoneId: testZone.zone_id,
          method: 'gps'
        })
        .expect(201);
      
      expect(res.body.message).toContain('desbloqueado');
      expect(res.body.achievement).toHaveProperty('zone_id', testZone.zone_id);
      expect(res.body.reward).toHaveProperty('badge');
    });

    it('No debe desbloquear logro fuera del radio', async () => {
      const res = await request(app)
        .post('/api/achievements/unlock')
        .set('Authorization', `Bearer ${token}`)
        .send({
          lat: 0,
          lon: 0,
          zoneId: 'machu_picchu',
          method: 'gps'
        })
        .expect(400);
      
      expect(res.body.message).toContain('No estás dentro del área');
    });

    it('No debe desbloquear logro duplicado', async () => {
      const [lon, lat] = testZone.coordinates;
      
      const res = await request(app)
        .post('/api/achievements/unlock')
        .set('Authorization', `Bearer ${token}`)
        .send({
          lat,
          lon,
          zoneId: testZone.zone_id,
          method: 'gps'
        })
        .expect(400);
      
      expect(res.body.message).toContain('Ya has desbloqueado');
    });

    it('Debe fallar sin autenticación', async () => {
      await request(app)
        .post('/api/achievements/unlock')
        .send({
          lat: -13.5164,
          lon: -71.9675,
          zoneId: 'plaza_armas_cusco'
        })
        .expect(401);
    });
  });

  describe('GET /api/achievements/me', () => {
    it('Debe listar logros del usuario', async () => {
      const res = await request(app)
        .get('/api/achievements/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(res.body.achievements).toBeInstanceOf(Array);
      expect(res.body.achievements.length).toBeGreaterThan(0);
      expect(res.body.stats).toHaveProperty('total');
      expect(res.body.stats).toHaveProperty('byMethod');
    });

    it('Debe fallar sin autenticación', async () => {
      await request(app)
        .get('/api/achievements/me')
        .expect(401);
    });
  });

  describe('POST /api/achievements/sync', () => {
    it('Debe sincronizar logros offline', async () => {
      // Crear zona de prueba para sync
      const syncZone = await Zone.findOne({ zone_id: 'qorikancha' });
      const [lon, lat] = syncZone.coordinates;
      
      const res = await request(app)
        .post('/api/achievements/sync')
        .set('Authorization', `Bearer ${token}`)
        .send({
          achievements: [
            {
              lat,
              lon,
              zoneId: syncZone.zone_id,
              timestamp: new Date().toISOString()
            }
          ]
        })
        .expect(200);
      
      expect(res.body.message).toContain('Sincronización');
      expect(res.body.results).toHaveProperty('synced');
      expect(res.body.results).toHaveProperty('failed');
      expect(res.body.results).toHaveProperty('duplicates');
    });

    it('Debe rechazar array vacío', async () => {
      const res = await request(app)
        .post('/api/achievements/sync')
        .set('Authorization', `Bearer ${token}`)
        .send({ achievements: [] })
        .expect(400);
      
      expect(res.body.message).toContain('No se enviaron logros');
    });
  });
});
