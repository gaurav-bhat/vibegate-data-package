const express = require('express');
const path = require('node:path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const selectAll = db.prepare('SELECT * FROM products ORDER BY id DESC');
const selectOne = db.prepare('SELECT * FROM products WHERE id = ?');
const insertOne = db.prepare(
  'INSERT INTO products (name, price, description) VALUES (?, ?, ?)'
);
const updateOne = db.prepare(
  'UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?'
);
const deleteOne = db.prepare('DELETE FROM products WHERE id = ?');

function validateProduct(body = {}) {
  const errors = [];

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) errors.push('Name is required.');
  if (name.length > 200) errors.push('Name must be 200 characters or fewer.');

  const price = typeof body.price === 'string' ? Number(body.price) : body.price;
  if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
    errors.push('Price must be a non-negative number.');
  }

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (description.length > 2000) errors.push('Description must be 2000 characters or fewer.');

  return { errors, value: { name, price, description } };
}

function parseId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid product id.' });
  }
  req.productId = id;
  next();
}

app.get('/api/products', (req, res) => {
  res.json(selectAll.all());
});

app.get('/api/products/:id', parseId, (req, res) => {
  const product = selectOne.get(req.productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json(product);
});

app.post('/api/products', (req, res) => {
  const { errors, value } = validateProduct(req.body);
  if (errors.length) {
    return res.status(400).json({ error: errors.join(' ') });
  }
  const result = insertOne.run(value.name, value.price, value.description);
  res.status(201).json(selectOne.get(result.lastInsertRowid));
});

app.put('/api/products/:id', parseId, (req, res) => {
  const existing = selectOne.get(req.productId);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const { errors, value } = validateProduct(req.body);
  if (errors.length) {
    return res.status(400).json({ error: errors.join(' ') });
  }
  updateOne.run(value.name, value.price, value.description, req.productId);
  res.json(selectOne.get(req.productId));
});

app.delete('/api/products/:id', parseId, (req, res) => {
  const result = deleteOne.run(req.productId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Product admin dashboard running at http://localhost:${PORT}`);
});
