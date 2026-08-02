# Product Admin Dashboard

Admin dashboard for managing products (name, price, description) with add, edit,
and delete, backed by a SQLite database. Editing happens inline in the table.

## Requirements

- Node.js v22.5+ (uses the built-in `node:sqlite` module — no native build step)

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
