import { Router, type IRouter } from "express";
import { eq, and, count, sql } from "drizzle-orm";
import { db, tasksTable } from "@workspace/db";
import {
  GetTasksResponseItem,
  GetTasksResponse,
  CreateTaskBody,
  CreateTaskResponse,
  GetTasksSummaryResponse,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
  DeleteTaskParams,
  DeleteTaskResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import type { Request } from "express";

type AuthedRequest = Request & { userId: string };

const router: IRouter = Router();

// GET /tasks — list all tasks for the authenticated user
router.get("/tasks", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthedRequest;
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.userId, userId))
    .orderBy(tasksTable.createdAt);
  res.json(GetTasksResponse.parse(tasks));
});

// GET /tasks/summary — get counts for the authenticated user
router.get("/tasks/summary", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthedRequest;
  const rows = await db
    .select({
      done: tasksTable.done,
      cnt: count(),
    })
    .from(tasksTable)
    .where(eq(tasksTable.userId, userId))
    .groupBy(tasksTable.done);

  let total = 0;
  let done = 0;
  let pending = 0;

  for (const row of rows) {
    total += Number(row.cnt);
    if (row.done) {
      done += Number(row.cnt);
    } else {
      pending += Number(row.cnt);
    }
  }

  res.json(GetTasksSummaryResponse.parse({ total, done, pending }));
});

// POST /tasks — create a task
router.post("/tasks", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthedRequest;
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .insert(tasksTable)
    .values({ userId, title: parsed.data.title })
    .returning();

  res.status(201).json(CreateTaskResponse.parse(task));
});

// PATCH /tasks/:id — update a task
router.patch("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthedRequest;

  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .update(tasksTable)
    .set(parsed.data)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(UpdateTaskResponse.parse(task));
});

// DELETE /tasks/:id — delete a task
router.delete("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = req as AuthedRequest;

  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db
    .delete(tasksTable)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(DeleteTaskResponse.parse({ success: true }));
});

export default router;
