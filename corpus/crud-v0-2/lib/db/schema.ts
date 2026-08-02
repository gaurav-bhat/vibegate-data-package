import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core"

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  description: text("description").notNull().default(""),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export type Product = typeof products.$inferSelect
