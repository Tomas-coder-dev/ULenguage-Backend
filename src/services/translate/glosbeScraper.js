const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes Glosbe for translations between any supported language pair.
 * Returns an array of unique dictionary translations (not algorithmic/synonyms).
 */
async function scrapeGlosbe(from, to, text) {
  const url = `https://glosbe.com/${from}/${to}/${encodeURIComponent(text)}`;
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const results = [];

    // Encuentra solo los términos principales del diccionario
    $('.dict-entry__header__word').each((i, el) => {
      const word = $(el).text().trim();
      if (word && !results.includes(word)) results.push(word);
    });

    // Si no hay nada, busca alternativas menos frecuentes
    if (results.length === 0) {
      $('.dict-entry__header__word--uncommon').each((i, el) => {
        const word = $(el).text().trim();
        if (word && !results.includes(word)) results.push(word);
      });
    }

    // Si sigue vacío, busca traducciones generadas algorítmicamente
    if (results.length === 0) {
      $('.dict-algo__translation').each((i, el) => {
        const word = $(el).text().trim();
        if (word && !results.includes(word)) results.push(word);
      });
    }

    // Fallback: busca en spans con la clase .translation
    if (results.length === 0) {
      $('.translation').each((i, el) => {
        const word = $(el).text().trim();
        if (word && !results.includes(word)) results.push(word);
      });
    }

    // Devuelve todas las traducciones principales o solo la primera
    return results;
  } catch (err) {
    console.error('Error scraping Glosbe:', err.message);
    return [];
  }
}

module.exports = { scrapeGlosbe };