import { Router } from "express";
import { db, waitlistTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// POST /api/waitlist — join waitlist
router.post("/waitlist", async (req, res) => {
  const parsed = emailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  const { email } = parsed.data;

  try {
    const [entry] = await db
      .insert(waitlistTable)
      .values({ email })
      .returning();

    res.status(201).json({
      id: entry.id,
      email: entry.email,
      createdAt: entry.createdAt.toISOString(),
    });
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr?.code === "23505") {
      res.status(409).json({ error: "Email already on the waitlist" });
      return;
    }
    req.log.error({ err }, "Failed to add to waitlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/waitlist — list all entries
router.get("/waitlist", async (req, res) => {
  try {
    const entries = await db
      .select()
      .from(waitlistTable)
      .orderBy(waitlistTable.createdAt);

    res.json(
      entries.map((e) => ({
        id: e.id,
        email: e.email,
        createdAt: e.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch waitlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
