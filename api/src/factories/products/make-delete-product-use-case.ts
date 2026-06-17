import { DrizzleProductRepository } from "../../repositories/drizzle/drizzle-product-repository.js"
import { DeleteProductUseCase } from "../../use-cases/products/delete-product.js"

export function makeDeleteProductUseCase() {
	return new DeleteProductUseCase(new DrizzleProductRepository())
}
