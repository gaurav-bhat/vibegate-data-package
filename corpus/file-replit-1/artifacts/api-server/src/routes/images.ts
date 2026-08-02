import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, imagesTable } from "@workspace/db";
import { CreateImageBody, DeleteImageParams } from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * GET /images
 * List all gallery images, newest first.
 */
router.get("/images", async (req, res): Promise<void> => {
  try {
    const images = await db
      .select()
      .from(imagesTable)
      .orderBy(desc(imagesTable.createdAt));
    res.json(images);
  } catch (error) {
    req.log.error({ err: error }, "Error listing images");
    res.status(500).json({ error: "Failed to list images" });
  }
});

/**
 * POST /images
 * Record an uploaded image in the gallery.
 */
router.post("/images", async (req, res): Promise<void> => {
  const parsed = CreateImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [image] = await db
      .insert(imagesTable)
      .values({
        objectPath: parsed.data.objectPath,
        filename: parsed.data.filename,
        contentType: parsed.data.contentType,
        sizeBytes: parsed.data.sizeBytes,
      })
      .returning();

    res.status(201).json(image);
  } catch (error) {
    req.log.error({ err: error }, "Error recording image");
    res.status(500).json({ error: "Failed to record image" });
  }
});

/**
 * DELETE /images/:id
 * Remove an image from the gallery.
 */
router.delete("/images/:id", async (req, res): Promise<void> => {
  const params = DeleteImageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const [deleted] = await db
      .delete(imagesTable)
      .where(eq(imagesTable.id, params.data.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    res.sendStatus(204);
  } catch (error) {
    req.log.error({ err: error }, "Error deleting image");
    res.status(500).json({ error: "Failed to delete image" });
  }
});

export default router;
