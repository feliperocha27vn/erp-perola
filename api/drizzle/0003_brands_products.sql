CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brands_name_unique" UNIQUE("name")
);

ALTER TABLE "products" ADD COLUMN "brand_id" uuid;

INSERT INTO "brands" ("name")
SELECT DISTINCT "marca"
FROM "products"
WHERE "marca" IS NOT NULL;

UPDATE "products"
SET "brand_id" = "brands"."id"
FROM "brands"
WHERE "products"."marca" = "brands"."name";

ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "products" DROP COLUMN "marca";
