const express = require('express');
const path = require('node:path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function validateProduct(body) {
  const { name, price, description } = body;
  if (typeof name !== 'string' || name.trim().length === 0) {
    return 'Name is required.';
  }
  if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
    return 'Price must be a non-negative number.';
  }
  if (description !== undefined && typeof description !== 'string') {
    return 'Description must be a string.';
  }
  return null;
}

// List all products
app.get('/api/products', (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
  res.json(rows);
});

// Get a single product
app.get('/api/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json(row);
});

// Create a product
app.post('/api/products', (req, res) => {
  const error = validateProduct(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  const { name, price, description = '' } = req.body;
  const result = db
    .prepare('INSERT INTO products (name, price, description) VALUES (?, ?, ?)')
    .run(name.trim(), price, description);
  const created = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// Update a product
app.put('/api/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const error = validateProduct(req.body);
  if (error) {
    return res.status(400).json({ error });
  }
  const { name, price, description = '' } = req.body;
  db
    .prepare('UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?')
    .run(name.trim(), price, description, req.params.id);
  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete a product
app.delete('/api/products/:id', (req, res) => {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Product admin dashboard running at http://localhost:${PORT}`);
});
