const express = require('express');
const path = require('node:path');
const db = require('./db');
const {
  hashPassword,
  passwordMatches,
  startSession,
  endSession,
  readCookies,
  attachSessionCookie,
  clearSessionCookie,
  requireAuth,
  COOKIE_NAME,
} = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(email, password) {
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    return 'Enter a valid email address.';
  }
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  return null;
}

function serializeTask(row) {
  return {
    id: row.id,
    title: row.title,
    done: !!row.is_done,
    createdAt: row.created_at,
  };
}

// --- Auth ---

app.post('/api/auth/signup', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const { password } = req.body;

  const validationError = validateCredentials(email, password);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'That email is already registered.' });
  }

  const { salt, hash } = hashPassword(password);
  const result = db
    .prepare('INSERT INTO users (email, password_hash, password_salt) VALUES (?, ?, ?)')
    .run(email, hash, salt);

  const token = startSession(result.lastInsertRowid);
  attachSessionCookie(res, token);
  res.status(201).json({ email });
});

app.post('/api/auth/login', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const { password } = req.body;

  const validationError = validateCredentials(email, password);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !passwordMatches(password, user.password_salt, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const token = startSession(user.id);
  attachSessionCookie(res, token);
  res.json({ email: user.email });
});

app.post('/api/auth/logout', (req, res) => {
  const token = readCookies(req)[COOKIE_NAME];
  if (token) endSession(token);
  clearSessionCookie(res);
  res.status(204).end();
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId);
  if (!user) {
    return res.status(401).json({ error: 'Session is no longer valid.' });
  }
  res.json({ email: user.email });
});

// --- Tasks (always scoped to req.userId) ---

app.get('/api/tasks', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(req.userId);
  res.json(rows.map(serializeTask));
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  if (!title) {
    return res.status(400).json({ error: 'A task needs a title.' });
  }
  const result = db
    .prepare('INSERT INTO tasks (user_id, title) VALUES (?, ?)')
    .run(req.userId, title);
  const created = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(serializeTask(created));
});

app.patch('/api/tasks/:id', requireAuth, (req, res) => {
  const existing = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const title =
    typeof req.body.title === 'string' && req.body.title.trim() ? req.body.title.trim() : existing.title;
  const isDone = typeof req.body.done === 'boolean' ? (req.body.done ? 1 : 0) : existing.is_done;

  db.prepare('UPDATE tasks SET title = ?, is_done = ? WHERE id = ?').run(title, isDone, existing.id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(existing.id);
  res.json(serializeTask(updated));
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const result = db
    .prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.userId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Task not found.' });
  }
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`To-do app listening on http://localhost:${PORT}`);
});
