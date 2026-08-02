# Product Admin Dashboard

A simple admin dashboard for managing products (name, price, description) backed by a SQLite database.

## Requirements

- Node.js v22.5+ (uses the built-in `node:sqlite` module)

## Run

```bash
npm install
npm start
```

Then open http://localhost:3000

## API

- `GET /api/products` — list products
- `GET /api/products/:id` — get one product
- `POST /api/products` — create a product (`{ name, price, description }`)
- `PUT /api/products/:id` — update a product
- `DELETE /api/products/:id` — delete a product
