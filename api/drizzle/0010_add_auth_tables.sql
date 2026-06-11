-- Migration: Add better-auth tables (user, session, account, verification)
CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "session" ADD CONSTRAINT "session_token_unique" UNIQUE ("token");
ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE ("email");

CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("user_id");
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("user_id");