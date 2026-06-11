CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"updated_at" timestamp NOT NULL DEFAULT now(),
	CONSTRAINT "stores_name_unique" UNIQUE("name")
);

ALTER TABLE "sales" ADD COLUMN "store_id" uuid REFERENCES "stores"("id") ON DELETE SET NULL;

INSERT INTO "stores" ("name", "updated_at") VALUES
	('Lilian', now()),
	('Santo', now()),
	('Laurinda', now());
