DO $$ BEGIN
 CREATE TYPE "public"."sales_channel" AS ENUM('Amazon', 'Mercado Livre', 'Shopee', 'Direto');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
ALTER TABLE "sales" ADD COLUMN "channel" "sales_channel" DEFAULT 'Direto' NOT NULL;
