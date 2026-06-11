import { eq } from "drizzle-orm"
import { db } from "./connection.js"
import { products } from "./schema.js"

interface MercadoLivreSearchResponse {
	results: Array<{
		id: string
		title: string
		thumbnail: string
		price: number
		permalink: string
	}>
}

async function searchProductByEAN(ean: string): Promise<string | null> {
	try {
		// API pública do Mercado Livre - busca por EAN
		const url = `https://api.mercadolibre.com/sites/MLB/search?q=${ean}`
		const response = await fetch(url)

		if (!response.ok) {
			console.error(`❌ Erro na API ML para EAN ${ean}: ${response.status}`)
			return null
		}

		const data: MercadoLivreSearchResponse = await response.json()

		if (data.results && data.results.length > 0) {
			// Retorna a thumbnail do primeiro resultado
			return data.results[0].thumbnail.replace("-I.jpg", "-O.jpg") // Usa imagem original
		}

		return null
	} catch (error) {
		console.error(`❌ Erro ao buscar EAN ${ean}:`, error)
		return null
	}
}

async function fillProductImages() {
	try {
		console.log("🖼️  Iniciando busca de imagens...\n")

		// Buscar todos os produtos sem imagem
		const allProducts = await db.select().from(products)
		const productsWithoutImage = allProducts.filter((p) => !p.url_image)

		console.log(`📦 Total de produtos: ${allProducts.length}`)
		console.log(`🔍 Produtos sem imagem: ${productsWithoutImage.length}\n`)

		let updated = 0
		let notFound = 0

		for (const product of productsWithoutImage) {
			console.log(`🔎 Buscando ${product.sku} (EAN: ${product.ean})...`)

			const imageUrl = await searchProductByEAN(product.ean)

			if (imageUrl) {
				await db
					.update(products)
					.set({ url_image: imageUrl, updated_at: new Date() })
					.where(eq(products.id, product.id))

				console.log(`   ✅ Imagem encontrada: ${imageUrl}\n`)
				updated++
			} else {
				console.log(`   ⚠️  Imagem não encontrada\n`)
				notFound++
			}

			// Delay para não sobrecarregar a API (rate limiting)
			await new Promise((resolve) => setTimeout(resolve, 500))
		}

		console.log("\n" + "=".repeat(50))
		console.log(`✅ Processo concluído!`)
		console.log(`   Imagens encontradas: ${updated}`)
		console.log(`   Não encontradas: ${notFound}`)
		console.log(`   Total processado: ${productsWithoutImage.length}`)
		console.log("=".repeat(50))
	} catch (error) {
		console.error("❌ Erro no processo:", error)
		process.exit(1)
	} finally {
		process.exit(0)
	}
}

fillProductImages()
