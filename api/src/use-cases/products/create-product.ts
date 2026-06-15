import { BrandNotFoundError } from "../../errors/brand-not-found-error.js"
import { ProductAlreadyExistsError } from "../../errors/product-already-exists-error.js"
import type { BrandRepository } from "../../repositories/brand-repository.js"
import type {
	ProductRepository,
	ProductTechnicalDetailsInput,
} from "../../repositories/product-repository.js"

interface CreateProductUseCaseRequest {
	sku: string
	ean: string
	brand_id: string
	url_image?: string | null
}

function buildDefaultTechnicalDetails(
	brandName: string,
	sku: string,
	ean: string,
): ProductTechnicalDetailsInput {
	return {
		technical_title: `${brandName} ${sku} - Relogio com foco tecnico em materiais e construcao`,
		technical_subtitle:
			"Relogio com especificacoes tecnicas consolidadas para catalogo e analise comparativa.",
		technical_analysis:
			"Descreva aqui a engenharia do relogio, materiais da caixa/bezel/cristal e os beneficios praticos de cada escolha tecnica.",
		technical_movement: "Calibre nao informado.",
		technical_case_and_crystal: "Material da caixa e cristal nao informados.",
		technical_specific_functionality:
			"Funcao tecnica principal ou certificacao nao informada.",
		technical_dial_and_luminosity: "Mostrador e lumen nao informados.",
		technical_bracelet_construction: "Pulseira e fecho nao informados.",
		technical_table: `| Caracteristica | Detalhe |
| :--- | :--- |
| Referencia | ${sku} |
| EAN | ${ean} |
| Colecao | Nao informado |
| Movimento | Nao informado |
| Frequencia | Nao informado |
| Joias | Nao informado |
| Reserva de Marcha | Nao informado |
| Material da Caixa | Nao informado |
| Diametro da Caixa | Nao informado |
| Espessura da Caixa | Nao informado |
| Material do Bezel | Nao informado |
| Cristal | Nao informado |
| Lumen | Nao informado |
| Fundo da Caixa | Nao informado |
| Pulseira | Nao informado |
| Tipo de Fecho | Nao informado |
| Resistencia a Agua | Nao informado |
| Funcoes | Nao informado |
| Certificacoes | Nao informado |`,
	}
}

interface CreateProductUseCaseResponse {
	product: {
		id: string
		sku: string
		ean: string
		sale_price_cents: number | null
		brand_id: string | null
		brand: {
			id: string
			name: string
			created_at: Date
			updated_at: Date
		} | null
		url_image: string | null
		technical_title: string | null
		technical_subtitle: string | null
		technical_analysis: string | null
		technical_movement: string | null
		technical_case_and_crystal: string | null
		technical_specific_functionality: string | null
		technical_dial_and_luminosity: string | null
		technical_bracelet_construction: string | null
		technical_table: string | null
		stocks: {
			id: string
			product_id: string
			title: string
			qtde: number
			full: boolean
			created_at: Date
			updated_at: Date
		}[]
		created_at: Date
		updated_at: Date
	}
}

function normalizeValue(value: string): string {
	return value.trim().toUpperCase()
}

export class CreateProductUseCase {
	constructor(
		private productRepository: ProductRepository,
		private brandRepository: BrandRepository,
	) {}

	async execute({
		sku,
		ean,
		brand_id,
		url_image,
	}: CreateProductUseCaseRequest): Promise<CreateProductUseCaseResponse> {
		const normalizedSku = normalizeValue(sku)
		const normalizedEan = normalizeValue(ean)

		const brand = await this.brandRepository.getById(brand_id)

		if (!brand) {
			throw new BrandNotFoundError()
		}

		const existingSku = await this.productRepository.getBySku(normalizedSku)

		if (existingSku) {
			throw new ProductAlreadyExistsError()
		}

		const existingEan = await this.productRepository.getByEan(normalizedEan)

		if (existingEan) {
			throw new ProductAlreadyExistsError()
		}

		const product = await this.productRepository.create({
			sku: normalizedSku,
			ean: normalizedEan,
			brand_id,
			url_image,
			technical_details: buildDefaultTechnicalDetails(
				brand.name,
				normalizedSku,
				normalizedEan,
			),
		})

		return { product }
	}
}
