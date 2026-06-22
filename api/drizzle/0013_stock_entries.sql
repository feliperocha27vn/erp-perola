-- Migration: Add stock_entries table for tracking stock replenishments
CREATE TABLE "stock_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "stock_id" uuid NOT NULL REFERENCES "stocks"("id") ON DELETE CASCADE,
  "quantity" integer NOT NULL,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
