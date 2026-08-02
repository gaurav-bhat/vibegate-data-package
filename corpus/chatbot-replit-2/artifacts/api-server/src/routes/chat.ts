import { Router, type IRouter } from "express";
import OpenAI from "openai";
import {
  SendMessageBody,
  SendMessageResponse,
  GetConversationStartersResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getOpenAIClient(): OpenAI {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
}

const CONVERSATION_STARTERS = [
  { text: "Explain quantum computing in simple terms" },
  { text: "What are the best practices for writing clean code?" },
  { text: "Help me brainstorm ideas for a side project" },
  { text: "What should I know about machine learning?" },
  { text: "How do I improve my public speaking skills?" },
  { text: "Write a short poem about the ocean" },
];

router.get("/chat/starters", async (_req, res): Promise<void> => {
  res.json(GetConversationStartersResponse.parse(CONVERSATION_STARTERS));
});

router.post("/chat/message", async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { messages } = parsed.data;

  if (!messages || messages.length === 0) {
    res.status(400).json({ error: "messages array must not be empty" });
    return;
  }

  let client: OpenAI;
  try {
    client = getOpenAIClient();
  } catch {
    req.log.error("OpenAI API key not configured");
    res.status(500).json({ error: "OpenAI API key is not configured. Please set OPENAI_API_KEY." });
    return;
  }

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const reply = completion.choices[0]?.message?.content ?? "";

  res.json(
    SendMessageResponse.parse({
      role: "assistant",
      content: reply,
    }),
  );
});

export default router;
