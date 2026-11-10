-- Bloqueio de cliente: impede novos agendamentos, preserva o histórico.
ALTER TABLE "client" ADD COLUMN "blocked" boolean DEFAULT false NOT NULL;
