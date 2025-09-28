CREATE TABLE "dining_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_id" integer NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"status" varchar(20),
	"total_customers" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "admin" DROP COLUMN "updated_at";