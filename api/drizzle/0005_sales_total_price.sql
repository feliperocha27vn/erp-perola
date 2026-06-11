ALTER TABLE "sales" ADD COLUMN "total_price" integer DEFAULT 0 NOT NULL;
UPDATE "sales" SET "total_price" = "quantity" * "sale_price";
