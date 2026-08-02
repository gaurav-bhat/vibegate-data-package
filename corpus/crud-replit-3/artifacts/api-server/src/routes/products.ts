import { Router, type IRouter } from "express";
import { eq, avg, min, max, count } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import {
  CreateProductBody,
  UpdateProductBody,
  UpdateProductParams,
  GetProductParams,
  DeleteProductParams,
  ListProductsResponse,
  CreateProductResponse,
  GetProductStatsResponse,
  GetProductResponse,
  UpdateProductResponse,
  DeleteProductResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// List all products
router.get("/products", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(productsTable)
    .orderBy(productsTable.createdAt);

  const products = rows.map((r) => ({
    ...r,
    price: Number(r.price),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  res.json(ListProductsResponse.parse(products));
});

// Get product stats
router.get("/products/stats", async (req, res): Promise<void> => {
  const [stats] = await db
    .select({
      total: count(productsTable.id),
      averagePrice: avg(productsTable.price),
      minPrice: min(productsTable.price),
      maxPrice: max(productsTable.price),
    })
    .from(productsTable);

  const result = {
    total: Number(stats.total),
    averagePrice: stats.averagePrice != null ? Number(stats.averagePrice) : null,
    minPrice: stats.minPrice != null ? Number(stats.minPrice) : null,
    maxPrice: stats.maxPrice != null ? Number(stats.maxPrice) : null,
  };

  res.json(GetProductStatsResponse.parse(result));
});

// Get single product
router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { id } = GetProductParams.parse({ id: Number(raw) });

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(
    GetProductResponse.parse({
      ...product,
      price: Number(product.price),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    })
  );
});

// Create product
router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid create product body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, price, description } = parsed.data;

  const [product] = await db
    .insert(productsTable)
    .values({ name, price: String(price), description: description ?? null })
    .returning();

  res.status(201).json(
    CreateProductResponse.parse({
      ...product,
      price: Number(product.price),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    })
  );
});

// Update product
router.patch("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { id } = UpdateProductParams.parse({ id: Number(raw) });

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid update product body");
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
    .where(eq(productsTable.id, id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(
    UpdateProductResponse.parse({
      ...product,
      price: Number(product.price),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    })
  );
});

// Delete product
router.delete("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { id } = DeleteProductParams.parse({ id: Number(raw) });

  const [deleted] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, id))
    .returning({ id: productsTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.status(204).send();
});

export default router;
