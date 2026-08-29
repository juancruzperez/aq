import { 
  pgTable, text, integer, timestamp, doublePrecision, pgEnum, primaryKey 
} from 'drizzle-orm/pg-core';

// --- Roles y Estados ---
export const roleEnum = pgEnum('role', ['ADMIN', 'CLIENT']);
export const statusEnum = pgEnum('status', ['PENDING', 'COMPLETED']);

// --- Modelos requeridos por NextAuth.js ---
export const users = pgTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  role: roleEnum('role').default('CLIENT'),
});

export const accounts = pgTable('account', {
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
}));

// --- Modelos de la Aplicación ---
export const products = pgTable('product', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  precioVenta: doublePrecision('precio_venta').notNull(),
  costo: doublePrecision('costo').notNull(),
  stockReal: integer('stock_real').default(0).notNull(),
  stockComprometido: integer('stock_comprometido').default(0).notNull(),
  stockMinimo: integer('stock_minimo').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('order', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  status: statusEnum('status').default('PENDING').notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orderItems = pgTable('order_item', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: doublePrecision('price').notNull(), // Precio congelado al momento de la compra
});