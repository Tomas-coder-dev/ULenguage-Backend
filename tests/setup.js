// Setup global para tests
process.env.NODE_ENV = 'test';
require('dotenv').config();

// Configurar timeout para tests
jest.setTimeout(10000);