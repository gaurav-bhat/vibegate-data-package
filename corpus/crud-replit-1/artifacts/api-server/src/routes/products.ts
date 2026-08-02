import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import {
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
  ListProductsResponse,
  GetProductResponse,
  CreateProductResponse,
  UpdateProductResponse,
  GetProductStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .orderBy(productsTable.createdAt);

  const mapped = products.map((p) => ({
    ...p,
    price: parseFloat(p.price),
  }));

  res.json(ListProductsResponse.parse(mapped));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      name: parsed.data.name,
      price: String(parsed.data.price),
      description: parsed.data.description ?? null,
    })
    .returning();

  res.status(201).json(CreateProductResponse.parse({ ...product, price: parseFloat(product.price) }));
});

router.get("/products/stats/summary", async (req, res): Promise<void> => {
  const [stats] = await db
    .select({
      totalProducts: sql<number>`count(*)::int`,
      totalValue: sql<number>`coalesce(sum(${productsTable.price}::numeric), 0)`,
      averagePrice: sql<number>`coalesce(avg(${productsTable.price}::numeric), 0)`,
    })
    .from(productsTable);

  res.json(
    GetProductStatsResponse.parse({
      totalProducts: stats.totalProducts,
      totalValue: Number(stats.totalValue),
      averagePrice: Number(stats.averagePrice),
    }),
  );
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse({ ...product, price: parseFloat(product.price) }));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.price !== undefined) updates.price = String(parsed.data.price);
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;

  const [product] = await db
    .update(productsTable)
    .set(updates)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(UpdateProductResponse.parse({ ...product, price: parseFloat(product.price) }));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
