import { Router, type IRouter } from "express";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import OpenAI from "openai";
import {
  ListConversationsResponse,
  CreateConversationBody,
  CreateConversationResponse,
  GetConversationParams,
  GetConversationResponse,
  DeleteConversationParams,
  ListMessagesParams,
  ListMessagesResponse,
  SendMessageParams,
  SendMessageBody,
  SendMessageResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey });
}

// GET /conversations
router.get("/conversations", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: conversationsTable.id,
      title: conversationsTable.title,
      createdAt: conversationsTable.createdAt,
      updatedAt: conversationsTable.updatedAt,
      messageCount: count(messagesTable.id),
      lastMessage: sql<string | null>`
        (SELECT content FROM messages
         WHERE conversation_id = ${conversationsTable.id}
         ORDER BY created_at DESC
         LIMIT 1)
      `,
    })
    .from(conversationsTable)
    .leftJoin(messagesTable, eq(messagesTable.conversationId, conversationsTable.id))
    .groupBy(conversationsTable.id)
    .orderBy(desc(conversationsTable.updatedAt));

  res.json(ListConversationsResponse.parse(rows));
});

// POST /conversations
router.post("/conversations", async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const title = parsed.data.title ?? "New Conversation";

  const [conversation] = await db
    .insert(conversationsTable)
    .values({ title })
    .returning();

  const result = {
    ...conversation,
    messageCount: 0,
    lastMessage: null,
  };

  res.status(201).json(CreateConversationResponse.parse(result));
});

// GET /conversations/:id
router.get("/conversations/:id", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      id: conversationsTable.id,
      title: conversationsTable.title,
      createdAt: conversationsTable.createdAt,
      updatedAt: conversationsTable.updatedAt,
      messageCount: count(messagesTable.id),
      lastMessage: sql<string | null>`
        (SELECT content FROM messages
         WHERE conversation_id = ${conversationsTable.id}
         ORDER BY created_at DESC
         LIMIT 1)
      `,
    })
    .from(conversationsTable)
    .leftJoin(messagesTable, eq(messagesTable.conversationId, conversationsTable.id))
    .where(eq(conversationsTable.id, params.data.id))
    .groupBy(conversationsTable.id);

  if (!row) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.json(GetConversationResponse.parse(row));
});

// DELETE /conversations/:id
router.delete("/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.sendStatus(204);
});

// GET /conversations/:id/messages
router.get("/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  res.json(ListMessagesResponse.parse(messages));
});

// POST /conversations/:id/messages
router.post("/conversations/:id/messages", async (req, res): Promise<void> => {
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

  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Store the user message
  await db.insert(messagesTable).values({
    conversationId: params.data.id,
    role: "user",
    content: body.data.content,
  });

  // Fetch full conversation history for context
  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  // Call OpenAI
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const aiContent = completion.choices[0]?.message?.content ?? "Sorry, I could not generate a response.";

  // Store the assistant reply
  const [assistantMessage] = await db
    .insert(messagesTable)
    .values({
      conversationId: params.data.id,
      role: "assistant",
      content: aiContent,
    })
    .returning();

  // Update conversation updatedAt
  await db
    .update(conversationsTable)
    .set({ updatedAt: new Date() })
    .where(eq(conversationsTable.id, params.data.id));

  res.status(201).json(SendMessageResponse.parse(assistantMessage));
});

export default router;
