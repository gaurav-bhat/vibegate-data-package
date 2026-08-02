# Chatbot

A minimal chat app that sends messages to the OpenAI API and displays the conversation.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## API key handling

Your OpenAI API key is **not** in any source file. It lives only in `.env.local`,
which is listed in `.gitignore` and is never committed or sent to the browser.
The Next.js API route at `app/api/chat/route.ts` reads it server-side
(`process.env.OPENAI_API_KEY`) and proxies requests to OpenAI, so the key never
reaches client-side JavaScript.

If you regenerate this project or push it to a public repo, rotate the key
first (https://platform.openai.com/api-keys) — it was pasted in plaintext in
the original prompt and should be treated as compromised.

## Deploying to Vercel

1. Push this repo (`.env.local` will be excluded automatically).
2. In the Vercel project settings, add an environment variable:
   - `OPENAI_API_KEY` = your key
3. Deploy. Vercel injects the variable server-side only, same as local dev.
