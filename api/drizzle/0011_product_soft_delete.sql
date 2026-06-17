-- Migration: Add deleted_at column to products for soft delete
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
