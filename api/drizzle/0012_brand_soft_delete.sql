-- Migration: Add deleted_at column to brands for soft delete
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
