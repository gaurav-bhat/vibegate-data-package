# FlowNote Waitlist

A landing page for FlowNote with a hero section, a features section, and an
email waitlist form. Signups are stored in a SQLite database.

## Requirements

- Node.js v22.5+ (uses the built-in `node:sqlite` module)

## Run

```bash
npm install
npm start
```

Then open http://localhost:3000

## Viewing signups

The list of signups is available at `/admin`, protected with HTTP Basic Auth
(username `admin`). Set an `ADMIN_PASSWORD` environment variable before
starting the server to enable it:

```bash
ADMIN_PASSWORD=your-password npm start
```

Until `ADMIN_PASSWORD` is set, `/admin` and `/api/admin/signups` return a 503
instead of exposing signup emails.

## API

- `POST /api/waitlist` — join the waitlist (`{ email }`)
- `GET /api/admin/signups` — list signups (requires Basic Auth)
- `GET /admin` — view signups in a browser (requires Basic Auth)
