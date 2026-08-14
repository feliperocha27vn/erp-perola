-- Migration: cache da leitura de mercado por produto (Abastecimento do Full)
--   Uma linha por produto. A analise custa uma chamada com busca na web e muda
--   devagar; os numeros do relatorio, que mudam todo dia, nunca saem daqui.
--   Ver ADR 0008.

CREATE TYPE "insight_verdict" AS ENUM ('antecipar', 'manter', 'segurar');

CREATE TABLE "product_insights" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL UNIQUE REFERENCES "products"("id") ON DELETE CASCADE,
  "verdict" "insight_verdict" NOT NULL,
  -- Centesimos: 140 = 1,40x. Proposta, nunca aplicada sozinha.
  "seasonal_factor" integer NOT NULL,
  "identity" text NOT NULL,
  "rationale" text NOT NULL,
  "critique" text,
  "sources" jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- false quando a busca na web nao estava disponivel (cota) e o parecer saiu
  -- so do conhecimento do modelo. A tela precisa dizer isso.
  "grounded" boolean NOT NULL DEFAULT true,
  -- Numeros da linha quando a analise foi feita, para a tela saber se envelheceu.
  "context_snapshot" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "model" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- A origem do envio tambem e consultada por rascunho em aberto, para o mesmo
-- saldo fisico nao ser oferecido duas vezes.
CREATE INDEX IF NOT EXISTS "shipment_items_source_stock_id_idx"
  ON "shipment_items" ("source_stock_id");
