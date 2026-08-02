# To-Do List

A to-do list app with email/password sign up and log in. Each user only sees
their own tasks. Backed by SQLite.

## Requirements

- Node.js v22.5+ (uses the built-in `node:sqlite` and `node:crypto` modules)

## Run

```bash
npm install
npm start
```

Then open http://localhost:3000

## How it works

- Passwords are hashed with `scrypt` (built into Node's `crypto` module) and
  never stored in plain text.
- Logging in sets an `HttpOnly` session cookie; the session token maps to a
  user id in an in-memory store on the server.
- Every task route requires a valid session and scopes all reads/writes to
  `req.userId`, so users can never see or modify another user's tasks.

## API

- `POST /api/signup` — create an account (`{ email, password }`)
- `POST /api/login` — log in (`{ email, password }`)
- `POST /api/logout` — log out
- `GET /api/me` — current logged-in user
- `GET /api/tasks` — list the current user's tasks
- `POST /api/tasks` — create a task (`{ title }`)
- `PUT /api/tasks/:id` — update a task (`{ title?, done? }`)
- `DELETE /api/tasks/:id` — delete a task
