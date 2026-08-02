import { Router, type IRouter } from "express";
import { desc, eq, sum, count } from "drizzle-orm";
import { db, imagesTable } from "@workspace/db";
import {
  CreateImageBody,
  CreateImageResponse,
  DeleteImageParams,
  GetGalleryStatsResponse,
  ListImagesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/images", async (req, res): Promise<void> => {
  const images = await db
    .select()
    .from(imagesTable)
    .orderBy(desc(imagesTable.createdAt));
  res.json(ListImagesResponse.parse(images));
});

router.post("/images", async (req, res): Promise<void> => {
  const parsed = CreateImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [image] = await db.insert(imagesTable).values(parsed.data).returning();
  res.status(201).json(CreateImageResponse.parse(image));
});

router.get("/images/stats", async (_req, res): Promise<void> => {
  const [stats] = await db
    .select({
      imageCount: count(imagesTable.id),
      totalSizeBytes: sum(imagesTable.sizeBytes),
    })
    .from(imagesTable);

  res.json(
    GetGalleryStatsResponse.parse({
      imageCount: stats?.imageCount ?? 0,
      totalSizeBytes: Number(stats?.totalSizeBytes ?? 0),
    })
  );
});

router.delete("/images/:id", async (req, res): Promise<void> => {
  const params = DeleteImageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(imagesTable)
    .where(eq(imagesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
