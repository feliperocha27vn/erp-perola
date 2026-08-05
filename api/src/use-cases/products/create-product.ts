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
	const table = `| Caracteristica | Detalhe |
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
| Certificacoes | Nao informado |`

	const description = [
		["## Subtítulo", "Relogio com especificacoes tecnicas consolidadas para catalogo e analise comparativa."],
		["## Análise Técnica", "Descreva aqui a engenharia do relogio, materiais da caixa/bezel/cristal e os beneficios praticos de cada escolha tecnica."],
		["## Movimento", "Calibre nao informado."],
		["## Caixa e Cristal", "Material da caixa e cristal nao informados."],
		["## Funcionalidade Específica", "Funcao tecnica principal ou certificacao nao informada."],
		["## Mostrador e Luminosidade", "Mostrador e lumen nao informados."],
		["## Construção da Pulseira", "Pulseira e fecho nao informados."],
		["## Tabela Técnica", table],
	]
		.map(([heading, content]) => `${heading}\n${content}`)
		.join("\n\n")

	return {
		technical_title: `${brandName} ${sku} - Relogio com foco tecnico em materiais e construcao`,
		technical_description: description,
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
		technical_description: string | null
		stocks: {
			id: string
			product_id: string
			title: string
			qtde: number
			full: boolean
		marketplace: "mercado_livre" | "amazon" | "shopee" | null
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
