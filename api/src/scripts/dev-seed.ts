/**
 * Seed de desenvolvimento local — popula o banco com dados de teste realistas.
 * Limpa e recria: stores, brands, products, stocks, sales.
 * Não apaga usuários existentes; cria dev@perola.local se não existir.
 *
 * Uso: pnpm run seed:dev
 */
import { eq, sql } from "drizzle-orm"
import { auth } from "../auth.js"
import { db } from "../db/connection.js"
import {
	brands,
	products,
	sales,
	stocks,
	stores,
	user,
} from "../db/schema.js"

const DEV_EMAIL = "dev@perola.local"
const DEV_PASSWORD = "Perola@Dev2024!"
const DEV_NAME = "Dev Local"

// ─── helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
	const d = new Date()
	d.setDate(d.getDate() - n)
	return d
}

function pick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)]
}

// ─── dados base ───────────────────────────────────────────────────────────────

const STORES_DATA = ["Lilian", "Santo", "Laurinda"]

const BRANDS_DATA = ["ORIENT", "MONDAINE", "LINCE"]

type ProductDef = {
	sku: string
	ean: string
	brandKey: string | null
	sale_price_cents: number
	stocks: { title: string; qtde: number; full: boolean }[]
}

const PRODUCTS_DATA: ProductDef[] = [
	// ── ORIENT (5 produtos) ──────────────────────────────────────────────────
	{
		sku: "OR-RA-AA0001L09B",
		ean: "4906567900010",
		brandKey: "ORIENT",
		sale_price_cents: 89900,
		stocks: [
			{ title: "Galpão", qtde: 12, full: false },
			{ title: "Loja Centro", qtde: 3, full: false },
			{ title: "Amazon FBA", qtde: 5, full: true },
		],
	},
	{
		sku: "OR-RA-AA0002L09B",
		ean: "4906567900027",
		brandKey: "ORIENT",
		sale_price_cents: 79900,
		stocks: [
			{ title: "Galpão", qtde: 8, full: false },
			{ title: "Loja Centro", qtde: 2, full: false },
		],
	},
	{
		sku: "OR-EM65-L0DJ",
		ean: "4906567900034",
		brandKey: "ORIENT",
		sale_price_cents: 149900,
		stocks: [
			{ title: "Galpão", qtde: 6, full: false },
			{ title: "Amazon FBA", qtde: 4, full: true },
			{ title: "ML Full", qtde: 3, full: true },
		],
	},
	{
		sku: "OR-EM7B-L0DJ",
		ean: "4906567900041",
		brandKey: "ORIENT",
		sale_price_cents: 134900,
		stocks: [
			{ title: "Galpão", qtde: 0, full: false },
			{ title: "Loja Centro", qtde: 1, full: false },
		],
	},
	{
		sku: "OR-FUG0-003B",
		ean: "4906567900058",
		brandKey: "ORIENT",
		sale_price_cents: 199900,
		stocks: [{ title: "Galpão", qtde: 4, full: false }],
	},

	// ── MONDAINE (4 produtos) ────────────────────────────────────────────────
	{
		sku: "MON-32201MPMVBE3",
		ean: "7893583100011",
		brandKey: "MONDAINE",
		sale_price_cents: 34900,
		stocks: [
			{ title: "Galpão", qtde: 20, full: false },
			{ title: "Loja Centro", qtde: 5, full: false },
			{ title: "ML Full", qtde: 8, full: true },
		],
	},
	{
		sku: "MON-53745LPMVBE1",
		ean: "7893583100028",
		brandKey: "MONDAINE",
		sale_price_cents: 42900,
		stocks: [
			{ title: "Galpão", qtde: 15, full: false },
			{ title: "Amazon FBA", qtde: 6, full: true },
		],
	},
	{
		sku: "MON-94951LPMVBE1",
		ean: "7893583100035",
		brandKey: "MONDAINE",
		sale_price_cents: 38900,
		stocks: [
			{ title: "Galpão", qtde: 7, full: false },
			{ title: "Loja Centro", qtde: 0, full: false },
		],
	},
	{
		sku: "MON-00055GPMVBA8",
		ean: "7893583100042",
		brandKey: "MONDAINE",
		sale_price_cents: 28900,
		stocks: [{ title: "Galpão", qtde: 30, full: false }],
	},

	// ── LINCE (3 produtos) ───────────────────────────────────────────────────
	{
		sku: "LIN-LRG4561L",
		ean: "7897530100011",
		brandKey: "LINCE",
		sale_price_cents: 24900,
		stocks: [
			{ title: "Galpão", qtde: 18, full: false },
			{ title: "Loja Centro", qtde: 4, full: false },
		],
	},
	{
		sku: "LIN-LRC4750L",
		ean: "7897530100028",
		brandKey: "LINCE",
		sale_price_cents: 19900,
		stocks: [
			{ title: "Galpão", qtde: 25, full: false },
			{ title: "ML Full", qtde: 10, full: true },
		],
	},
	{
		sku: "LIN-LRM4480L",
		ean: "7897530100035",
		brandKey: "LINCE",
		sale_price_cents: 22900,
		stocks: [{ title: "Galpão", qtde: 9, full: false }],
	},

	// ── ORIENT extra (6-10) ──────────────────────────────────────────────────
	{
		sku: "OR-SP100J1-C3A0",
		ean: "4906567900065",
		brandKey: "ORIENT",
		sale_price_cents: 119900,
		stocks: [
			{ title: "Galpão", qtde: 7, full: false },
			{ title: "Amazon FBA", qtde: 3, full: true },
		],
	},
	{
		sku: "OR-RA-KA0001B09B",
		ean: "4906567900072",
		brandKey: "ORIENT",
		sale_price_cents: 95900,
		stocks: [{ title: "Galpão", qtde: 11, full: false }],
	},
	{
		sku: "OR-EM7A-L0DJ",
		ean: "4906567900089",
		brandKey: "ORIENT",
		sale_price_cents: 139900,
		stocks: [
			{ title: "Galpão", qtde: 2, full: false },
			{ title: "ML Full", qtde: 5, full: true },
		],
	},
	{
		sku: "OR-FUG2-004B",
		ean: "4906567900096",
		brandKey: "ORIENT",
		sale_price_cents: 189900,
		stocks: [{ title: "Galpão", qtde: 3, full: false }],
	},
	{
		sku: "OR-RA-AC0M01B",
		ean: "4906567900102",
		brandKey: "ORIENT",
		sale_price_cents: 109900,
		stocks: [
			{ title: "Galpão", qtde: 9, full: false },
			{ title: "Loja Centro", qtde: 1, full: false },
		],
	},

	// ── MONDAINE extra (5-8) ─────────────────────────────────────────────────
	{
		sku: "MON-76716LPMVBE2",
		ean: "7893583100059",
		brandKey: "MONDAINE",
		sale_price_cents: 36900,
		stocks: [
			{ title: "Galpão", qtde: 14, full: false },
			{ title: "Loja Centro", qtde: 3, full: false },
		],
	},
	{
		sku: "MON-12234MPMVBA1",
		ean: "7893583100066",
		brandKey: "MONDAINE",
		sale_price_cents: 31900,
		stocks: [{ title: "Galpão", qtde: 22, full: false }],
	},
	{
		sku: "MON-53001LPMVBE1",
		ean: "7893583100073",
		brandKey: "MONDAINE",
		sale_price_cents: 44900,
		stocks: [
			{ title: "Amazon FBA", qtde: 8, full: true },
			{ title: "ML Full", qtde: 4, full: true },
		],
	},
	{
		sku: "MON-76002GPMVBA5",
		ean: "7893583100080",
		brandKey: "MONDAINE",
		sale_price_cents: 27900,
		stocks: [{ title: "Galpão", qtde: 17, full: false }],
	},

	// ── LINCE extra (4-6) ────────────────────────────────────────────────────
	{
		sku: "LIN-LRG5001L",
		ean: "7897530100042",
		brandKey: "LINCE",
		sale_price_cents: 26900,
		stocks: [
			{ title: "Galpão", qtde: 10, full: false },
			{ title: "Loja Centro", qtde: 2, full: false },
		],
	},
	{
		sku: "LIN-LRM5200L",
		ean: "7897530100059",
		brandKey: "LINCE",
		sale_price_cents: 21900,
		stocks: [{ title: "Galpão", qtde: 6, full: false }],
	},
	{
		sku: "LIN-LRC6100L",
		ean: "7897530100066",
		brandKey: "LINCE",
		sale_price_cents: 23900,
		stocks: [
			{ title: "Galpão", qtde: 13, full: false },
			{ title: "ML Full", qtde: 7, full: true },
		],
	},

	// ── Sem marca (2 produtos) ───────────────────────────────────────────────
	{
		sku: "GEN-RELOGIO-001",
		ean: "0000000000001",
		brandKey: null,
		sale_price_cents: 15900,
		stocks: [
			{ title: "Galpão", qtde: 5, full: false },
			{ title: "Loja Centro", qtde: 2, full: false },
		],
	},
	{
		sku: "GEN-RELOGIO-002",
		ean: "0000000000002",
		brandKey: null,
		sale_price_cents: 12900,
		stocks: [{ title: "Galpão", qtde: 3, full: false }],
	},
	{
		sku: "GEN-RELOGIO-003",
		ean: "0000000000003",
		brandKey: null,
		sale_price_cents: 18900,
		stocks: [{ title: "Galpão", qtde: 8, full: false }],
	},
	{
		sku: "GEN-RELOGIO-004",
		ean: "0000000000004",
		brandKey: null,
		sale_price_cents: 11900,
		stocks: [
			{ title: "Galpão", qtde: 2, full: false },
			{ title: "Loja Centro", qtde: 1, full: false },
		],
	},
]

const CHANNELS = ["Amazon", "Mercado Livre", "Shopee", "Direto"] as const

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
	console.log("🌱 Iniciando seed de desenvolvimento...\n")

	// 1. Criar usuário de teste (se não existir)
	const [existingUser] = await db
		.select()
		.from(user)
		.where(eq(user.email, DEV_EMAIL))

	if (existingUser) {
		console.log(`✓ Usuário de teste já existe: ${DEV_EMAIL}`)
	} else {
		await auth.api.signUpEmail({
			body: { email: DEV_EMAIL, password: DEV_PASSWORD, name: DEV_NAME },
		})
		console.log(`✓ Usuário de teste criado: ${DEV_EMAIL}`)
	}

	// 2. Limpar dados na ordem correta (FK constraints)
	console.log("\n🗑  Limpando dados existentes...")
	await db.delete(sales)
	await db.delete(stocks)
	await db.delete(products)
	await db.delete(brands)
	await db.delete(stores)
	console.log("   sales, stocks, products, brands, stores → limpos")

	// 3. Criar lojas
	console.log("\n🏪 Criando lojas...")
	const storeRows = await db
		.insert(stores)
		.values(STORES_DATA.map((name) => ({ name, updated_at: new Date() })))
		.returning()
	console.log(`   ${storeRows.length} lojas criadas: ${STORES_DATA.join(", ")}`)

	// 4. Criar marcas
	console.log("\n🏷  Criando marcas...")
	const brandRows = await db
		.insert(brands)
		.values(BRANDS_DATA.map((name) => ({ name, updated_at: new Date() })))
		.returning()
	const brandMap = new Map(brandRows.map((b) => [b.name, b.id]))
	console.log(`   ${brandRows.length} marcas criadas: ${BRANDS_DATA.join(", ")}`)

	// 5. Criar produtos, estoques e vendas
	console.log("\n📦 Criando produtos, estoques e vendas...")

	for (const def of PRODUCTS_DATA) {
		const brandId = def.brandKey ? (brandMap.get(def.brandKey) ?? null) : null

		const [product] = await db
			.insert(products)
			.values({
				sku: def.sku,
				ean: def.ean,
				brand_id: brandId,
				sale_price_cents: def.sale_price_cents,
				updated_at: new Date(),
			})
			.returning()

		// Estoques
		const stockRows = await db
			.insert(stocks)
			.values(
				def.stocks.map((s) => ({
					product_id: product.id,
					title: s.title,
					qtde: s.qtde,
					full: s.full,
					updated_at: new Date(),
				})),
			)
			.returning()

		// 4 vendas por produto, nos últimos 60 dias
		const salesValues = Array.from({ length: 4 }).map((_, i) => {
			const stock = pick(stockRows)
			const quantity = Math.floor(Math.random() * 3) + 1
			const sale_price = def.sale_price_cents - Math.floor(Math.random() * 5000)
			const store = pick(storeRows)

			return {
				product_id: product.id,
				stock_id: stock.id,
				store_id: store.id,
				quantity,
				sale_price,
				total_price: sale_price * quantity,
				channel: pick([...CHANNELS]),
				sale_date: daysAgo(i * 12 + Math.floor(Math.random() * 10)),
				updated_at: new Date(),
			}
		})

		// Inserir vendas sem mexer no estoque (é seed, não fluxo real)
		await db.insert(sales).values(salesValues)

		console.log(
			`   ✓ ${def.sku} | ${def.stocks.length} estoques | 4 vendas`,
		)
	}

	// 6. Resumo
	const [{ total_products }] = await db
		.select({ total_products: sql<number>`count(*)` })
		.from(products)
	const [{ total_stocks }] = await db
		.select({ total_stocks: sql<number>`count(*)` })
		.from(stocks)
	const [{ total_sales }] = await db
		.select({ total_sales: sql<number>`count(*)` })
		.from(sales)

	console.log(`
✅ Seed concluído!
   Usuário  : ${DEV_EMAIL}
   Produtos : ${total_products}
   Estoques : ${total_stocks}
   Vendas   : ${total_sales}
   Lojas    : ${storeRows.length}
   Marcas   : ${brandRows.length}
`)
}

main().catch((err) => {
	console.error("Erro no seed:", err)
	process.exit(1)
})
