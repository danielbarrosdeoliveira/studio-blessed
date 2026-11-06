ALTER TABLE "appointment" DROP CONSTRAINT "appointment_professional_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "service" DROP CONSTRAINT "service_professional_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "time_block" DROP CONSTRAINT "time_block_professional_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "working_hours" DROP CONSTRAINT "working_hours_professional_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "appointment_professional_starts_idx";--> statement-breakpoint
DROP INDEX "service_professional_idx";--> statement-breakpoint
DROP INDEX "time_block_professional_idx";--> statement-breakpoint
DROP INDEX "working_hours_professional_idx";--> statement-breakpoint
CREATE INDEX "appointment_service_starts_idx" ON "appointment" USING btree ("service_id","starts_at");--> statement-breakpoint
CREATE INDEX "time_block_starts_at_idx" ON "time_block" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "working_hours_weekday_idx" ON "working_hours" USING btree ("weekday");--> statement-breakpoint
ALTER TABLE "appointment" DROP COLUMN "professional_id";--> statement-breakpoint
ALTER TABLE "service" DROP COLUMN "professional_id";--> statement-breakpoint
ALTER TABLE "time_block" DROP COLUMN "professional_id";--> statement-breakpoint
ALTER TABLE "working_hours" DROP COLUMN "professional_id";