-- Migration: Alerta de Abastecimento do Full
--   1. marketplace nos estoques full (ML Full x Amazon FBA x Shopee)
--   2. ciclo de vida do Envio: rascunho -> em_transito -> recebido
--   3. indices para reconstrucao da timeline de estoque

CREATE TYPE "marketplace" AS ENUM ('mercado_livre', 'amazon', 'shopee');

ALTER TABLE "stocks" ADD COLUMN "marketplace" "marketplace";

-- Backfill: estoques full com "FBA" no nome sao Amazon; os demais full sao ML Full.
-- Estoque fisico permanece NULL. Ajustavel na tela de edicao do produto.
UPDATE "stocks" SET "marketplace" = 'amazon'
  WHERE "full" = true AND "title" ILIKE '%fba%';

UPDATE "stocks" SET "marketplace" = 'mercado_livre'
  WHERE "full" = true AND "marketplace" IS NULL;

-- Novo ciclo de vida. Envios ja confirmados creditaram o destino no ato,
-- entao equivalem ao estado "recebido".
ALTER TABLE "shipments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "shipments" ALTER COLUMN "status" TYPE text;

DROP TYPE "shipment_status";
CREATE TYPE "shipment_status" AS ENUM ('rascunho', 'em_transito', 'recebido');

UPDATE "shipments" SET "status" = 'recebido' WHERE "status" = 'confirmado';

ALTER TABLE "shipments" ALTER COLUMN "status" TYPE "shipment_status"
  USING "status"::"shipment_status";
ALTER TABLE "shipments" ALTER COLUMN "status" SET DEFAULT 'rascunho';

-- A reconstrucao da timeline varre 90 dias de vendas e lancamentos por estoque.
CREATE INDEX IF NOT EXISTS "sales_stock_id_sale_date_idx"
  ON "sales" ("stock_id", "sale_date");

CREATE INDEX IF NOT EXISTS "stock_entries_stock_id_created_at_idx"
  ON "stock_entries" ("stock_id", "created_at");

CREATE INDEX IF NOT EXISTS "shipment_items_destination_stock_id_idx"
  ON "shipment_items" ("destination_stock_id");
