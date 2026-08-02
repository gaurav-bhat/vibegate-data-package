import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return new Response("Missing OPENAI_API_KEY", { status: 500 });
        }

        const openai = createOpenAI({ apiKey });
        const result = streamText({
          model: openai("gpt-4o-mini"),
          system:
            "You are a friendly, helpful assistant. Keep replies concise and clear.",
          messages: convertToModelMessages(messages),
          onError: ({ error }) => {
            console.error("streamText error:", error);
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onError: (error) => {
            console.error("stream response error:", error);
            return error instanceof Error ? error.message : String(error);
          },
        });
      },
    },
  },
});
