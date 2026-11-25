// Drizzle schema for Nora Store.
//
// products: the shop catalog (seeded once from the owner's real product
// facts, then fully editable from the in-app "Gestion boutique" screens).
// accounts: store customers (email + salted password hash, phone used to
// verify a password reset). sessions: opaque login tokens.
// orders: customer orders with line items stored as JSON.

import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category", {
    enum: ["sandales", "tshirts", "gourdes"],
  }).notNull(),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  priceAr: integer("price_ar").notNull(),
  bulkPriceAr: integer("bulk_price_ar"),
  bulkMinQty: integer("bulk_min_qty"),
  sizes: text("sizes").notNull().default("[]"), // JSON string[]
  colors: text("colors").notNull().default("[]"), // JSON string[]
  imageKey: text("image_key"), // key into client asset map, or null
  badge: text("badge"),
  rating: real("rating"),
  reviews: integer("reviews").notNull().default(0),
  customizable: integer("customizable", { mode: "boolean" })
    .notNull()
    .default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: text("reference").notNull().unique(),
  accountId: integer("account_id").references(() => accounts.id),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  zone: text("zone", { enum: ["antananarivo", "provinces"] }).notNull(),
  note: text("note").notNull().default(""),
  items: text("items").notNull().default("[]"), // JSON order lines
  subtotalAr: integer("subtotal_ar").notNull(),
  deliveryAr: integer("delivery_ar").notNull(),
  totalAr: integer("total_ar").notNull(),
  status: text("status", {
    enum: ["nouvelle", "confirmee", "livree", "annulee"],
  })
    .notNull()
    .default("nouvelle"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
