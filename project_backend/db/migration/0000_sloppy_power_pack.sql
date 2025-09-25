CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "bill_splits" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"paid" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"dining_session_id" integer NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0',
	"service_charge" numeric(10, 2) DEFAULT '0',
	"vat" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dining_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_id" integer NOT NULL,
	"opened_by_admin_id" integer NOT NULL,
	"qr_code" text,
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp,
	"status" varchar(20) DEFAULT 'ACTIVE',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"dining_session_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_table_admin" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"is_available" boolean DEFAULT true,
	"created_by_admin_id" integer,
	"updated_by_admin_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"menu_item_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"quantity" integer DEFAULT 1,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"dining_session_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING',
	"created_at" timestamp DEFAULT now()
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
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"status" varchar(20) DEFAULT 'AVAILABLE',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tables_number_unique" UNIQUE("number")
);
