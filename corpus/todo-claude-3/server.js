const express = require('express');
const path = require('node:path');
const db = require('./db');
const {
  hashPassword,
  passwordMatches,
  issueSession,
  revokeSession,
  readCookies,
  attachSessionCookie,
  expireSessionCookie,
  requireAuth,
  COOKIE_NAME,
} = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkCredentials({ email, password }) {
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return 'Enter a valid email address.';
  }
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password needs at least 8 characters.';
  }
  return null;
}

// --- Account ---

app.post('/api/auth/signup', (req, res) => {
  const problem = checkCredentials(req.body || {});
  if (problem) return res.status(400).json({ error: problem });

  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'That email is already registered.' });
  }

  const { salt, hash } = hashPassword(password);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (email, password_hash, password_salt) VALUES (?, ?, ?)')
    .run(email, hash, salt);

  attachSessionCookie(res, issueSession(lastInsertRowid));
  res.status(201).json({ email });
});

app.post('/api/auth/login', (req, res) => {
  const problem = checkCredentials(req.body || {});
  if (problem) return res.status(400).json({ error: problem });

  const email = req.body.email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !passwordMatches(req.body.password, user.password_salt, user.password_hash)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }

  attachSessionCookie(res, issueSession(user.id));
  res.json({ email: user.email });
});

app.post('/api/auth/logout', (req, res) => {
  const token = readCookies(req)[COOKIE_NAME];
  if (token) revokeSession(token);
  expireSessionCookie(res);
  res.status(204).end();
});

app.get('/api/auth/session', requireAuth, (req, res) => {
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(401).json({ error: 'Please log in to continue.' });
  res.json({ email: user.email });
});

// --- Tasks (always scoped to req.userId) ---

app.get('/api/tasks', requireAuth, (req, res) => {
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE owner_id = ? ORDER BY created_at DESC, id DESC')
    .all(req.userId);
  res.json(tasks);
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const label = typeof req.body.label === 'string' ? req.body.label.trim() : '';
  if (!label) return res.status(400).json({ error: 'A task needs some text.' });

  const { lastInsertRowid } = db
    .prepare('INSERT INTO tasks (owner_id, label) VALUES (?, ?)')
    .run(req.userId, label);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(lastInsertRowid);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', requireAuth, (req, res) => {
  const task = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND owner_id = ?')
    .get(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  const label = typeof req.body.label === 'string' ? req.body.label.trim() : task.label;
  const completed =
    typeof req.body.completed === 'boolean' ? (req.body.completed ? 1 : 0) : task.completed;

  if (!label) return res.status(400).json({ error: 'A task needs some text.' });

  db.prepare('UPDATE tasks SET label = ?, completed = ? WHERE id = ?').run(
    label,
    completed,
    task.id
  );
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const { changes } = db
    .prepare('DELETE FROM tasks WHERE id = ? AND owner_id = ?')
    .run(req.params.id, req.userId);
  if (changes === 0) return res.status(404).json({ error: 'Task not found.' });
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`);
});
