const express = require('express');
const path = require('node:path');
const db = require('./db');
const {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  SESSION_COOKIE,
} = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(body) {
  const { email, password } = body;
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return 'A valid email is required.';
  }
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  return null;
}

// --- Auth routes ---

app.post('/api/signup', (req, res) => {
  const error = validateCredentials(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const { salt, hash } = hashPassword(password);
  const result = db
    .prepare('INSERT INTO users (email, password_hash, salt) VALUES (?, ?, ?)')
    .run(email, hash, salt);

  const token = createSession(result.lastInsertRowid);
  setSessionCookie(res, token);
  res.status(201).json({ email });
});

app.post('/api/login', (req, res) => {
  const error = validateCredentials(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(password, user.salt, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = createSession(user.id);
  setSessionCookie(res, token);
  res.json({ email: user.email });
});

app.post('/api/logout', (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (token) {
    destroySession(token);
  }
  clearSessionCookie(res);
  res.status(204).end();
});

app.get('/api/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  res.json({ email: user.email });
});

// --- Task routes (all scoped to the logged-in user) ---

app.get('/api/tasks', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC')
    .all(req.userId);
  res.json(rows);
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const { title } = req.body;
  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  const result = db
    .prepare('INSERT INTO tasks (user_id, title) VALUES (?, ?)')
    .run(req.userId, title.trim());
  const created = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

app.put('/api/tasks/:id', requireAuth, (req, res) => {
  const existing = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const title = typeof req.body.title === 'string' ? req.body.title.trim() : existing.title;
  const done =
    typeof req.body.done === 'boolean' ? (req.body.done ? 1 : 0) : existing.done;

  if (title.length === 0) {
    return res.status(400).json({ error: 'Title cannot be empty.' });
  }

  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(title, done, existing.id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(existing.id);
  res.json(updated);
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
  console.log(`To-do app running at http://localhost:${PORT}`);
});
