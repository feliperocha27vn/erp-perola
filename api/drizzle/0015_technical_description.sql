-- Custom SQL migration file, put your code below! --
ALTER TABLE "products" ADD COLUMN "technical_description" text;

UPDATE "products" SET "technical_description" = NULLIF(
	concat_ws(E'\n\n',
		CASE WHEN technical_subtitle IS NOT NULL AND technical_subtitle <> '' THEN '## Subtítulo' || E'\n' || technical_subtitle END,
		CASE WHEN technical_analysis IS NOT NULL AND technical_analysis <> '' THEN '## Análise Técnica' || E'\n' || technical_analysis END,
		CASE WHEN technical_movement IS NOT NULL AND technical_movement <> '' THEN '## Movimento' || E'\n' || technical_movement END,
		CASE WHEN technical_case_and_crystal IS NOT NULL AND technical_case_and_crystal <> '' THEN '## Caixa e Cristal' || E'\n' || technical_case_and_crystal END,
		CASE WHEN technical_specific_functionality IS NOT NULL AND technical_specific_functionality <> '' THEN '## Funcionalidade Específica' || E'\n' || technical_specific_functionality END,
		CASE WHEN technical_dial_and_luminosity IS NOT NULL AND technical_dial_and_luminosity <> '' THEN '## Mostrador e Luminosidade' || E'\n' || technical_dial_and_luminosity END,
		CASE WHEN technical_bracelet_construction IS NOT NULL AND technical_bracelet_construction <> '' THEN '## Construção da Pulseira' || E'\n' || technical_bracelet_construction END,
		CASE WHEN technical_table IS NOT NULL AND technical_table <> '' THEN '## Tabela Técnica' || E'\n' || technical_table END
	),
	''
);

ALTER TABLE "products" DROP COLUMN "technical_subtitle";
ALTER TABLE "products" DROP COLUMN "technical_analysis";
ALTER TABLE "products" DROP COLUMN "technical_movement";
ALTER TABLE "products" DROP COLUMN "technical_case_and_crystal";
ALTER TABLE "products" DROP COLUMN "technical_specific_functionality";
ALTER TABLE "products" DROP COLUMN "technical_dial_and_luminosity";
ALTER TABLE "products" DROP COLUMN "technical_bracelet_construction";
ALTER TABLE "products" DROP COLUMN "technical_table";
