-- Migration: notificacoes de alerta (sininho e toast ao vivo)
--   Os alertas continuam calculados ao vivo. O que se grava e a memoria do
--   ultimo estado de cada sujeito — sem ela nao ha como saber que algo "entrou"
--   em alerta — e as notificacoes que as transicoes geraram. Ver ADR 0011.

CREATE TYPE "alert_kind" AS ENUM ('reposicao', 'abastecimento_full', 'fora_do_full');
CREATE TYPE "alert_severity" AS ENUM ('critico', 'atencao');
CREATE TYPE "alert_transition" AS ENUM ('entrou', 'piorou');

-- Uma linha so. Existir e o que diz que a linha de base ja foi gravada: a
-- primeira avaliacao registra o estado sem notificar o que ja estava em alerta.
CREATE TABLE "alert_monitor" (
  "id" integer PRIMARY KEY NOT NULL,
  "baseline_at" timestamp NOT NULL,
  "last_evaluated_at" timestamp NOT NULL
);

CREATE TABLE "alert_states" (
  "subject_key" text PRIMARY KEY NOT NULL,
  "kind" "alert_kind" NOT NULL,
  -- Nulo em fora_do_full, que nao tem gravidade.
  "severity" "alert_severity",
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "alert_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subject_key" text NOT NULL,
  "kind" "alert_kind" NOT NULL,
  "transition" "alert_transition" NOT NULL,
  "severity" "alert_severity",
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  -- Daqui para baixo, congelado no momento da transicao: e o registro de um
  -- evento. Os numeros atuais ficam na pagina do alerta.
  "sku" text NOT NULL,
  "stock_id" uuid,
  "stock_title" text,
  "store_id" uuid,
  "store_name" text,
  "marketplace" "marketplace",
  "physical_stock_qty" integer,
  "units_30d" integer,
  "days_of_autonomy" double precision,
  "lead_time_days" integer,
  "account_units" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "read_at" timestamp,
  "resolved_at" timestamp
);

-- Resolver procura as notificacoes em aberto de um sujeito; listar ordena por data.
CREATE INDEX IF NOT EXISTS "alert_notifications_subject_key_idx"
  ON "alert_notifications" ("subject_key");
CREATE INDEX IF NOT EXISTS "alert_notifications_created_at_idx"
  ON "alert_notifications" ("created_at");
