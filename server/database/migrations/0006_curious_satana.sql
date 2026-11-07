ALTER TABLE "appointment" ADD COLUMN "google_event_id" text;--> statement-breakpoint
CREATE INDEX "appointment_google_event_id_idx" ON "appointment" USING btree ("google_event_id");