ALTER TABLE "bills" ALTER COLUMN "subtotal" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "bills" ALTER COLUMN "service_charge" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "bills" ALTER COLUMN "vat" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "bills" ALTER COLUMN "total" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "status" varchar(20) DEFAULT 'UNPAID';