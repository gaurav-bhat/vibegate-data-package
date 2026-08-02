const fs = require('node:fs');
const path = require('node:path');

const dataFile = path.join(__dirname, '..', 'data', 'images.json');

function readAll() {
  if (!fs.existsSync(dataFile)) return [];
  const raw = fs.readFileSync(dataFile, 'utf8').trim();
  return raw ? JSON.parse(raw) : [];
}

function add(entry) {
  const images = readAll();
  images.unshift(entry);
  fs.writeFileSync(dataFile, JSON.stringify(images, null, 2));
  return entry;
}

module.exports = { readAll, add };
