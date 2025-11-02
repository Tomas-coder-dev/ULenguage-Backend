'use strict';
/**
 * src/seeders/quechuaSeeder.js
 *
 * Seeder idempotente para QuechuaCusqueno.
 * - Usa items INLINE por defecto (editable) o data/quechua_seed.json si existe.
 * - Normaliza `spanish` (trim().toLowerCase()) y `quechua_cusqueno`.
 * - Upsert via bulkWrite en chunks (evita duplicados en la misma ejecución).
 *
 * Uso:
 *  node -r dotenv/config src/seeders/quechuaSeeder.js --dry
 *  node -r dotenv/config src/seeders/quechuaSeeder.js
 *  node src/seeders/quechuaSeeder.js --mongo="mongodb://127.0.0.1:27017/ulenguage" --dry
 */
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const argv = require('yargs').argv;

// Cargar .env si existe (permitir node -r dotenv/config o require here)
try { require('dotenv').config(); } catch (e) { /* ignore if dotenv not installed */ }

const mongoUri = argv.mongo || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ulenguage';
const dryRun = !!argv.dry;

// Requerir el modelo desde src/models (este archivo está en src/seeders)
const Quechua = require(path.join(__dirname, '..', 'models', 'QuechuaCusqueno'));

// ----------------------
// 1) Datos INLINE (edítalos aquí si quieres)
// ----------------------
const itemsInline = [
  // 1. Saludos y Frases Comunes
  { spanish: "Hola (formal)", quechua_cusqueno: "Rimaykullayki", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "¿Cómo estás?", quechua_cusqueno: "Allillanchu?", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "Estoy bien", quechua_cusqueno: "Allillanmi", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "Gracias", quechua_cusqueno: "Añay", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "Te pago / Gracias", quechua_cusqueno: "Sulpayki", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "De nada", quechua_cusqueno: "Imamantataq", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "Sí", quechua_cusqueno: "Arí", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "No", quechua_cusqueno: "Manan", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "Quizás", quechua_cusqueno: "Icha", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "Adiós (hasta que nos encontremos)", quechua_cusqueno: "Tupananchiskama", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "Hasta mañana", quechua_cusqueno: "Paqarin kama", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "¿Está bien? / ¿Por favor?", quechua_cusqueno: "Allichu?", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "¿Cuál es tu nombre?", quechua_cusqueno: "Iman sutiyki?", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "Mi nombre es...", quechua_cusqueno: "Sutiyqa...", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "Vamos", quechua_cusqueno: "Haku", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "Vamos (invitando)", quechua_cusqueno: "Hakuchu", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "¿Qué?", quechua_cusqueno: "Ima?", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "¿Quién?", quechua_cusqueno: "Pi?", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "¿Dónde?", quechua_cusqueno: "Maypi?", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "¿Cuándo?", quechua_cusqueno: "Hayk'aq?", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "¿Por qué?", quechua_cusqueno: "Imarayku?", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "¿Cuánto?", quechua_cusqueno: "Hayk'a?", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "¿Cómo?", quechua_cusqueno: "Imaynalla?", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "No (prohibitivo)", quechua_cusqueno: "Ama", category: "Saludos y Frases Comunes", examples: [] },
  { spanish: "Perdóname", quechua_cusqueno: "Pampachaway", category: "Saludos y Frases Comunes", examples: [] },

  // 2. Personas y Familia
  { spanish: "Persona, gente", quechua_cusqueno: "Runa", category: "Personas y Familia", examples: [] },
  { spanish: "Hombre", quechua_cusqueno: "Qhari", category: "Personas y Familia", examples: [] },
  { spanish: "Mujer (también esposa)", quechua_cusqueno: "Warmi", category: "Personas y Familia", examples: [] },
  { spanish: "Esposo", quechua_cusqueno: "Qusa", category: "Personas y Familia", examples: [] },
  { spanish: "Niño/a, bebé, hijo/a", quechua_cusqueno: "Wawa", category: "Personas y Familia", examples: [] },
  { spanish: "Muchacho, joven", quechua_cusqueno: "Maqta", category: "Personas y Familia", examples: [] },
  { spanish: "Muchacha, joven", quechua_cusqueno: "Pasña", category: "Personas y Familia", examples: [] },
  { spanish: "Señorita", quechua_cusqueno: "Sipas", category: "Personas y Familia", examples: [] },
  { spanish: "Joven (varón)", quechua_cusqueno: "Wayna", category: "Personas y Familia", examples: [] },
  { spanish: "Madre", quechua_cusqueno: "Mama", category: "Personas y Familia", examples: [] },
  { spanish: "Padre", quechua_cusqueno: "Tayta", category: "Personas y Familia", examples: [] },
  { spanish: "Hijo (del padre)", quechua_cusqueno: "Churi", category: "Personas y Familia", examples: [] },
  { spanish: "Hija (del padre)", quechua_cusqueno: "Ususi", category: "Personas y Familia", examples: [] },
  { spanish: "Anciano, abuelo", quechua_cusqueno: "Machu", category: "Personas y Familia", examples: [] },
  { spanish: "Anciana, abuela", quechua_cusqueno: "Paya", category: "Personas y Familia", examples: [] },
  { spanish: "Nieto/a", quechua_cusqueno: "Willka", category: "Personas y Familia", examples: [] },
  { spanish: "Hermano (entre hombres)", quechua_cusqueno: "Wawqi", category: "Personas y Familia", examples: [] },
  { spanish: "Hermana (de un hombre)", quechua_cusqueno: "Pana", category: "Personas y Familia", examples: [] },
  { spanish: "Hermano (de una mujer)", quechua_cusqueno: "Tura", category: "Personas y Familia", examples: [] },
  { spanish: "Hermana (entre mujeres)", quechua_cusqueno: "Ñaña", category: "Personas y Familia", examples: [] },
  { spanish: "Tío", quechua_cusqueno: "Kaka", category: "Personas y Familia", examples: [] },
  { spanish: "Tía", quechua_cusqueno: "Ipa", category: "Personas y Familia", examples: [] },
  { spanish: "Amigo/a, compañero", quechua_cusqueno: "Masi", category: "Personas y Familia", examples: [] },
  { spanish: "Ancestro, espíritu", quechua_cusqueno: "Awki", category: "Personas y Familia", examples: [] },
  { spanish: "Princesa", quechua_cusqueno: "Ñusta", category: "Personas y Familia", examples: [] },
  { spanish: "Rey, emperador", quechua_cusqueno: "Inka", category: "Personas y Familia", examples: [] },
  { spanish: "Rico, poderoso, rey", quechua_cusqueno: "Qhapaq", category: "Personas y Familia", examples: [] },
  { spanish: "Pobre, huérfano", quechua_cusqueno: "Wakcha", category: "Personas y Familia", examples: [] },
  { spanish: "Pueblo, ciudad", quechua_cusqueno: "Llaqta", category: "Personas y Familia", examples: [] },
  { spanish: "Compatriota", quechua_cusqueno: "Llaqtamasi", category: "Personas y Familia", examples: [] },
  { spanish: "Profesor", quechua_cusqueno: "Yachachiq", category: "Personas y Familia", examples: [] },
  { spanish: "Sabio, el que sabe", quechua_cusqueno: "Yachaq", category: "Personas y Familia", examples: [] },
  { spanish: "Curandero", quechua_cusqueno: "Hampiq", category: "Personas y Familia", examples: [] },
  { spanish: "Gente (plural)", quechua_cusqueno: "Runakuna", category: "Personas y Familia", examples: [] },
  { spanish: "Bebé recién nacido", quechua_cusqueno: "Llullu wawa", category: "Personas y Familia", examples: [] },

  // 3. Partes del Cuerpo
  { spanish: "Cabeza", quechua_cusqueno: "Uma", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Cara", quechua_cusqueno: "Uya", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Cabello", quechua_cusqueno: "Chukcha", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Frente", quechua_cusqueno: "Mat'i", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Ojo", quechua_cusqueno: "Ñawi", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Pestaña", quechua_cusqueno: "Qhechiphra", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Ceja", quechua_cusqueno: "Qheñipa", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Nariz", quechua_cusqueno: "Sinqa", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Boca", quechua_cusqueno: "Simi", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Diente", quechua_cusqueno: "Kiru", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Muela", quechua_cusqueno: "Waqsu", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Lengua", quechua_cusqueno: "Qallu", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Labio", quechua_cusqueno: "Wirp'a", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Mentón", quechua_cusqueno: "K'aki", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Oreja", quechua_cusqueno: "Ninri", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Cuello", quechua_cusqueno: "Kunka", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Hombro", quechua_cusqueno: "Rikra", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Mano (también brazo)", quechua_cusqueno: "Maki", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Codo", quechua_cusqueno: "Kukuchu", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Dedo", quechua_cusqueno: "Ruk'ana", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Uña", quechua_cusqueno: "Sillu", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Pecho", quechua_cusqueno: "Qhasqu", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Corazón", quechua_cusqueno: "Sunqu", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Espalda", quechua_cusqueno: "Wasa", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Estómago, barriga", quechua_cusqueno: "Wiksa", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Pierna", quechua_cusqueno: "Chaka", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Ombligo", quechua_cusqueno: "P'usnu", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Rodilla", quechua_cusqueno: "Qunqur", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Pie", quechua_cusqueno: "Chaki", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Uña del pie", quechua_cusqueno: "Chaki sillu", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Hueso", quechua_cusqueno: "Tullu", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Sangre", quechua_cusqueno: "Yawar", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Piel", quechua_cusqueno: "Qara", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Carne (músculo)", quechua_cusqueno: "Aycha", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Pulmón", quechua_cusqueno: "Surq'an", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Hígado", quechua_cusqueno: "K'ipchan", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Riñón", quechua_cusqueno: "Rurun", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Cerebro", quechua_cusqueno: "Ñutqhu", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Sudor", quechua_cusqueno: "Hump'i", category: "Partes del Cuerpo", examples: [] },
  { spanish: "Lágrima", quechua_cusqueno: "Ñawi wq'i", category: "Partes del Cuerpo", examples: [] },

  // 4. Animales (Uywa)
  { spanish: "Animal doméstico", quechua_cusqueno: "Uywa", category: "Animales", examples: [] },
  { spanish: "Animal salvaje", quechua_cusqueno: "Sallqa", category: "Animales", examples: [] },
  { spanish: "Perro", quechua_cusqueno: "Allqu", category: "Animales", examples: [] },
  { spanish: "Gato", quechua_cusqueno: "Misi", category: "Animales", examples: [] },
  { spanish: "Cuy", quechua_cusqueno: "Qhwi", category: "Animales", examples: [] },
  { spanish: "Llama", quechua_cusqueno: "Llama", category: "Animales", examples: [] },
  { spanish: "Alpaca", quechua_cusqueno: "Paqucha", category: "Animales", examples: [] },
  { spanish: "Vicuña", quechua_cusqueno: "Wik'uña", category: "Animales", examples: [] },
  { spanish: "Guanaco", quechua_cusqueno: "Wanaku", category: "Animales", examples: [] },
  { spanish: "Vaca", quechua_cusqueno: "Waka", category: "Animales", examples: [] },
  { spanish: "Toro", quechua_cusqueno: "Turu", category: "Animales", examples: [] },
  { spanish: "Caballo", quechua_cusqueno: "Kawallu", category: "Animales", examples: [] },
  { spanish: "Oveja", quechua_cusqueno: "Uwija", category: "Animales", examples: [] },
  { spanish: "Cerdo", quechua_cusqueno: "Khuchi", category: "Animales", examples: [] },
  { spanish: "Gallina", quechua_cusqueno: "Wallpa", category: "Animales", examples: [] },
  { spanish: "Gallo", quechua_cusqueno: "K'anka", category: "Animales", examples: [] },
  { spanish: "Pato", quechua_cusqueno: "Pili", category: "Animales", examples: [] },
  { spanish: "Burro", quechua_cusqueno: "Asnu", category: "Animales", examples: [] },
  { spanish: "Cóndor", quechua_cusqueno: "Kuntur", category: "Animales", examples: [] },
  { spanish: "Águila, gavilán", quechua_cusqueno: "Anka", category: "Animales", examples: [] },
  { spanish: "Puma", quechua_cusqueno: "Puma", category: "Animales", examples: [] },
  { spanish: "Zorro", quechua_cusqueno: "Atuq", category: "Animales", examples: [] },
  { spanish: "Venado", quechua_cusqueno: "Taruka", category: "Animales", examples: [] },
  { spanish: "Oso (de anteojos)", quechua_cusqueno: "Ukuku", category: "Animales", examples: [] },
  { spanish: "Oso (alternativo)", quechua_cusqueno: "Ukumari", category: "Animales", examples: [] },
  { spanish: "Serpiente", quechua_cusqueno: "Mach'aqway", category: "Animales", examples: [] },
  { spanish: "Serpiente mítica, grande", quechua_cusqueno: "Amaru", category: "Animales", examples: [] },
  { spanish: "Sapo", quechua_cusqueno: "Hamp'atu", category: "Animales", examples: [] },
  { spanish: "Rana", quechua_cusqueno: "K'ayra", category: "Animales", examples: [] },
  { spanish: "Pez", quechua_cusqueno: "Challwa", category: "Animales", examples: [] },
  { spanish: "Pájaro", quechua_cusqueno: "Pisqu", category: "Animales", examples: [] },
  { spanish: "Paloma", quechua_cusqueno: "Urpi", category: "Animales", examples: [] },
  { spanish: "Colibrí", quechua_cusqueno: "Q'inti", category: "Animales", examples: [] },
  { spanish: "Mosca", quechua_cusqueno: "Ch'uspi", category: "Animales", examples: [] },
  { spanish: "Araña", quechua_cusqueno: "Kuska", category: "Animales", examples: [] },
  { spanish: "Piojo", quechua_cusqueno: "Usa", category: "Animales", examples: [] },
  { spanish: "Pulga", quechua_cusqueno: "Piki", category: "Animales", examples: [] },
  { spanish: "Mariposa", quechua_cusqueno: "Pillpintu", category: "Animales", examples: [] },
  { spanish: "Ratón", quechua_cusqueno: "Huk'ucha", category: "Animales", examples: [] },
  { spanish: "Vizcacha", quechua_cusqueno: "Wisk'acha", category: "Animales", examples: [] },
  { spanish: "Zorrino", quechua_cusqueno: "Añas", category: "Animales", examples: [] },
  { spanish: "Jaguar", quechua_cusqueno: "Uturunku", category: "Animales", examples: [] },
  { spanish: "Murciélago", quechua_cusqueno: "Ch'iñi", category: "Animales", examples: [] },
  { spanish: "Grillo", quechua_cusqueno: "Ch'illik'u", category: "Animales", examples: [] },
  { spanish: "Hormiga", quechua_cusqueno: "Sik'imira", category: "Animales", examples: [] },

  // 5. Naturaleza (Pacha)
  { spanish: "Mundo, tiempo, tierra", quechua_cusqueno: "Pacha", category: "Naturaleza", examples: [] },
  { spanish: "Cielo, mundo de arriba", quechua_cusqueno: "Hanaq pacha", category: "Naturaleza", examples: [] },
  { spanish: "Este mundo, mundo de aquí", quechua_cusqueno: "Kay pacha", category: "Naturaleza", examples: [] },
  { spanish: "Mundo de abajo", quechua_cusqueno: "Ukhu pacha", category: "Naturaleza", examples: [] },
  { spanish: "Sol", quechua_cusqueno: "Inti", category: "Naturaleza", examples: [] },
  { spanish: "Luna", quechua_cusqueno: "Killa", category: "Naturaleza", examples: [] },
  { spanish: "Estrella", quechua_cusqueno: "Quyllur", category: "Naturaleza", examples: [] },
  { spanish: "Nube", quechua_cusqueno: "Phuyu", category: "Naturaleza", examples: [] },
  { spanish: "Lluvia", quechua_cusqueno: "Para", category: "Naturaleza", examples: [] },
  { spanish: "Viento", quechua_cusqueno: "Wayra", category: "Naturaleza", examples: [] },
  { spanish: "Trueno", quechua_cusqueno: "Q'aqcha", category: "Naturaleza", examples: [] },
  { spanish: "Rayo", quechua_cusqueno: "Illapa", category: "Naturaleza", examples: [] },
  { spanish: "Arcoíris", quechua_cusqueno: "K'uychi", category: "Naturaleza", examples: [] },
  { spanish: "Tierra, suelo", quechua_cusqueno: "Hallp'a", category: "Naturaleza", examples: [] },
  { spanish: "Agua", quechua_cusqueno: "Unu", category: "Naturaleza", examples: [] },
  { spanish: "Agua (término cuzqueño)", quechua_cusqueno: "Yaku", category: "Naturaleza", examples: [] },
  { spanish: "Fuego", quechua_cusqueno: "Nina", category: "Naturaleza", examples: [] },
  { spanish: "Piedra", quechua_cusqueno: "Rumi", category: "Naturaleza", examples: [] },
  { spanish: "Río", quechua_cusqueno: "Mayu", category: "Naturaleza", examples: [] },
  { spanish: "Montaña, cerro", quechua_cusqueno: "Urqu", category: "Naturaleza", examples: [] },
  { spanish: "Espíritu de la montaña", quechua_cusqueno: "Apu", category: "Naturaleza", examples: [] },
  { spanish: "Lago, laguna", quechua_cusqueno: "Qucha", category: "Naturaleza", examples: [] },
  { spanish: "Mar", quechua_cusqueno: "Mama qucha", category: "Naturaleza", examples: [] },
  { spanish: "Camino", quechua_cusqueno: "Ñan", category: "Naturaleza", examples: [] },
  { spanish: "Valle", quechua_cusqueno: "Qhichwa", category: "Naturaleza", examples: [] },
  { spanish: "Altiplano", quechua_cusqueno: "Puna", category: "Naturaleza", examples: [] },
  { spanish: "Abra, paso de montaña", quechua_cusqueno: "Q'asa", category: "Naturaleza", examples: [] },
  { spanish: "Nieve", quechua_cusqueno: "Riti", category: "Naturaleza", examples: [] },
  { spanish: "Hielo, helada", quechua_cusqueno: "Qhasa", category: "Naturaleza", examples: [] },
  { spanish: "Frío", quechua_cusqueno: "Chiri", category: "Naturaleza", examples: [] },
  { spanish: "Caliente", quechua_cusqueno: "Q'uñi", category: "Naturaleza", examples: [] },
  { spanish: "Día", quechua_cusqueno: "P'unchaw", category: "Naturaleza", examples: [] },
  { spanish: "Noche", quechua_cusqueno: "Tuta", category: "Naturaleza", examples: [] },
  { spanish: "Mañana (temprano)", quechua_cusqueno: "Tutamanta", category: "Naturaleza", examples: [] },
  { spanish: "Mediodía", quechua_cusqueno: "Chawpi p'unchaw", category: "Naturaleza", examples: [] },
  { spanish: "Atardecer", quechua_cusqueno: "Ch'isi", category: "Naturaleza", examples: [] },
  { spanish: "Amanecer", quechua_cusqueno: "Pakariy", category: "Naturaleza", examples: [] },
  { spanish: "Árbol", quechua_cusqueno: "Sach'a", category: "Naturaleza", examples: [] },
  { spanish: "Hoja", quechua_cusqueno: "Rap'i", category: "Naturaleza", examples: [] },
  { spanish: "Flor", quechua_cusqueno: "T'ika", category: "Naturaleza", examples: [] },
  { spanish: "Tronco, madera", quechua_cusqueno: "K'ullu", category: "Naturaleza", examples: [] },
  { spanish: "Bosque", quechua_cusqueno: "Sach'a-sach'a", category: "Naturaleza", examples: [] },
  { spanish: "Pasto", quechua_cusqueno: "Q'achu", category: "Naturaleza", examples: [] },
  { spanish: "Lodo, barro", quechua_cusqueno: "T'uru", category: "Naturaleza", examples: [] },
  { spanish: "Polvo", quechua_cusqueno: "Huk'uta", category: "Naturaleza", examples: [] },
  { spanish: "Luz", quechua_cusqueno: "K'anchay", category: "Naturaleza", examples: [] },
  { spanish: "Oscuridad", quechua_cusqueno: "Laqha", category: "Naturaleza", examples: [] },
  { spanish: "Manantial", quechua_cusqueno: "Pukyu", category: "Naturaleza", examples: [] },
  { spanish: "Cueva", quechua_cusqueno: "Mach'ay", category: "Naturaleza", examples: [] },
  { spanish: "Humo", quechua_cusqueno: "Q'usñi", category: "Naturaleza", examples: [] },
  { spanish: "Ceniza", quechua_cusqueno: "Uchpha", category: "Naturaleza", examples: [] },
  { spanish: "Raíz", quechua_cusqueno: "Saphin", category: "Naturaleza", examples: [] },
  { spanish: "Fruto", quechua_cusqueno: "Ruru", category: "Naturaleza", examples: [] },
  { spanish: "Cerro pequeño, colina", quechua_cusqueno: "Muqu", category: "Naturaleza", examples: [] },
  { spanish: "Quebrada", quechua_cusqueno: "Wayq'u", category: "Naturaleza", examples: [] },

  // 6. Comida y Bebida (Mikhuna)
  { spanish: "Comida", quechua_cusqueno: "Mikhuna", category: "Comida y Bebida", examples: [] },
  { spanish: "Bebida", quechua_cusqueno: "Ukyana", category: "Comida y Bebida", examples: [] },
  { spanish: "Maíz", quechua_cusqueno: "Sara", category: "Comida y Bebida", examples: [] },
  { spanish: "Papa", quechua_cusqueno: "Papa", category: "Comida y Bebida", examples: [] },
  { spanish: "Quinua", quechua_cusqueno: "Kinwa", category: "Comida y Bebida", examples: [] },
  { spanish: "Oca", quechua_cusqueno: "Uqa", category: "Comida y Bebida", examples: [] },
  { spanish: "Olluco", quechua_cusqueno: "Ulluku", category: "Comida y Bebida", examples: [] },
  { spanish: "Mashua", quechua_cusqueno: "Añu", category: "Comida y Bebida", examples: [] },
  { spanish: "Chuño", quechua_cusqueno: "Ch'uñu", category: "Comida y Bebida", examples: [] },
  { spanish: "Moraya", quechua_cusqueno: "Muraya", category: "Comida y Bebida", examples: [] },
  { spanish: "Habas", quechua_cusqueno: "Hawas", category: "Comida y Bebida", examples: [] },
  { spanish: "Frejol", quechua_cusqueno: "Purutu", category: "Comida y Bebida", examples: [] },
  { spanish: "Ají", quechua_cusqueno: "Uchu", category: "Comida y Bebida", examples: [] },
  { spanish: "Sal", quechua_cusqueno: "Kachi", category: "Comida y Bebida", examples: [] },
  { spanish: "Pan", quechua_cusqueno: "T'anta", category: "Comida y Bebida", examples: [] },
  { spanish: "Chicha", quechua_cusqueno: "Aqha", category: "Comida y Bebida", examples: [] },
  { spanish: "Queso", quechua_cusqueno: "Kisu", category: "Comida y Bebida", examples: [] },
  { spanish: "Huevo", quechua_cusqueno: "Runtu", category: "Comida y Bebida", examples: [] },
  { spanish: "Sopa", quechua_cusqueno: "Chupi", category: "Comida y Bebida", examples: [] },
  { spanish: "Sopa espesa", quechua_cusqueno: "Lawata", category: "Comida y Bebida", examples: [] },
  { spanish: "Nabo, hierba comestible", quechua_cusqueno: "Yuyu", category: "Comida y Bebida", examples: [] },
  { spanish: "Dulce", quechua_cusqueno: "Misk'i", category: "Comida y Bebida", examples: [] },
  { spanish: "Amargo", quechua_cusqueno: "P'asqu", category: "Comida y Bebida", examples: [] },
  { spanish: "Ácido, agrio", quechua_cusqueno: "P'uchqu", category: "Comida y Bebida", examples: [] },
  { spanish: "Picante", quechua_cusqueno: "Haya", category: "Comida y Bebida", examples: [] },
  { spanish: "Zapallo", quechua_cusqueno: "Sapallu", category: "Comida y Bebida", examples: [] },
  { spanish: "Harina", quechua_cusqueno: "Hak'u", category: "Comida y Bebida", examples: [] },
  { spanish: "Maíz tostado", quechua_cusqueno: "Kancha", category: "Comida y Bebida", examples: [] },
  { spanish: "Tostado", quechua_cusqueno: "Hank'a", category: "Comida y Bebida", examples: [] },
  { spanish: "Mote", quechua_cusqueno: "Mut'i", category: "Comida y Bebida", examples: [] },
  { spanish: "Charqui", quechua_cusqueno: "Ch'arki", category: "Comida y Bebida", examples: [] },
  { spanish: "Hervido, puchero", quechua_cusqueno: "Timp'u", category: "Comida y Bebida", examples: [] },
  { spanish: "Asado", quechua_cusqueno: "Kanka", category: "Comida y Bebida", examples: [] },
  { spanish: "Hambre", quechua_cusqueno: "Yarqhay", category: "Comida y Bebida", examples: [] },
  { spanish: "Sed", quechua_cusqueno: "Ch'akiy", category: "Comida y Bebida", examples: [] },
  { spanish: "Mazamorra (api)", quechua_cusqueno: "Api", category: "Comida y Bebida", examples: [] },
  { spanish: "Leche", quechua_cusqueno: "Lluqllu", category: "Comida y Bebida", examples: [] },
  { spanish: "Grasa, manteca", quechua_cusqueno: "Wira", category: "Comida y Bebida", examples: [] },
  { spanish: "Miel (dulce)", quechua_cusqueno: "Misk'i", category: "Comida y Bebida", examples: [] },
  { spanish: "Fiambre (comida para viaje)", quechua_cusqueno: "Kukawu", category: "Comida y Bebida", examples: [] },

  // 7. Hogar y Objetos (Wasi)
  { spanish: "Casa", quechua_cusqueno: "Wasi", category: "Hogar y Objetos", examples: [] },
  { spanish: "Puerta", quechua_cusqueno: "Punku", category: "Hogar y Objetos", examples: [] },
  { spanish: "Ventana", quechua_cusqueno: "T'uqu", category: "Hogar y Objetos", examples: [] },
  { spanish: "Techo", quechua_cusqueno: "Wasi qata", category: "Hogar y Objetos", examples: [] },
  { spanish: "Pared", quechua_cusqueno: "Pirqa", category: "Hogar y Objetos", examples: [] },
  { spanish: "Piso, suelo", quechua_cusqueno: "Pampa", category: "Hogar y Objetos", examples: [] },
  { spanish: "Cama", quechua_cusqueno: "Puñuna", category: "Hogar y Objetos", examples: [] },
  { spanish: "Silla, asiento", quechua_cusqueno: "Tiyana", category: "Hogar y Objetos", examples: [] },
  { spanish: "Mesa", quechua_cusqueno: "Misa", category: "Hogar y Objetos", examples: [] },
  { spanish: "Manta (pequeña de mujer)", quechua_cusqueno: "Lliklla", category: "Hogar y Objetos", examples: [] },
  { spanish: "Frazada", quechua_cusqueno: "Q'ata", category: "Hogar y Objetos", examples: [] },
  { spanish: "Ropa", quechua_cusqueno: "P'acha", category: "Hogar y Objetos", examples: [] },
  { spanish: "Gorro", quechua_cusqueno: "Ch'ullu", category: "Hogar y Objetos", examples: [] },
  { spanish: "Sombrero", quechua_cusqueno: "Muntira", category: "Hogar y Objetos", examples: [] },
  { spanish: "Poncho", quechua_cusqueno: "Punchu", category: "Hogar y Objetos", examples: [] },
  { spanish: "Pollera, falda", quechua_cusqueno: "Pullira", category: "Hogar y Objetos", examples: [] },
  { spanish: "Honda", quechua_cusqueno: "Waraka", category: "Hogar y Objetos", examples: [] },
  { spanish: "Sandalia", quechua_cusqueno: "Huk'uta", category: "Hogar y Objetos", examples: [] },
  { spanish: "Faja", quechua_cusqueno: "Chumpi", category: "Hogar y Objetos", examples: [] },
  { spanish: "Olla", quechua_cusqueno: "Manka", category: "Hogar y Objetos", examples: [] },
  { spanish: "Plato", quechua_cusqueno: "P'uku", category: "Hogar y Objetos", examples: [] },
  { spanish: "Cuchara", quechua_cusqueno: "Wislla", category: "Hogar y Objetos", examples: [] },
  { spanish: "Cuchillo", quechua_cusqueno: "Kuchuna", category: "Hogar y Objetos", examples: [] },
  { spanish: "Fogón", quechua_cusqueno: "Q'uncha", category: "Hogar y Objetos", examples: [] },
  { spanish: "Leña", quechua_cusqueno: "Llant'a", category: "Hogar y Objetos", examples: [] },
  { spanish: "Soga", quechua_cusqueno: "Was'kha", category: "Hogar y Objetos", examples: [] },
  { spanish: "Hilo", quechua_cusqueno: "Q'aytu", category: "Hogar y Objetos", examples: [] },
  { spanish: "Batán (piedra de moler)", quechua_cusqueno: "Maray", category: "Hogar y Objetos", examples: [] },
  { spanish: "Mano del batán", quechua_cusqueno: "Tunawa", category: "Hogar y Objetos", examples: [] },
  { spanish: "Escritura, carta", quechua_cusqueno: "Qillqa", category: "Hogar y Objetos", examples: [] },
  { spanish: "Libro, hoja", quechua_cusqueno: "P'anqa", category: "Hogar y Objetos", examples: [] },
  { spanish: "Dinero, plata", quechua_cusqueno: "Qullqi", category: "Hogar y Objetos", examples: [] },
  { spanish: "Oro", quechua_cusqueno: "Quri", category: "Hogar y Objetos", examples: [] },
  { spanish: "Herramienta", quechua_cusqueno: "Llamk'ana", category: "Hogar y Objetos", examples: [] },
  { spanish: "Chacra, campo de cultivo", quechua_cusqueno: "Chakra", category: "Hogar y Objetos", examples: [] },
  { spanish: "Corral, patio", quechua_cusqueno: "Kancha", category: "Hogar y Objetos", examples: [] },
  { spanish: "Mercado", quechua_cusqueno: "Qhatu", category: "Hogar y Objetos", examples: [] },
  { spanish: "Mortero", quechua_cusqueno: "Mut'ka", category: "Hogar y Objetos", examples: [] },
  { spanish: "Aguja", quechua_cusqueno: "Yawri", category: "Hogar y Objetos", examples: [] },
  { spanish: "Tambor", quechua_cusqueno: "Wankar", category: "Hogar y Objetos", examples: [] },
  { spanish: "Quena (flauta)", quechua_cusqueno: "Qina", category: "Hogar y Objetos", examples: [] },
  { spanish: "Zampoña", quechua_cusqueno: "Antara", category: "Hogar y Objetos", examples: [] },
  { spanish: "Trompeta de concha", quechua_cusqueno: "Pututu", category: "Hogar y Objetos", examples: [] },

  // 8. Verbos Comunes (Ruwaykuna)
  { spanish: "Ser, estar, haber", quechua_cusqueno: "Kay", category: "Verbos Comunes", examples: [] },
  { spanish: "Comer", quechua_cusqueno: "Mikhuy", category: "Verbos Comunes", examples: [] },
  { spanish: "Beber", quechua_cusqueno: "Ukyay", category: "Verbos Comunes", examples: [] },
  { spanish: "Ir", quechua_cusqueno: "Riy", category: "Verbos Comunes", examples: [] },
  { spanish: "Venir", quechua_cusqueno: "Hamuy", category: "Verbos Comunes", examples: [] },
  { spanish: "Dormir", quechua_cusqueno: "Puñuy", category: "Verbos Comunes", examples: [] },
  { spanish: "Querer, amar", quechua_cusqueno: "Munay", category: "Verbos Comunes", examples: [] },
  { spanish: "Amar (con ternura)", quechua_cusqueno: "Kuyay", category: "Verbos Comunes", examples: [] },
  { spanish: "Hacer", quechua_cusqueno: "Ruway", category: "Verbos Comunes", examples: [] },
  { spanish: "Decir", quechua_cusqueno: "Niy", category: "Verbos Comunes", examples: [] },
  { spanish: "Ver, mirar", quechua_cusqueno: "Qhaway", category: "Verbos Comunes", examples: [] },
  { spanish: "Oír, escuchar", quechua_cusqueno: "Uyay", category: "Verbos Comunes", examples: [] },
  { spanish: "Hablar", quechua_cusqueno: "Rimay", category: "Verbos Comunes", examples: [] },
  { spanish: "Saber, poder", quechua_cusqueno: "Yachay", category: "Verbos Comunes", examples: [] },
  { spanish: "Trabajar", quechua_cusqueno: "Llamk'ay", category: "Verbos Comunes", examples: [] },
  { spanish: "Jugar", quechua_cusqueno: "Pukllay", category: "Verbos Comunes", examples: [] },
  { spanish: "Caminar, viajar", quechua_cusqueno: "Puriy", category: "Verbos Comunes", examples: [] },
  { spanish: "Correr, volar", quechua_cusqueno: "Phaway", category: "Verbos Comunes", examples: [] },
  { spanish: "Dar", quechua_cusqueno: "Quy", category: "Verbos Comunes", examples: [] },
  { spanish: "Agarrar, tomar", quechua_cusqueno: "Hap'iy", category: "Verbos Comunes", examples: [] },
  { spanish: "Traer", quechua_cusqueno: "Apamuy", category: "Verbos Comunes", examples: [] },
  { spanish: "Llevar", quechua_cusqueno: "Apay", category: "Verbos Comunes", examples: [] },
  { spanish: "Vivir", quechua_cusqueno: "Kawsay", category: "Verbos Comunes", examples: [] },
  { spanish: "Morir", quechua_cusqueno: "Wañuy", category: "Verbos Comunes", examples: [] },
  { spanish: "Nacer", quechua_cusqueno: "Paqariy", category: "Verbos Comunes", examples: [] },
  { spanish: "Llorar", quechua_cusqueno: "Waqay", category: "Verbos Comunes", examples: [] },
  { spanish: "Reír", quechua_cusqueno: "Asiy", category: "Verbos Comunes", examples: [] },
  { spanish: "Cantar", quechua_cusqueno: "Takiy", category: "Verbos Comunes", examples: [] },
  { spanish: "Bailar", quechua_cusqueno: "Tusuy", category: "Verbos Comunes", examples: [] },
  { spanish: "Sentarse, vivir (en un lugar)", quechua_cusqueno: "Tiyay", category: "Verbos Comunes", examples: [] },
  { spanish: "Pararse", quechua_cusqueno: "Sayay", category: "Verbos Comunes", examples: [] },
  { spanish: "Escribir", quechua_cusqueno: "Qillqay", category: "Verbos Comunes", examples: [] },
  { spanish: "Leer", quechua_cusqueno: "Ñawinchay", category: "Verbos Comunes", examples: [] },
  { spanish: "Lavar (ropa)", quechua_cusqueno: "T'aqsay", category: "Verbos Comunes", examples: [] },
  { spanish: "Lavar (cuerpo, platos)", quechua_cusqueno: "Maqlliy", category: "Verbos Comunes", examples: [] },
  { spanish: "Limpiar, barrer", quechua_cusqueno: "Pichay", category: "Verbos Comunes", examples: [] },

  // 9. Adjetivos, Adverbios y Cualidades (ejemplos seleccionados)
  { spanish: "Grande", quechua_cusqueno: "Hatun", category: "Adjetivos y Cualidades", examples: [] },
  { spanish: "Pequeño", quechua_cusqueno: "Huch'uy", category: "Adjetivos y Cualidades", examples: [] },
  { spanish: "Bueno, bien", quechua_cusqueno: "Allin", category: "Adjetivos y Cualidades", examples: [] },
  { spanish: "Malo, mal", quechua_cusqueno: "Mana allin", category: "Adjetivos y Cualidades", examples: [] },
  { spanish: "Bonito", quechua_cusqueno: "K'acha", category: "Adjetivos y Cualidades", examples: [] },
  { spanish: "Feo", quechua_cusqueno: "Millay", category: "Adjetivos y Cualidades", examples: [] },
  { spanish: "Nuevo", quechua_cusqueno: "Musuq", category: "Adjetivos y Cualidades", examples: [] },
  { spanish: "Viejo (cosa)", quechua_cusqueno: "Mawka", category: "Adjetivos y Cualidades", examples: [] },
  { spanish: "Limpio, claro", quechua_cusqueno: "Ch'uya", category: "Adjetivos y Cualidades", examples: [] },
  { spanish: "Sucio", quechua_cusqueno: "Qhilli", category: "Adjetivos y Cualidades", examples: [] },

  // 10. Colores (ejemplos seleccionados)
  { spanish: "Color", quechua_cusqueno: "Llimp'i", category: "Colores", examples: [] },
  { spanish: "Negro", quechua_cusqueno: "Yana", category: "Colores", examples: [] },
  { spanish: "Blanco", quechua_cusqueno: "Yuraq", category: "Colores", examples: [] },
  { spanish: "Rojo", quechua_cusqueno: "Puka", category: "Colores", examples: [] },
  { spanish: "Verde", quechua_cusqueno: "Q'umir", category: "Colores", examples: [] },
  { spanish: "Azul", quechua_cusqueno: "Anqas", category: "Colores", examples: [] },
  { spanish: "Amarillo", quechua_cusqueno: "Q'illu", category: "Colores", examples: [] },
  { spanish: "Marrón, café", quechua_cusqueno: "Ch'umpi", category: "Colores", examples: [] },
  { spanish: "Gris, plomo", quechua_cusqueno: "Uqi", category: "Colores", examples: [] },

  // 11. Números (ejemplos seleccionados)
  { spanish: "Uno", quechua_cusqueno: "Huk", category: "Números", examples: [] },
  { spanish: "Dos", quechua_cusqueno: "Iskay", category: "Números", examples: [] },
  { spanish: "Tres", quechua_cusqueno: "Kinsa", category: "Números", examples: [] },
  { spanish: "Cuatro", quechua_cusqueno: "Tawa", category: "Números", examples: [] },
  { spanish: "Cinco", quechua_cusqueno: "Pichqa", category: "Números", examples: [] },
  { spanish: "Diez", quechua_cusqueno: "Chunka", category: "Números", examples: [] },
  { spanish: "Cien", quechua_cusqueno: "Pachaq", category: "Números", examples: [] },
  { spanish: "Mil", quechua_cusqueno: "Waranqa", category: "Números", examples: [] },

  // 12. Conceptos y Sentimientos (selección)
  { spanish: "Amor, querer, belleza", quechua_cusqueno: "Munay", category: "Conceptos y Sentimientos", examples: [] },
  { spanish: "Alegría", quechua_cusqueno: "Kusiy", category: "Conceptos y Sentimientos", examples: [] },
  { spanish: "Fuerza", quechua_cusqueno: "Kallpa", category: "Conceptos y Sentimientos", examples: [] },
  { spanish: "Madre Tierra", quechua_cusqueno: "Pacha mama", category: "Conceptos y Sentimientos", examples: [] },

  // 13. Partículas / Sufijos (ejemplos)
  { spanish: "Sufijo -y (posesivo mi)", quechua_cusqueno: "-y", category: "Partículas (Sufijos)", examples: [] },
  { spanish: "Sufijo -yki (posesivo tu)", quechua_cusqueno: "-yki", category: "Partículas (Sufijos)", examples: [] },
  { spanish: "Sufijo -n (posesivo su)", quechua_cusqueno: "-n", category: "Partículas (Sufijos)", examples: [] },
  { spanish: "Sufijo -kuna (plural)", quechua_cusqueno: "-kuna", category: "Partículas (Sufijos)", examples: [] }
];

// ----------------------
// 2) Si existe JSON en data/ lo usamos para override
// ----------------------
function loadDataFile() {
  const filePath = path.join(process.cwd(), 'data', 'quechua_seed.json');
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed) ? parsed : []);
  } catch (err) {
    console.warn('Warning: no se pudo leer/parsing data/quechua_seed.json:', err.message);
    return null;
  }
}

function normalizeSpanish(s) {
  if (!s) return '';
  return String(s).trim().toLowerCase();
}

function normalizeQuechua(s) {
  if (!s) return '';
  return String(s).trim();
}

function extractQuechuaValue(it) {
  const keys = [
    'quechua_cusqueno',
    'quechuaCusqueno',
    'quechua',
    'quechua_cuzqueno',
    'quetchua',
    'quenchua',
    'quchua',
    'qu'
  ];
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(it, k) && it[k] != null && String(it[k]).trim() !== '') {
      return normalizeQuechua(it[k]);
    }
  }
  // fallback: if item uses 'term' as the quechua word (some content arrays)
  if (it.term && typeof it.term === 'string') return normalizeQuechua(it.term);
  // last resort: first non-empty string property
  for (const v of Object.values(it)) {
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return '';
}

async function seedQuechua() {
  try {
    // Warn if the mongoUri clearly contains a placeholder host
    if (/host/i.test(mongoUri) || /USER:PASS|USER:PASS@HOST/i.test(mongoUri)) {
      console.warn('⚠️  Atención: MONGO_URI parece contener un placeholder (USER/PASS/HOST). Pasa --mongo o ajusta .env para usar tu URI real.');
    }
    console.log('🔍 mongoUri (usado por el seeder):', mongoUri);

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('🔌 Conectado a MongoDB para seeder Quechua');

    const fileItems = loadDataFile();
    const rawItems = fileItems && fileItems.length ? fileItems : itemsInline;

    if (!rawItems || rawItems.length === 0) {
      console.log('⚠️  No hay elementos para sembrar.');
      await mongoose.disconnect();
      return [];
    }

    // Deduplica por spanish normalizado (última ocurrencia gana)
    const map = new Map();
    for (const it of rawItems) {
      const spanishKey = normalizeSpanish(it.spanish || it.term || it.word);
      if (!spanishKey) continue;
      map.set(spanishKey, it);
    }

    const ops = [];
    for (const [spanish, it] of map.entries()) {
      const quechuaVal = extractQuechuaValue(it);
      if (!quechuaVal) continue; // saltar si no hay valor quechua
      const examples = Array.isArray(it.examples) ? it.examples : (it.examples ? [String(it.examples)] : []);
      ops.push({
        updateOne: {
          filter: { spanish },
          update: {
            $set: {
              spanish,
              quechua_cusqueno: quechuaVal,
              context: it.context || it.description || '',
              category: it.category || '',
              examples,
              updatedAt: new Date()
            },
            $setOnInsert: { createdAt: new Date() }
          },
          upsert: true
        }
      });
    }

    if (ops.length === 0) {
      console.log('⚠️  No se generaron operaciones válidas a partir de los datos.');
      await mongoose.disconnect();
      return [];
    }

    console.log(`Preparadas ${ops.length} operaciones bulk (dryRun=${dryRun})`);

    if (dryRun) {
      console.log('Dry run — no se ejecuta bulkWrite. Ejemplo de operación:', JSON.stringify(ops[0], null, 2));
      await mongoose.disconnect();
      return ops;
    }

    // Ejecutar en chunks para evitar memoria / límites
    const chunkSize = 1000;
    let totalUpserted = 0;
    for (let i = 0; i < ops.length; i += chunkSize) {
      const chunk = ops.slice(i, i + chunkSize);
      const res = await Quechua.bulkWrite(chunk, { ordered: false });
      const upserted = res.upsertedCount || res.nUpserted || (res.upserted && res.upserted.length) || 0;
      totalUpserted += upserted;
      console.log(`Chunk ${Math.floor(i / chunkSize) + 1} ejecutado. Upserted en chunk: ${upserted}`);
    }

    console.log(`✅ Seeder completado. Upserted (estimado): ${totalUpserted}`);
    await mongoose.disconnect();
    return { upserted: totalUpserted, attempted: ops.length };
  } catch (err) {
    console.error('❌ Error en quechuaSeeder:', err && err.message ? err.message : err);
    try { await mongoose.disconnect(); } catch (_) {}
    throw err;
  }
}

if (require.main === module) {
  seedQuechua().catch(() => process.exit(1));
}

module.exports = seedQuechua;