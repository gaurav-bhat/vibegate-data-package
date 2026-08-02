const fs = require('node:fs/promises');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'signups.json');

let writeChain = Promise.resolve();

async function readAll() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function withWriteLock(fn) {
  writeChain = writeChain.then(fn, fn);
  return writeChain;
}

async function addSignup(email) {
  return withWriteLock(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const signups = await readAll();

    if (signups.some((s) => s.email === email)) {
      return { created: false };
    }

    signups.push({ email, createdAt: new Date().toISOString() });

    const tmpFile = `${DATA_FILE}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(signups, null, 2));
    await fs.rename(tmpFile, DATA_FILE);

    return { created: true };
  });
}

async function listSignups() {
  const signups = await readAll();
  return [...signups].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

module.exports = { addSignup, listSignups };
