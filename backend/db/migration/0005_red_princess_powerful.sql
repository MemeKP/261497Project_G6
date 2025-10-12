CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"address" text,
	"email" varchar(150) NOT NULL,
	"password" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_username_unique" UNIQUE("username"),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "bill_splits" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"member_id" integer,
	"amount" numeric(10, 2) NOT NULL,
	"paid" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"dining_session_id" integer NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT 0,
	"service_charge" numeric(10, 2) DEFAULT 0,
	"vat" numeric(10, 2) DEFAULT 0,
	"total" numeric(10, 2) DEFAULT 0,
	"status" varchar(20) DEFAULT 'UNPAID',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"dining_session_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_table_admin" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now(),
	"note" text
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"bill_split_id" integer,
	"member_id" integer,
	"method" varchar(20) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING',
	"paid_at" timestamp,
	"ref1" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"status" varchar(20) DEFAULT 'AVAILABLE',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tables_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "admin" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "admin" CASCADE;--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_email_unique";--> statement-breakpoint
ALTER TABLE "dining_sessions" ALTER COLUMN "started_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "dining_sessions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';--> statement-breakpoint
ALTER TABLE "menu_items" ALTER COLUMN "name" SET DATA TYPE varchar(150);--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "quantity" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "dining_sessions" ADD COLUMN "opened_by_admin_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "dining_sessions" ADD COLUMN "total" numeric(10, 2) DEFAULT 0;--> statement-breakpoint
ALTER TABLE "dining_sessions" ADD COLUMN "qr_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "group_members" ADD COLUMN "dining_session_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "group_members" ADD COLUMN "is_table_admin" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "group_members" ADD COLUMN "joined_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "category" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "is_signature" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "created_by_admin_id" integer;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "updated_by_admin_id" integer;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "member_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "status" varchar(20) DEFAULT 'PREPARING';--> statement-breakpoint
ALTER TABLE "bill_splits" ADD CONSTRAINT "bill_splits_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_splits" ADD CONSTRAINT "bill_splits_member_id_group_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_dining_session_id_dining_sessions_id_fk" FOREIGN KEY ("dining_session_id") REFERENCES "public"."dining_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_bill_split_id_bill_splits_id_fk" FOREIGN KEY ("bill_split_id") REFERENCES "public"."bill_splits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dining_sessions" ADD CONSTRAINT "dining_sessions_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dining_sessions" ADD CONSTRAINT "dining_sessions_opened_by_admin_id_admins_id_fk" FOREIGN KEY ("opened_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_member_id_group_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "password";