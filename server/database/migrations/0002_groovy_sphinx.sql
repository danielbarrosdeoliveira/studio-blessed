-- Mantém apenas o serviço ativo mais antigo de cada nome normalizado.
-- Duplicatas viram serviços inativos para preservar o histórico de agendamentos.
WITH ranked AS (
	SELECT
		"id",
		row_number() OVER (
			PARTITION BY lower(btrim("name"))
			ORDER BY "created_at" ASC, "id" ASC
		) AS "position"
	FROM "service"
	WHERE "active" = true
)
UPDATE "service"
SET "active" = false,
	"updated_at" = now()
FROM ranked
WHERE "service"."id" = ranked."id"
	AND ranked."position" > 1;--> statement-breakpoint
DROP INDEX IF EXISTS "service_professional_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "service_active_name_unique" ON "service" USING btree (lower(btrim("name"))) WHERE "service"."active";