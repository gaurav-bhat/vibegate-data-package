import { Router, type IRouter } from "express";
import { db, waitlistTable } from "@workspace/db";
import { count, sql } from "drizzle-orm";
import { insertWaitlistSchema } from "@workspace/db";
import { JoinWaitlistBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/waitlist", async (req, res): Promise<void> => {
  const parsed = JoinWaitlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const validated = insertWaitlistSchema.safeParse({ email: parsed.data.email });
  if (!validated.success) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  try {
    const [inserted] = await db
      .insert(waitlistTable)
      .values({ email: validated.data.email })
      .returning({ id: waitlistTable.id });

    const [{ total }] = await db
      .select({ total: count() })
      .from(waitlistTable);

    req.log.info({ email: validated.data.email }, "New waitlist signup");

    res.status(201).json({
      message: "You're on the list! We'll be in touch soon.",
      position: total,
    });
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === "23505") {
      res.status(409).json({ error: "This email is already on the waitlist." });
      return;
    }
    throw err;
  }
});

router.get("/waitlist", async (req, res): Promise<void> => {
  const [{ total }] = await db
    .select({ total: count() })
    .from(waitlistTable);

  res.json({ count: total });
});

export default router;
