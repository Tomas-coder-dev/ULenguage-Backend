const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

// Configuración de testing
beforeAll(async () => {
  // Conectar a base de datos de test
  const url = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/ulenguage_test';
  await mongoose.connect(url);
});

beforeEach(async () => {
  // Limpiar base de datos antes de cada test
  await User.deleteMany({});
});

afterAll(async () => {
  // Cerrar conexión después de todos los tests
  await mongoose.connection.close();
});

describe('Autenticación de usuarios', () => {
  describe('POST /api/auth/register', () => {
    it('debe crear usuario y devolver JWT', async () => {
      const userData = {
        name: 'Luis Pérez',
        email: 'luis@mail.com',
        password: '123456'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe(userData.name);
      expect(res.body.email).toBe(userData.email);
      expect(res.body.plan).toBe('free');
    });

    it('debe rechazar email duplicado', async () => {
      const userData = {
        name: 'Ana García',
        email: 'ana@duplicate.com',
        password: '123456'
      };

      // Crear primer usuario directamente en BD
      await User.create(userData);

      // Intentar registrar con mismo email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Ana Diferente',
          email: 'ana@duplicate.com',
          password: '654321'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Usuario ya existe');
    });

    it('debe rechazar contraseña muy corta', async () => {
      const userData = {
        name: 'Pedro Lima',
        email: 'pedro@mail.com',
        password: '123' // Muy corta
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(400); // El modelo mongoose valida y devuelve 400
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crear usuario para tests de login
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'María González',
          email: 'maria@mail.com',
          password: '123456'
        });
    });

    it('debe hacer login exitoso con credenciales válidas', async () => {
      const loginData = {
        email: 'maria@mail.com',
        password: '123456'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('_id');
      expect(res.body.email).toBe(loginData.email);
    });

    it('debe rechazar credenciales inválidas', async () => {
      const loginData = {
        email: 'maria@mail.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Credenciales inválidas');
    });

    it('debe rechazar email inexistente', async () => {
      const loginData = {
        email: 'noexiste@mail.com',
        password: '123456'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Credenciales inválidas');
    });
  });
});
