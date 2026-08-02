# FlowNote waitlist

Landing page for FlowNote with a hero section, a features section, and an
email waitlist signup form. Signups are stored in `data/signups.json`.

## Setup

```
npm install
cp .env.example .env   # optional: only needed to enable /admin
npm start
```

The site is served at http://localhost:3000.

## Viewing signups

Signups are visible at `/admin`, protected by HTTP Basic Auth. Set
`ADMIN_USER` and `ADMIN_PASSWORD` in `.env` to enable it — until then,
`/admin` and `/api/admin/signups` respond `503` instead of exposing emails.
