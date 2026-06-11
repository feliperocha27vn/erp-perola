import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { and, eq } from "drizzle-orm"
import { db } from "./connection.js"
import { brands, products } from "./schema.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type CsvRow = {
	sku: string
	ean: string
	url_image: string | null
	brand_id: string
}

function parseCsvLine(line: string): CsvRow {
	const parts = line.split(",").map((part) => part.trim())
	const [sku, ean, url_image, brand_id] = parts

	if (!sku || !ean || !brand_id) {
		throw new Error(`Linha inválida no CSV: ${line}`)
	}

	return {
		sku,
		ean,
		url_image: url_image || null,
		brand_id,
	}
}

async function ensureBrandExists(brandId: string) {
	const [brand] = await db.select().from(brands).where(eq(brands.id, brandId))

	if (!brand) {
		throw new Error(`Brand não encontrada para brand_id=${brandId}`)
	}
}

async function upsertProduct(row: CsvRow) {
	const [existingByEan] = await db
		.select()
		.from(products)
		.where(eq(products.ean, row.ean))

	if (existingByEan) {
		await db
			.update(products)
			.set({
				sku: row.sku,
				url_image: row.url_image,
				brand_id: row.brand_id,
				updated_at: new Date(),
			})
			.where(eq(products.id, existingByEan.id))
		return
	}

	const [existingBySku] = await db
		.select()
		.from(products)
		.where(eq(products.sku, row.sku))

	if (existingBySku) {
		await db
			.update(products)
			.set({
				ean: row.ean,
				url_image: row.url_image,
				brand_id: row.brand_id,
				updated_at: new Date(),
			})
			.where(eq(products.id, existingBySku.id))
		return
	}

	const [existingSamePair] = await db
		.select()
		.from(products)
		.where(and(eq(products.sku, row.sku), eq(products.ean, row.ean)))

	if (existingSamePair) {
		await db
			.update(products)
			.set({
				url_image: row.url_image,
				brand_id: row.brand_id,
				updated_at: new Date(),
			})
			.where(eq(products.id, existingSamePair.id))
		return
	}

	await db.insert(products).values({
		sku: row.sku,
		ean: row.ean,
		url_image: row.url_image,
		brand_id: row.brand_id,
		updated_at: new Date(),
	})
}

async function seed() {
	const csvPath = path.join(__dirname, "products.csv")
	const csvContent = fs.readFileSync(csvPath, "utf-8")
	const lines = csvContent
		.trim()
		.split("\n")
		.filter((line) => line.trim().length > 0)

	if (lines.length <= 1) {
		console.log("Nenhuma linha para importar em products.csv")
		return
	}

	for (const line of lines.slice(1)) {
		const row = parseCsvLine(line)
		await ensureBrandExists(row.brand_id)
		await upsertProduct(row)
	}

	console.log(`Importação concluída: ${lines.length - 1} linha(s) processada(s).`)
}

seed()
	.catch((err) => {
		console.error("Erro no seed:", err)
		process.exit(1)
	})
	.finally(() => {
		process.exit(0)
	})
