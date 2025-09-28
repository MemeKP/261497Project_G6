ALTER TABLE "groups" DROP CONSTRAINT "groups_creator_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "groups" ALTER COLUMN "creator_user_id" DROP NOT NULL;