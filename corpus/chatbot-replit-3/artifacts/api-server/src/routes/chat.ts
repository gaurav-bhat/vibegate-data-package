import { Router, type IRouter } from "express";
import { db, chatSessionsTable, chatMessagesTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import {
  CreateSessionBody,
  GetSessionParams,
  DeleteSessionParams,
  SendMessageParams,
  SendMessageBody,
} from "@workspace/api-zod";
import OpenAI from "openai";

const router: IRouter = Router();

function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// GET /chat/sessions
router.get("/chat/sessions", async (req, res): Promise<void> => {
  const sessions = await db
    .select({
      id: chatSessionsTable.id,
      title: chatSessionsTable.title,
      createdAt: chatSessionsTable.createdAt,
      messageCount: count(chatMessagesTable.id),
    })
    .from(chatSessionsTable)
    .leftJoin(chatMessagesTable, eq(chatSessionsTable.id, chatMessagesTable.sessionId))
    .groupBy(chatSessionsTable.id)
    .orderBy(desc(chatSessionsTable.createdAt));

  res.json(
    sessions.map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt.toISOString(),
      messageCount: Number(s.messageCount),
    })),
  );
});

// POST /chat/sessions
router.post("/chat/sessions", async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(chatSessionsTable)
    .values({ title: parsed.data.title })
    .returning();

  res.status(201).json({
    id: session.id,
    title: session.title,
    createdAt: session.createdAt.toISOString(),
    messageCount: 0,
  });
});

// GET /chat/sessions/:id
router.get("/chat/sessions/:id", async (req, res): Promise<void> => {
  const params = GetSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, params.data.id));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, params.data.id))
    .orderBy(chatMessagesTable.createdAt);

  res.json({
    id: session.id,
    title: session.title,
    createdAt: session.createdAt.toISOString(),
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

// DELETE /chat/sessions/:id
router.delete("/chat/sessions/:id", async (req, res): Promise<void> => {
  const params = DeleteSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db
    .delete(chatSessionsTable)
    .where(eq(chatSessionsTable.id, params.data.id))
    .returning();

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.sendStatus(204);
});

// POST /chat/sessions/:id/messages
router.post("/chat/sessions/:id/messages", async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SendMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // Verify session exists
  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, params.data.id));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  // Load conversation history for context
  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, params.data.id))
    .orderBy(chatMessagesTable.createdAt);

  // Persist the user message
  await db.insert(chatMessagesTable).values({
    sessionId: params.data.id,
    role: "user",
    content: body.data.content,
  });

  // Call OpenAI
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: body.data.content },
    ],
  });

  const replyContent =
    completion.choices[0]?.message?.content ??
    "I'm sorry, I couldn't generate a response.";

  // Persist and return the assistant reply
  const [assistantMsg] = await db
    .insert(chatMessagesTable)
    .values({
      sessionId: params.data.id,
      role: "assistant",
      content: replyContent,
    })
    .returning();

  res.json({
    id: assistantMsg.id,
    role: "assistant",
    content: replyContent,
    createdAt: assistantMsg.createdAt.toISOString(),
  });
});

// GET /chat/stats
router.get("/chat/stats", async (_req, res): Promise<void> => {
  const [sessionStats] = await db
    .select({ totalSessions: count(chatSessionsTable.id) })
    .from(chatSessionsTable);

  const [msgStats] = await db
    .select({ totalMessages: count(chatMessagesTable.id) })
    .from(chatMessagesTable);

  const totalSessions = Number(sessionStats?.totalSessions ?? 0);
  const totalMessages = Number(msgStats?.totalMessages ?? 0);

  res.json({
    totalSessions,
    totalMessages,
    avgMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
  });
});

export default router;
