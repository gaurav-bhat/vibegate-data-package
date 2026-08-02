import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return new Response("Missing OPENAI_API_KEY", { status: 500 });
        }

        const { messages } = (await request.json()) as { messages?: Msg[] };
        if (!Array.isArray(messages)) {
          return new Response("messages required", { status: 400 });
        }

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a helpful, concise assistant." },
              ...messages,
            ],
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          return new Response(text || "OpenAI request failed", { status: res.status });
        }

        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const reply = data.choices?.[0]?.message?.content ?? "";
        return Response.json({ reply });
      },
    },
  },
});
