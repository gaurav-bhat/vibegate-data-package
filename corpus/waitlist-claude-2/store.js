const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'signups.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
}

function readAll() {
  ensureStore();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(signups) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(signups, null, 2));
}

function addSignup(email) {
  const signups = readAll();
  const normalized = email.trim().toLowerCase();
  if (signups.some((s) => s.email === normalized)) {
    return { added: false, reason: 'duplicate' };
  }
  signups.push({ email: normalized, createdAt: new Date().toISOString() });
  writeAll(signups);
  return { added: true };
}

function getSignups() {
  return readAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = { addSignup, getSignups };
