import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const admin = pgTable("admin", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dining_sessions = pgTable("dining_sessions", {
  id: serial("id").primaryKey(),
  table_id: integer("table_id").notNull(),
  started_at: timestamp("started_at"),
  ended_at: timestamp("ended_at"),
  status: varchar("status", { length: 20 }),
  total_customers: integer("total_customers"),
  created_at: timestamp("created_at").defaultNow(),
});

export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  table_id: integer('table_id').notNull(),
  creator_user_id: integer('creator_user_id'),
  created_at: timestamp('created_at').defaultNow()
});

export const group_members = pgTable('group_members', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  group_id: integer('group_id').notNull().references(() => groups.id),
  user_id: integer('user_id').references(() => users.id),
  note: text('note')
});

export const menu_items = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  is_available: boolean('is_available').default(true),
  created_at: timestamp('created_at').defaultNow()
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  table_id: integer('table_id').notNull(),
  group_id: integer('group_id').references(() => groups.id), 
  user_id: integer('user_id').references(() => users.id), 
  dining_session_id: integer('dining_session_id').references(() => dining_sessions.id),
  status: varchar('status', { length: 20 }), 
  created_at: timestamp('created_at').defaultNow()
});

export const order_items = pgTable('order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull().references(() => orders.id),
  menu_item_id: integer('menu_item_id').notNull().references(() => menu_items.id),
  quantity: integer('quantity'),
  note: text('note')
});