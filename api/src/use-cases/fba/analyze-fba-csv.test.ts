import { describe, expect, it, vi } from "vitest"
import type { ProductRepository } from "../../repositories/product-repository.js"
import { AnalyzeFbaCsvUseCase } from "./analyze-fba-csv.js"
import type { FbaAnalysisItemBase, FbaGeminiRecommendation } from "./fba-types.js"

class FakeProductRepository implements ProductRepository {
	constructor(private products: Awaited<ReturnType<ProductRepository["getBySkus"]>>) {}

	async fetchProducts() {
		return { items: [], total: 0, pageIndex: 0 }
	}

	async getProductById() {
		return null
	}

	async getBySkus() {
		return this.products
	}

	async getBySku() {
		return null
	}

	async getByEan() {
		return null
	}

	async countByBrandId() {
		return 0
	}

	async create() {
		if (this.products.length === 0) {
			throw new Error("not implemented")
		}

		return this.products[0]
	}

	async update() {
		return null
	}

	async updateProductImage() {
		return null
	}

	async fetchSalesVelocity() {
		return []
	}

	async fetchProductSalesDaily() {
		return []
	}
}

class FakeGeminiClient {
	constructor(private recommendations: FbaGeminiRecommendation[]) {}

	async recommend(_items: FbaAnalysisItemBase[]) {
		return this.recommendations
	}
}

class ThrowingGeminiClient {
	async recommend(): Promise<FbaGeminiRecommendation[]> {
		throw new Error("Gemini temporary failure")
	}
}

const csvContent = `ASIN (parent),ASIN (child),Título,Código SKU,Sessões - Total,Porcentagem de sessões – Total,Visualizações da página - Total,Porcentagem de visualizações de páginas – Total,Porcentagem de Ofertas em destaque,Unidades pedidas,Porcentagem de sessão de unidade,Vendas de produtos pedidos,Total de itens do pedido
B0A,B0A,Produto A,SKU-1,100,1.1%,200,2.2%,99.1%,9,1.7%,"R$ 1.000,00",9
B0B,B0B,Produto B,SKU-2,100,1.1%,200,2.2%,99.1%,6,1.1%,"R$ 500,00",6
`

describe("AnalyzeFbaCsvUseCase", () => {
	it("builds items and pending list using SKU matching and physical stock", async () => {
		const repo = new FakeProductRepository([
			{
				id: "1",
				sku: "SKU-1",
				ean: "EAN-1",
				sale_price_cents: null,
				brand_id: null,
				brand: null,
				url_image: null,
				technical_title: null,
				technical_subtitle: null,
				technical_analysis: null,
				technical_movement: null,
				technical_case_and_crystal: null,
				technical_specific_functionality: null,
				technical_dial_and_luminosity: null,
				technical_bracelet_construction: null,
				technical_table: null,
				stocks: [
					{
						id: "s1",
						product_id: "1",
						title: "Físico",
						qtde: 8,
						full: false,
						created_at: new Date(),
						updated_at: new Date(),
					},
				],
				created_at: new Date(),
				updated_at: new Date(),
			},
		])

		const gemini = new FakeGeminiClient([
			{
				sku: "SKU-1",
				recommended_send_quantity: 6,
				keep_in_physical_stock: 2,
				confidence: "high",
				decision_tags: ["high_conversion"],
				reason: "Boa conversao e vendas consistentes.",
			},
		])

		const useCase = new AnalyzeFbaCsvUseCase(repo, gemini)
		const result = await useCase.execute({ csvContent })

		expect(result.items).toHaveLength(1)
		expect(result.items[0].sku).toBe("SKU-1")
		expect(result.items[0].recommended_send_quantity).toBe(6)
		expect(result.items[0].confidence).toBe("high")
		expect(result.items[0].analysis_source).toBe("gemini")
		expect(result.pending_items).toHaveLength(1)
		expect(result.pending_items[0].reason).toBe("sku_not_found")
		expect(result.summary.analysis_source).toBe("gemini")
	})

	it("logs Gemini failures before returning fallback recommendations", async () => {
		const repo = new FakeProductRepository([
			{
				id: "1",
				sku: "SKU-1",
				ean: "EAN-1",
				sale_price_cents: null,
				brand_id: null,
				brand: null,
				url_image: null,
				technical_title: null,
				technical_subtitle: null,
				technical_analysis: null,
				technical_movement: null,
				technical_case_and_crystal: null,
				technical_specific_functionality: null,
				technical_dial_and_luminosity: null,
				technical_bracelet_construction: null,
				technical_table: null,
				stocks: [
					{
						id: "s1",
						product_id: "1",
						title: "Físico",
						qtde: 8,
						full: false,
						created_at: new Date(),
						updated_at: new Date(),
					},
				],
				created_at: new Date(),
				updated_at: new Date(),
			},
		])
		const logger = { warn: vi.fn() }

		const useCase = new AnalyzeFbaCsvUseCase(repo, new ThrowingGeminiClient(), logger)
		const result = await useCase.execute({ csvContent })

		expect(result.items[0].analysis_source).toBe("fallback")
		expect(result.summary.analysis_source).toBe("fallback")
		expect(logger.warn).toHaveBeenCalledWith(
			"Gemini recommendation failed; using fallback.",
			expect.any(Error),
		)
	})
})
