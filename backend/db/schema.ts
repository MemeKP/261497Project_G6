import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  boolean,
  text,
  decimal,
} from "drizzle-orm/pg-core";

/**
 * Helper: ใช้กับฟิลด์ที่เป็นเงิน
 * DB เก็บ DECIMAL(10,2)
 * TS ใช้งานเป็น number
 */
const money = (name: string) =>
  decimal(name, { precision: 10, scale: 2 }).$type<number>();

/**
 * Admins (staff)
 */
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(), 
  name: varchar("name", { length: 100 }).notNull(),           
  phone: varchar("phone", { length: 20 }),                        
  address: text("address"),                                     
  email: varchar("email", { length: 150 }).unique().notNull(),
  password: varchar("password", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Tables (physical tables in restaurant)
 */
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  number: integer("number").unique().notNull(),
  status: varchar("status", { length: 20 }).default("AVAILABLE"), // AVAILABLE, OCCUPIED, CLOSED
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Dining sessions (1 โต๊ะ 1 รอบการใช้งาน)
 */
export const diningSessions = pgTable("dining_sessions", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").notNull().references(() => tables.id),
  openedByAdminId: integer("opened_by_admin_id").notNull().references(() => admins.id),
  total: decimal("total", { precision: 10, scale: 2 }).$type<number>().default(0), 
  total_customers: integer("total_customers"),
  qrCode: text("qr_code").notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  status: varchar("status", { length: 20 }).default("ACTIVE"), // ACTIVE, CLOSED
  createdAt: timestamp("created_at").defaultNow(),
});



/**
 * Menu items
 */
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  price: money("price").notNull(),
  imageUrl: text("image_url"),
  category: varchar("category", { length: 100 }).notNull(),
  isSignature: boolean("is_signature").default(false),
  isAvailable: boolean("is_available").default(true),
  createdByAdminId: integer("created_by_admin_id"),
  updatedByAdminId: integer("updated_by_admin_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


/**
 * Orders
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").notNull().references(() => tables.id),
  diningSessionId: integer("dining_session_id").notNull().references(() => diningSessions.id),
  status: varchar("status", { length: 20 }).default("PENDING"), // PENDING, PREPARING, SERVED, PAID
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Order items (ผูกกับ member → ใครสั่ง)
 */
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItems.id),
  memberId: integer("member_id").notNull().references(() => members.id),
  quantity: integer("quantity").default(1),
  note: text("note"),
  status: varchar("status", { length: 20 }).default("PREPARING"), // PREPARING, READY TO SERVE, CANCELLED , COMPLETE
});

/**
 * Bills (1 order → 1 bill)
 */
export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  diningSessionId: integer("dining_session_id").notNull().references(() => diningSessions.id),
  subtotal: money("subtotal").default(0),
  serviceCharge: money("service_charge").default(0),
  vat: money("vat").default(0),
  total: money("total").default(0),
  status: varchar("status", { length: 20 }).default("UNPAID"),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Bill splits (ยอดที่แต่ละ member ต้องจ่าย)
 */
export const billSplits = pgTable("bill_splits", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").notNull().references(() => bills.id),
  memberId: integer("member_id").notNull().references(() => members.id),
  amount: money("amount").notNull(),
  paid: boolean("paid").default(false),
});

/**
 * Payments (รองรับทั้ง full bill และ per member)
 */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").notNull().references(() => bills.id),
  billSplitId: integer("bill_split_id").references(() => billSplits.id), // null = full bill
  memberId: integer("member_id").references(() => members.id),        // null = full bill
  method: varchar("method", { length: 20 }).notNull(), // เช่น QR
  amount: money("amount").notNull(),
  status: varchar("status", { length: 20 }).default("PENDING"), // PENDING, PAID, FAILED
  paidAt: timestamp("paid_at"),
  ref1: varchar("ref1", { length: 100 }),
});


export const users = pgTable("user", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  user_id: integer('user_id').references(() => users.id),// null = guest
  diningSessionId: integer('dining_session_id').notNull(),
  isTableAdmin: boolean('is_table_admin').default(false),
  joinedAt: timestamp('joined_at').defaultNow(),
  note: text('note')
});


/**
 * Members (ลูกค้าที่โต๊ะ)
 * 1 คนในโต๊ะจะเป็น table admin (isTableAdmin = true)
 */
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  diningSessionId: integer("dining_session_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  isTableAdmin: boolean("is_table_admin").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
  note: text('note'),
});
