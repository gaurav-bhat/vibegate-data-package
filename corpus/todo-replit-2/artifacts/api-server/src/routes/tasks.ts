import { Router, type IRouter } from "express";
import { eq, and, count, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, tasksTable } from "@workspace/db";
import {
  CreateTaskBody,
  UpdateTaskBody,
  UpdateTaskParams,
  DeleteTaskParams,
  ListTasksResponse,
  CreateTaskResponse,
  UpdateTaskResponse,
  GetTaskStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

// GET /tasks/stats — must come before /tasks/:id to avoid route shadowing
router.get("/tasks/stats", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;

  const [result] = await db
    .select({
      total: count(),
      completed: sql<number>`count(*) filter (where ${tasksTable.completed} = true)`,
      pending: sql<number>`count(*) filter (where ${tasksTable.completed} = false)`,
    })
    .from(tasksTable)
    .where(eq(tasksTable.userId, userId));

  res.json(
    GetTaskStatsResponse.parse({
      total: Number(result.total),
      completed: Number(result.completed),
      pending: Number(result.pending),
    }),
  );
});

// GET /tasks
router.get("/tasks", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.userId, userId))
    .orderBy(tasksTable.createdAt);

  res.json(ListTasksResponse.parse(tasks));
});

// POST /tasks
router.post("/tasks", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .insert(tasksTable)
    .values({ ...parsed.data, userId })
    .returning();

  res.status(201).json(CreateTaskResponse.parse(task));
});

// PATCH /tasks/:id
router.patch("/tasks/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
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

// DELETE /tasks/:id
router.delete("/tasks/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
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

  res.sendStatus(204);
});

export default router;
