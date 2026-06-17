import { describe, expect, it } from "vitest"
import { ProductNotFoundError } from "../../errors/product-not-found-error.js"
import { DeleteProductUseCase } from "./delete-product.js"

class FakeProductRepository {
	private products = new Map<string, { id: string; sku: string; deleted_at: Date | null }>([
		["prod-1", { id: "prod-1", sku: "SKU-001", deleted_at: null }],
		["prod-2", { id: "prod-2", sku: "SKU-002", deleted_at: null }],
	])

	async delete(id: string): Promise<boolean> {
		const product = this.products.get(id)
		if (!product || product.deleted_at !== null) return false
		product.deleted_at = new Date()
		return true
	}

	isDeleted(id: string) {
		return this.products.get(id)?.deleted_at !== null
	}
}

describe("DeleteProductUseCase", () => {
	it("faz soft delete em produto existente", async () => {
		const repo = new FakeProductRepository()
		const useCase = new DeleteProductUseCase(repo as any)

		await useCase.execute({ productId: "prod-1" })

		expect(repo.isDeleted("prod-1")).toBe(true)
	})

	it("lança ProductNotFoundError para produto inexistente", async () => {
		const repo = new FakeProductRepository()
		const useCase = new DeleteProductUseCase(repo as any)

		await expect(
			useCase.execute({ productId: "nao-existe" }),
		).rejects.toBeInstanceOf(ProductNotFoundError)
	})

	it("não afeta outros produtos ao excluir", async () => {
		const repo = new FakeProductRepository()
		const useCase = new DeleteProductUseCase(repo as any)

		await useCase.execute({ productId: "prod-1" })

		expect(repo.isDeleted("prod-2")).toBe(false)
	})
})
