import { createServerFn } from "@tanstack/react-start";

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export const sendChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const data = input as { messages?: ChatMessage[] };
    if (!data || !Array.isArray(data.messages)) throw new Error("messages required");
    return { messages: data.messages };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful, friendly assistant." },
          ...data.messages,
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return { reply: json.choices[0]?.message?.content ?? "" };
  });