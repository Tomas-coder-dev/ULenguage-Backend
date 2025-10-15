const request = require('supertest');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await User.deleteMany({ email: { $regex: /test.*@google/ } });
});

describe('🔐 Google OAuth Authentication', () => {
  describe('POST /api/auth/google', () => {
    it('Debe fallar sin tokenId', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({})
        .expect(400);
      
      expect(res.body.message).toContain('Token de Google es requerido');
    });

    it('Debe fallar con token inválido', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({ tokenId: 'invalid_token_123' })
        .expect(401);
      
      expect(res.body.message).toContain('inválido');
    });

    // Nota: Para testear con token real, necesitarías un token válido de Google
    // que expire en poco tiempo. En producción, usa mocks o tokens de prueba.
  });

  describe('GET /api/auth/google/url', () => {
    it('Debe devolver URL de autorización de Google', async () => {
      const res = await request(app)
        .get('/api/auth/google/url')
        .expect(200);
      
      expect(res.body).toHaveProperty('authUrl');
      expect(res.body.authUrl).toContain('accounts.google.com');
      expect(res.body.authUrl).toContain('client_id');
    });
  });

  describe('GET /api/auth/google/callback', () => {
    it('Debe fallar sin código de autorización', async () => {
      const res = await request(app)
        .get('/api/auth/google/callback')
        .expect(400);
      
      expect(res.body.message).toContain('Código de autorización');
    });
  });
});

describe('👤 User Model - Google Integration', () => {
  it('Debe crear usuario con googleId', async () => {
    const user = await User.create({
      name: 'Test Google User',
      email: 'testgoogle@google.com',
      googleId: 'google_123456789',
      password: 'temp_password_123'
    });

    expect(user.googleId).toBe('google_123456789');
    expect(user.email).toBe('testgoogle@google.com');
    
    await User.deleteOne({ _id: user._id });
  });

  it('Debe permitir usuario sin googleId (registro normal)', async () => {
    const user = await User.create({
      name: 'Test Normal User',
      email: 'testnormal@google.com',
      password: 'password123'
    });

    expect(user.googleId).toBeUndefined();
    expect(user.email).toBe('testnormal@google.com');
    
    await User.deleteOne({ _id: user._id });
  });
});
