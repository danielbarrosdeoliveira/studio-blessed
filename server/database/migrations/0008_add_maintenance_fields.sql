-- Add maintenance fields to service table
ALTER TABLE "service" ADD COLUMN "has_maintenance" boolean DEFAULT false NOT NULL;
ALTER TABLE "service" ADD COLUMN "maintenance_price_cents" integer;
ALTER TABLE "service" ADD COLUMN "maintenance_duration_min" integer;

-- Backfill existing services: set has_maintenance = false where it's NULL (shouldn't happen with DEFAULT but safe)
UPDATE "service" SET "has_maintenance" = false WHERE "has_maintenance" IS NULL;

-- Add booking_type to appointment table
CREATE TYPE "public"."booking_type" AS ENUM('application', 'maintenance');
ALTER TABLE "appointment" ADD COLUMN "booking_type" "public"."booking_type" DEFAULT 'application' NOT NULL;