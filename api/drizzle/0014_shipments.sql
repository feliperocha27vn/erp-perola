-- Migration: Add shipment_accounts, shipments, and shipment_items tables for FBA shipment tracking
CREATE TYPE "shipment_status" AS ENUM ('rascunho', 'confirmado');

CREATE TABLE "shipment_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "shipments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "shipment_accounts"("id") ON DELETE RESTRICT,
  "date" timestamp NOT NULL,
  "notes" text,
  "status" "shipment_status" NOT NULL DEFAULT 'rascunho',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "shipment_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "shipment_id" uuid NOT NULL REFERENCES "shipments"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "quantity" integer NOT NULL,
  "source_stock_id" uuid NOT NULL REFERENCES "stocks"("id") ON DELETE RESTRICT,
  "destination_stock_id" uuid NOT NULL REFERENCES "stocks"("id") ON DELETE RESTRICT,
  "created_at" timestamp NOT NULL DEFAULT now()
);
