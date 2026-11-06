-- Migration 0004: Cria o banco do zero para modelo single-owner
-- Remove todas as dependências de professional/partner

-- Types
CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE "public"."appointment_origin" AS ENUM('client', 'staff');

-- Tabela user (a dona do salão)
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela session
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL UNIQUE,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action
);

-- Tabela account
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action
);

-- Tabela verification
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

/* -------------------------------------------------------------------------- */
/*  Domínio - Single Owner                                                   */
/* -------------------------------------------------------------------------- */

/** Cliente do salão — única por telefone. */
CREATE TABLE "client" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

/** Serviço — pertence à dona do salão (sem professionalId). */
CREATE TABLE "service" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"duration_min" integer NOT NULL,
	"buffer_min" integer DEFAULT 0 NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	UNIQUE(lower(btrim("name"))) WHERE "active"
);

/** Jornada da dona do salão - dias da semana com horário de trabalho. */
CREATE TABLE "working_hours" (
	"id" text PRIMARY KEY NOT NULL,
	"weekday" integer NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

/** Bloqueio pontual ou recorrente (ex.: `weekly`) da dona do salão. */
CREATE TABLE "time_block" (
	"id" text PRIMARY KEY NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"reason" text,
	"recurrence" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

/** Agendamento público (cliente) ou de staff. */
CREATE TABLE "appointment" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"service_id" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"origin" "appointment_origin" DEFAULT 'client' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointment_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE restrict ON UPDATE no action,
	CONSTRAINT "appointment_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE restrict ON UPDATE no action
);

/* -------------------------------------------------------------------------- */
/*  Auditoria                                                               */
/* -------------------------------------------------------------------------- */

CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"user_id" text REFERENCES "user"("id") ON DELETE set null ON UPDATE no action,
	"user_email" text,
	"metadata" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

/* -------------------------------------------------------------------------- */
/*  Índices                                                                 */
/* -------------------------------------------------------------------------- */

CREATE INDEX "user_email_idx" ON "user"("email");
CREATE INDEX "client_phone_idx" ON "client"("phone");
CREATE INDEX "service_name_idx" ON "service"("name");
CREATE INDEX "appointment_client_idx" ON "appointment"("client_id");
CREATE INDEX "appointment_service_starts_idx" ON "appointment"("service_id", "starts_at");
CREATE INDEX "appointment_origin_idx" ON "appointment"("origin");
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");
CREATE INDEX "audit_log_entity_idx" ON "audit_log"("entity");
CREATE INDEX "audit_log_created_idx" ON "audit_log"("created_at");
