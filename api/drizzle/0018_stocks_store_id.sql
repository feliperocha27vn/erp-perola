-- Migration: liga cada deposito full a conta de venda (Abastecimento do Full)
--   Ate aqui a loja so existia na venda (sales.store_id) e o deposito so no
--   estoque (stocks). Sem a aresta entre os dois, a demanda de uma conta era
--   invisivel para o full daquela mesma conta: uma venda da Laurinda no Mercado
--   Livre despachada do Galpao contava como venda do Galpao, e o full da
--   Laurinda parecia nao ter demanda nenhuma. Ver ADR 0009.
--
--   Fica nulo nos depositos proprios de proposito: o Galpao atende todas as
--   contas, entao nao pertence a nenhuma.

ALTER TABLE "stocks" ADD COLUMN "store_id" uuid REFERENCES "stores"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "stocks_store_id_idx" ON "stocks" ("store_id");

-- Backfill 1: pelo titulo, que e como a conta ja aparece hoje ("Full Laurinda").
-- Nome mais longo primeiro, para um nome que e prefixo de outro nao vencer.
UPDATE "stocks" s
SET "store_id" = m.store_id
FROM (
  SELECT DISTINCT ON (st.id) st.id AS stock_id, o.id AS store_id
  FROM "stocks" st
  JOIN "stores" o ON st.title ILIKE '%' || o.name || '%'
  WHERE st."full" = true
  ORDER BY st.id, length(o.name) DESC
) m
WHERE s.id = m.stock_id AND s."store_id" IS NULL;

-- Backfill 2: pela conta que mais vendeu daquele deposito. Cobre o full cujo
-- titulo nao carrega o nome da conta.
UPDATE "stocks" s
SET "store_id" = m.store_id
FROM (
  SELECT DISTINCT ON (t.stock_id) t.stock_id, t.store_id
  FROM (
    SELECT sa.stock_id AS stock_id, sa.store_id AS store_id, SUM(sa.quantity) AS units
    FROM "sales" sa
    JOIN "stocks" st ON st.id = sa.stock_id
    WHERE st."full" = true AND sa.store_id IS NOT NULL
    GROUP BY sa.stock_id, sa.store_id
  ) t
  ORDER BY t.stock_id, t.units DESC
) m
WHERE s.id = m.stock_id AND s."store_id" IS NULL;
