const fs = require('fs');
const path = require('path');

function loadWordList(filename) {
  return fs.readFileSync(path.join(__dirname, '../../wordlist', filename), 'utf8')
    .split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(Boolean);
}

const QUECHUA_WORDS = loadWordList('quechua_words.txt');
const ENGLISH_WORDS = loadWordList('english_words.txt');

module.exports = { QUECHUA_WORDS, ENGLISH_WORDS };