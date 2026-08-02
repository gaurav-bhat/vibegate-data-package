import { Router, type IRouter } from "express";
import { db, waitlistTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  JoinWaitlistBody,
  JoinWaitlistResponse,
  GetWaitlistStatsResponse,
} from "@workspace/api-zod";

const waitlistRouter: IRouter = Router();

waitlistRouter.post("/waitlist", async (req, res): Promise<void> => {
  const parsed = JoinWaitlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: parsed.error.message });
    return;
  }

  const { email } = parsed.data;

  // Check for duplicate
  const existing = await db
    .select()
    .from(waitlistTable)
    .where(eq(waitlistTable.email, email))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Email is already on the waitlist." });
    return;
  }

  const [entry] = await db
    .insert(waitlistTable)
    .values({ email })
    .returning();

  const validated = JoinWaitlistResponse.parse({
    id: entry.id,
    email: entry.email,
    createdAt: entry.createdAt.toISOString(),
  });

  req.log.info({ email }, "New waitlist signup");
  res.status(201).json(validated);
});

waitlistRouter.get("/waitlist", async (req, res): Promise<void> => {
  const [result] = await db.select({ count: count() }).from(waitlistTable);

  const validated = GetWaitlistStatsResponse.parse({
    count: Number(result.count),
  });

  res.json(validated);
});

export default waitlistRouter;
