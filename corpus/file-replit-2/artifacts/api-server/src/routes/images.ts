import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import { db, imagesTable } from "@workspace/db";
import {
  CreateImageBody,
  DeleteImageParams,
  CreateImageResponse,
  ListImagesResponse,
  GetGalleryStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/images", async (req, res): Promise<void> => {
  const limitRaw = req.query.limit ?? "100";
  const offsetRaw = req.query.offset ?? "0";
  const limit = Math.min(Number(limitRaw) || 100, 200);
  const offset = Number(offsetRaw) || 0;

  const images = await db
    .select()
    .from(imagesTable)
    .orderBy(desc(imagesTable.uploadedAt))
    .limit(limit)
    .offset(offset);

  res.json(ListImagesResponse.parse(images));
});

router.post("/images", async (req, res): Promise<void> => {
  const parsed = CreateImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [image] = await db
    .insert(imagesTable)
    .values({
      objectPath: parsed.data.objectPath,
      filename: parsed.data.filename,
      contentType: parsed.data.contentType,
      size: parsed.data.size,
      caption: parsed.data.caption ?? null,
    })
    .returning();

  res.status(201).json(CreateImageResponse.parse(image));
});

router.get("/images/stats", async (_req, res): Promise<void> => {
  const [stats] = await db
    .select({
      totalImages: sql<string>`cast(count(*) as text)`,
      totalSize: sql<string>`cast(coalesce(sum(${imagesTable.size}), 0) as text)`,
      latestUploadAt: sql<string | null>`max(${imagesTable.uploadedAt})`,
    })
    .from(imagesTable);

  res.json(
    GetGalleryStatsResponse.parse({
      totalImages: Number(stats?.totalImages ?? 0),
      totalSize: Number(stats?.totalSize ?? 0),
      latestUploadAt: stats?.latestUploadAt ?? null,
    })
  );
});

router.delete("/images/:id", async (req, res): Promise<void> => {
  const params = DeleteImageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(imagesTable)
    .where(sql`${imagesTable.id} = ${params.data.id}`)
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
