-- Custom SQL migration file, put your code below! --
ALTER TABLE "products" ADD COLUMN "technical_title" text;
ALTER TABLE "products" ADD COLUMN "technical_subtitle" text;
ALTER TABLE "products" ADD COLUMN "technical_analysis" text;
ALTER TABLE "products" ADD COLUMN "technical_movement" text;
ALTER TABLE "products" ADD COLUMN "technical_case_and_crystal" text;
ALTER TABLE "products" ADD COLUMN "technical_specific_functionality" text;
ALTER TABLE "products" ADD COLUMN "technical_dial_and_luminosity" text;
ALTER TABLE "products" ADD COLUMN "technical_bracelet_construction" text;
ALTER TABLE "products" ADD COLUMN "technical_table" text;
