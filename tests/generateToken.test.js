const jwt = require('jsonwebtoken');
const generateToken = require('../src/utils/generateToken');

describe('Generar token JWT', () => {
  it('debe generar un token válido', () => {
    const id = '60d21b4667d0d8992e610c85';
    const token = generateToken(id);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(id);
  });
});