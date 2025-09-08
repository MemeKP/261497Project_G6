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