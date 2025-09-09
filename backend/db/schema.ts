import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

export const usersTable = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name"),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$default(
    () => new Date()
  ),
});

export const diningSessionsTable = sqliteTable("dining_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableId: integer("table_id").notNull(),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).$default(
    () => new Date()
  ),
  endedAt: integer("ended_at", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE / COMPLETED
  totalCustomers: integer("total_customers"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$default(
    () => new Date()
  ),
});

export const groupsTable = sqliteTable("groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableId: integer("table_id").notNull(), 
  creatorUserId: text("creator_user_id").notNull(), 
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$default(
    () => new Date()
  ),
});

export const tablesTable = sqliteTable("tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: integer("number").unique().notNull(), // หมายเลขโต๊ะ
  status: text("status").notNull().default("AVAILABLE"), // AVAILABLE / OCCUPIED
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$default(
    () => new Date()
  ),
});

export const groupMembersTable = sqliteTable("group_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // ชื่อเพื่อน
  groupId: integer("group_id").notNull(),
  userId: text("user_id"), 
  note: text("note"),
});

export const ordersTable = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableId: integer("table_id").notNull(),
  groupId: integer("group_id"), // nullable ถ้าคนเดียว
  userId: text("user_id"), // nullable ถ้าสั่งรวมกับกลุ่ม
  diningSessionId: integer("dining_session_id"), // อิงกับ session
  status: text("status").notNull().default("PENDING"), // PENDING / PREPARING / SERVED / COMPLETED
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$default(
    () => new Date()
  ),
});

export const orderItemsTable = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  note: text("note"),
});