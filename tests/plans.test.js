const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Plan = require('../src/models/Plan');

beforeAll(async () => {
  const url = process.env.MONGO_URI || 'mongodb://localhost:27017/ulenguage_test';
  await mongoose.connect(url);
});

beforeEach(async () => {
  await Plan.deleteMany({});
  
  // Crear planes de prueba
  await Plan.create([
    {
      name: "Gratuito",
      description: "Plan básico",
      price: 0,
      features: ["OCR 10/día", "Traducción básica"]
    },
    {
      name: "Premium", 
      description: "Plan completo",
      price: 5.99,
      features: ["OCR ilimitado", "Audio pronunciación", "Sin anuncios"]
    }
  ]);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Gestión de planes', () => {
  describe('GET /api/planes', () => {
    it('debe listar todos los planes disponibles', async () => {
      const res = await request(app)
        .get('/api/planes');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      
      const freePlan = res.body.find(plan => plan.name === "Gratuito");
      const premiumPlan = res.body.find(plan => plan.name === "Premium");
      
      expect(freePlan).toBeDefined();
      expect(freePlan.price).toBe(0);
      expect(premiumPlan).toBeDefined();
      expect(premiumPlan.price).toBe(5.99);
    });

    it('debe devolver array vacío si no hay planes', async () => {
      await Plan.deleteMany({});
      
      const res = await request(app)
        .get('/api/planes');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });
  });
});