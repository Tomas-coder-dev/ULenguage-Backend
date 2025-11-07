/**
 * Test unitario para verificar el modelo QuechuaCusqueno actualizado
 * con nuevos campos: variants, phonetics, sense, source, frequency
 * y normalización mejorada
 */

const mongoose = require('mongoose');
const QuechuaCusqueno = require('../src/models/QuechuaCusqueno');

describe('🦙 QuechuaCusqueno Model - Mejoras', () => {
  beforeAll(async () => {
    const dbUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/ulenguage_test';
    await mongoose.connect(dbUri);
  });

  afterAll(async () => {
    await QuechuaCusqueno.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await QuechuaCusqueno.deleteMany({});
  });

  it('Debe crear entrada con los nuevos campos', async () => {
    const entry = await QuechuaCusqueno.create({
      spanish: 'Hola',
      quechua_cusqueno: 'Rimaykullayki',
      variants: ['ola', 'hola!', 'holaa'],
      phonetics: 'ˈola',
      sense: 'saludo informal',
      context: 'conversación diaria',
      category: 'saludos',
      source: 'seeder',
      frequency: 100
    });

    expect(entry.spanish).toBe('hola'); // normalizado a minúsculas
    expect(entry.variants).toHaveLength(3);
    expect(entry.phonetics).toBe('ˈola');
    expect(entry.sense).toBe('saludo informal');
    expect(entry.source).toBe('seeder');
    expect(entry.frequency).toBe(100);
  });

  it('Debe normalizar el campo spanish correctamente (trim, lowercase, sin puntuación)', async () => {
    const entry = await QuechuaCusqueno.create({
      spanish: '  CASA!!!  ',
      quechua_cusqueno: 'Wasi'
    });

    // La normalización debe eliminar espacios, puntuación y convertir a minúsculas
    expect(entry.spanish).toBe('casa');
  });

  it('Debe normalizar variantes y eliminar vacías', async () => {
    const entry = await QuechuaCusqueno.create({
      spanish: 'gracias',
      quechua_cusqueno: 'Sulpayki',
      variants: ['  GRACIAS!!!  ', 'grax', '', '   ']
    });

    expect(entry.variants).toContain('gracias');
    expect(entry.variants).toContain('grax');
    expect(entry.variants).not.toContain(''); // vacías deben ser eliminadas
    expect(entry.variants.filter(v => v.trim() === '')).toHaveLength(0);
  });

  it('Debe permitir múltiples entradas con el mismo spanish (unique: false)', async () => {
    await QuechuaCusqueno.create({
      spanish: 'casa',
      quechua_cusqueno: 'Wasi',
      sense: 'edificio'
    });

    const entry2 = await QuechuaCusqueno.create({
      spanish: 'casa',
      quechua_cusqueno: 'Wasi ayllu',
      sense: 'familia'
    });

    const count = await QuechuaCusqueno.countDocuments({ spanish: 'casa' });
    expect(count).toBe(2);
    expect(entry2.sense).toBe('familia');
  });

  it('Debe validar enum de source', async () => {
    try {
      await QuechuaCusqueno.create({
        spanish: 'test',
        quechua_cusqueno: 'test',
        source: 'invalid_source' // fuente inválida
      });
      fail('Debería fallar con source inválido');
    } catch (error) {
      expect(error.name).toBe('ValidationError');
    }
  });

  it('Debe usar valores por defecto correctamente', async () => {
    const entry = await QuechuaCusqueno.create({
      spanish: 'agua',
      quechua_cusqueno: 'Unu'
    });

    expect(entry.variants).toEqual([]);
    expect(entry.phonetics).toBe('');
    expect(entry.sense).toBe('');
    expect(entry.source).toBe('seeder'); // default
    expect(entry.frequency).toBe(0); // default
  });

  it('Debe respetar min: 0 en frequency', async () => {
    try {
      await QuechuaCusqueno.create({
        spanish: 'test',
        quechua_cusqueno: 'test',
        frequency: -5 // negativo no permitido
      });
      fail('Debería fallar con frequency negativo');
    } catch (error) {
      expect(error.name).toBe('ValidationError');
    }
  });

  it('Debe actualizar y normalizar en updates', async () => {
    const entry = await QuechuaCusqueno.create({
      spanish: 'sol',
      quechua_cusqueno: 'Inti'
    });

    await QuechuaCusqueno.findByIdAndUpdate(entry._id, {
      $set: {
        spanish: '  SOL!!!  ',
        variants: ['  sol!!  ', 'sool', '']
      }
    });

    const updated = await QuechuaCusqueno.findById(entry._id);
    expect(updated.spanish).toBe('sol');
    expect(updated.variants).toContain('sol');
    expect(updated.variants).not.toContain('');
  });

  it('Debe incluir nuevos campos en toJSON', async () => {
    const entry = await QuechuaCusqueno.create({
      spanish: 'montaña',
      quechua_cusqueno: 'Urqu',
      variants: ['montana'],
      source: 'manual',
      frequency: 50
    });

    const json = entry.toJSON();
    expect(json.id).toBeDefined();
    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
    expect(json.variants).toEqual(['montana']);
    expect(json.source).toBe('manual');
    expect(json.frequency).toBe(50);
  });
});
