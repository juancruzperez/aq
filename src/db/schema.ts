import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  primaryKey,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

export const roleEnum = pgEnum("role", ["ADMIN", "CLIENT"]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "READY_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
]);

// -----------------------------------------------------------------------------
// NextAuth / Users
// -----------------------------------------------------------------------------

export const users = pgTable(
  "user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    role: roleEnum("role").notNull().default("CLIENT"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    roleIdx: index("user_role_idx").on(table.role),
  }),
);

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
    userIdx: index("account_user_id_idx").on(table.userId),
  }),
);

export const sessions = pgTable(
  "session",
  {
    sessionToken: text("sessionToken").notNull().primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    userIdx: index("session_user_id_idx").on(table.userId),
  }),
);

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.identifier, table.token] }),
  }),
);

// -----------------------------------------------------------------------------
// Products / Inventory
// -----------------------------------------------------------------------------

export const products = pgTable(
  "product",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),

    // Monetary values use NUMERIC instead of floating point to avoid
    // accounting precision errors.
    precioVenta: numeric("precio_venta", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),
    costo: numeric("costo", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),

    // Three-tier inventory model.
    stockReal: integer("stock_real").notNull().default(0),
    stockComprometido: integer("stock_comprometido").notNull().default(0),
    stockMinimo: integer("stock_minimo").notNull().default(0),

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index("product_name_idx").on(table.name),
    stockIdx: index("product_stock_idx").on(
      table.stockReal,
      table.stockComprometido,
      table.stockMinimo,
    ),
    nonNegativeStock: check(
      "product_stock_non_negative",
      sql`${table.stockReal} >= 0 AND ${table.stockComprometido} >= 0 AND ${table.stockMinimo} >= 0`,
    ),
    nonNegativeMoney: check(
      "product_money_non_negative",
      sql`${table.precioVenta} >= 0 AND ${table.costo} >= 0`,
    ),
  }),
);

// -----------------------------------------------------------------------------
// Orders
// -----------------------------------------------------------------------------

export const orders = pgTable(
  "order",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    status: orderStatusEnum("status").notNull().default("PENDING"),
    totalAmount: numeric("total_amount", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (table) => ({
    userIdx: index("order_user_id_idx").on(table.userId),
    statusIdx: index("order_status_idx").on(table.status),
    createdAtIdx: index("order_created_at_idx").on(table.createdAt),
    userStatusIdx: index("order_user_status_idx").on(
      table.userId,
      table.status,
    ),
    nonNegativeTotal: check(
      "order_total_non_negative",
      sql`${table.totalAmount} >= 0`,
    ),
  }),
);

export const orderItems = pgTable(
  "order_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull(),

    // Snapshots preserve historical accounting even if the product changes.
    price: numeric("price", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),
    costo: numeric("costo", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),
  },
  (table) => ({
    orderIdx: index("order_item_order_id_idx").on(table.orderId),
    productIdx: index("order_item_product_id_idx").on(table.productId),
    orderProductIdx: uniqueIndex("order_item_order_product_idx").on(
      table.orderId,
      table.productId,
    ),
    positiveQuantity: check(
      "order_item_quantity_positive",
      sql`${table.quantity} > 0`,
    ),
    nonNegativeMoney: check(
      "order_item_money_non_negative",
      sql`${table.price} >= 0 AND ${table.costo} >= 0`,
    ),
  }),
);
// -----------------------------------------------------------------------------
// Notifications
// -----------------------------------------------------------------------------

export const notificationTypeEnum = pgEnum("notification_type", [
  "STOCK_CRITICAL",
]);

export const notifications = pgTable(
  "notification",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    type: notificationTypeEnum("type").notNull(),

    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    message: text("message").notNull(),

    stockReal: integer("stock_real").notNull(),
    stockComprometido: integer("stock_comprometido").notNull(),
    stockDisponible: integer("stock_disponible").notNull(),
    stockMinimo: integer("stock_minimo").notNull(),

    readAt: timestamp("read_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    productIdx: index("notification_product_id_idx").on(table.productId),
    typeIdx: index("notification_type_idx").on(table.type),
    createdAtIdx: index("notification_created_at_idx").on(table.createdAt),
    unreadIdx: index("notification_unread_idx").on(
      table.readAt,
      table.createdAt,
    ),
  }),
);