import { beforeEach, describe, expect, it } from "vitest"
import type {
	AnalystVerdict,
	ReplenishmentAnalystGateway,
} from "../../gateways/replenishment-analyst-gateway.js"
import type {
	ProductInsight,
	ProductInsightRepository,
} from "../../repositories/product-insight-repository.js"
import type { Product } from "../../repositories/product-repository.js"
import type {
	DraftedSourceRow,
	FullReplenishmentRepository,
	FullStockDemandRow,
	FullStockRow,
	InTransitRow,
	PhysicalSupplyRow,
} from "../../repositories/report-repository.js"
import {
	AnalyzeFullReplenishmentSuggestionUseCase,
	INSIGHT_TTL_DAYS,
	ProductNotInReplenishmentAlertsError,
} from "./analyze-full-replenishment-suggestion.js"
import { FetchFullReplenishmentAlertsUseCase } from "./fetch-full-replenishment-alerts.js"

class FakeFullReplenishmentRepository implements FullReplenishmentRepository {
	public fullStocks: FullStockRow[] = []
	public demand: FullStockDemandRow[] = []
	public physical: PhysicalSupplyRow[] = []
	public inTransit: InTransitRow[] = []
	public drafted: DraftedSourceRow[] = []

	async fetchFullStocks() {
		return this.fullStocks
	}
	async fetchFullStockDemand() {
		return this.demand
	}
	async fetchAccountChannelDemand() {
		return []
	}
	async fetchAccountsOperatingFull() {
		return []
	}
	async fetchPhysicalSupply() {
		return this.physical
	}
	async fetchInTransitQuantities() {
		return this.inTransit
	}
	async fetchDraftedSourceCommitments() {
		return this.drafted
	}
}

class FakeProductInsightRepository implements ProductInsightRepository {
	public items = new Map<string, ProductInsight>()

	async findByProductId(productId: string) {
		return this.items.get(productId) ?? null
	}

	async upsert(insight: Omit<ProductInsight, "updated_at">) {
		const stored = { ...insight, updated_at: new Date("2026-08-14T12:00:00Z") }
		this.items.set(insight.product_id, stored)
		return stored
	}
}

class FakeAnalyst implements ReplenishmentAnalystGateway {
	public calls = 0
	public verdict: AnalystVerdict = {
		verdict: "manter",
		seasonal_factor: 100,
		identity: "Relógio automático masculino ORIENT, faixa R$ 700–900.",
		rationale: "Nada no calendário justifica mudar o envio agora.",
		critique: null,
		sources: [],
		grounded: true,
		model: "fake-model",
	}
	public lastInput: unknown = null

	async analyze(input: unknown) {
		this.calls += 1
		this.lastInput = input
		return this.verdict
	}
}

const product = {
	id: "prod-1",
	sku: "REL-001",
	ean: "7891234567890",
	technical_title: "ORIENT Automático",
	technical_description: "Movimento automático, caixa em aço.",
} as Product

const productRepo = {
	async getProductById(id: string) {
		return id === "prod-1" ? product : null
	},
}

let replenishmentRepo: FakeFullReplenishmentRepository
let insightRepo: FakeProductInsightRepository
let analyst: FakeAnalyst
let sut: AnalyzeFullReplenishmentSuggestionUseCase

/** Congela o relogio: o TTL do cache e a data que vai para o analista dependem dele. */
const NOW = new Date("2026-08-14T12:00:00Z")

function build(physicalQty: number) {
	replenishmentRepo = new FakeFullReplenishmentRepository()
	// 0,2/dia com 1 unidade no CD: alvo ML de 45 dias = 9, entao precisa de 8.
	replenishmentRepo.fullStocks = [
		{
			product_id: "prod-1",
			sku: "REL-001",
			brand_name: "ORIENT",
			stock_id: "lilian",
			stock_title: "Lilian",
			marketplace: "mercado_livre",
			qtde: 1,
			store_id: null,
			store_name: null,
		},
	]
	replenishmentRepo.demand = [
		{ stock_id: "lilian", units_window: 18, days_with_stock: 90 },
	]
	replenishmentRepo.physical = [
		{
			product_id: "prod-1",
			units_window: 0,
			deposits: [{ stock_id: "galpao", stock_title: "Galpão", qtde: physicalQty }],
		},
	]

	insightRepo = new FakeProductInsightRepository()
	analyst = new FakeAnalyst()

	sut = new AnalyzeFullReplenishmentSuggestionUseCase(
		new FetchFullReplenishmentAlertsUseCase(replenishmentRepo),
		replenishmentRepo,
		productRepo,
		insightRepo,
		analyst,
		() => NOW,
	)
}

beforeEach(() => build(20))

describe("AnalyzeFullReplenishmentSuggestionUseCase — parecer", () => {
	it("analisa a linha real do relatório, não números vindos do cliente", async () => {
		const result = await sut.execute({
			product_id: "prod-1",
			stock_id: "lilian",
			refresh: false,
		})

		expect(result.suggested_quantity).toBe(8)
		expect(analyst.lastInput).toMatchObject({
			situation: { needed_quantity: 8, demand_rate_per_day: 0.2, today: "2026-08-14" },
		})
		expect(result.insight.identity).toContain("ORIENT")
	})

	it("recusa analisar um par produto × depósito que não está em alerta", async () => {
		await expect(
			sut.execute({ product_id: "prod-1", stock_id: "laurinda", refresh: false }),
		).rejects.toBeInstanceOf(ProductNotInReplenishmentAlertsError)
	})

	it("manda o saldo parado do mesmo SKU em outra conta junto do pedido", async () => {
		replenishmentRepo.fullStocks.push({
			product_id: "prod-1",
			sku: "REL-001",
			brand_name: "ORIENT",
			stock_id: "laurinda",
			stock_title: "Laurinda",
			marketplace: "mercado_livre",
			qtde: 6,
			store_id: null,
			store_name: null,
		})
		replenishmentRepo.demand.push({
			stock_id: "laurinda",
			units_window: 4,
			days_with_stock: 90,
		})

		await sut.execute({ product_id: "prod-1", stock_id: "lilian", refresh: false })

		expect(analyst.lastInput).toMatchObject({
			situation: {
				idle_elsewhere: [
					{ stock_title: "Laurinda", qtde: 6, reason: "conta_secundaria" },
				],
			},
		})
	})
})

describe("AnalyzeFullReplenishmentSuggestionUseCase — cache", () => {
	it("não paga uma segunda chamada dentro do prazo", async () => {
		await sut.execute({ product_id: "prod-1", stock_id: "lilian", refresh: false })
		const second = await sut.execute({
			product_id: "prod-1",
			stock_id: "lilian",
			refresh: false,
		})

		expect(analyst.calls).toBe(1)
		expect(second.from_cache).toBe(true)
	})

	it("reanalisa quando o usuário pede explicitamente", async () => {
		await sut.execute({ product_id: "prod-1", stock_id: "lilian", refresh: false })
		await sut.execute({ product_id: "prod-1", stock_id: "lilian", refresh: true })

		expect(analyst.calls).toBe(2)
	})

	it("reanalisa sozinho depois do prazo", async () => {
		const expired = new Date(NOW.getTime() - (INSIGHT_TTL_DAYS + 1) * 86_400_000)
		insightRepo.items.set("prod-1", {
			product_id: "prod-1",
			verdict: "manter",
			seasonal_factor: 100,
			identity: "análise velha",
			rationale: "…",
			critique: null,
			sources: [],
			grounded: true,
			context_snapshot: {
				demand_rate_per_day: 0.2,
				days_of_autonomy: 5,
				needed_quantity: 8,
			},
			model: "fake-model",
			updated_at: expired,
		})

		const result = await sut.execute({
			product_id: "prod-1",
			stock_id: "lilian",
			refresh: false,
		})

		expect(analyst.calls).toBe(1)
		expect(result.from_cache).toBe(false)
	})

	it("avisa quando o parecer em cache foi escrito sobre outros números", async () => {
		insightRepo.items.set("prod-1", {
			product_id: "prod-1",
			verdict: "manter",
			seasonal_factor: 100,
			identity: "análise de quando o giro era outro",
			rationale: "…",
			critique: null,
			sources: [],
			grounded: true,
			context_snapshot: {
				demand_rate_per_day: 0.9,
				days_of_autonomy: 1,
				needed_quantity: 40,
			},
			model: "fake-model",
			updated_at: NOW,
		})

		const result = await sut.execute({
			product_id: "prod-1",
			stock_id: "lilian",
			refresh: false,
		})

		expect(result.from_cache).toBe(true)
		expect(result.stale).toBe(true)
	})
})

describe("AnalyzeFullReplenishmentSuggestionUseCase — fator vira quantidade", () => {
	it("propõe mais unidades quando o analista manda antecipar", async () => {
		analyst.verdict = { ...analyst.verdict, verdict: "antecipar", seasonal_factor: 140 }

		const result = await sut.execute({
			product_id: "prod-1",
			stock_id: "lilian",
			refresh: false,
		})

		// 8 x 1,40 = 11,2 -> 11, e o Galpao tem 20 para cobrir.
		expect(result.suggested_quantity).toBe(8)
		expect(result.adjusted_quantity).toBe(11)
		expect(result.adjustment_capped).toBe(false)
		expect(result.adjusted_sources).toEqual([
			{ stock_id: "galpao", stock_title: "Galpão", quantity: 11 },
		])
	})

	it("nunca propõe mais do que o estoque próprio permite", async () => {
		build(9)
		analyst.verdict = { ...analyst.verdict, verdict: "antecipar", seasonal_factor: 140 }

		const result = await sut.execute({
			product_id: "prod-1",
			stock_id: "lilian",
			refresh: false,
		})

		expect(result.adjusted_quantity).toBe(9)
		expect(result.adjustment_capped).toBe(true)
	})

	it("não invade a reserva de venda direta para antecipar", async () => {
		// 20 no fisico, mas 18 vendas diretas em 90 dias reservam 3 -> sobram 17.
		replenishmentRepo.physical = [
			{
				product_id: "prod-1",
				units_window: 18,
				deposits: [{ stock_id: "galpao", stock_title: "Galpão", qtde: 9 }],
			},
		]
		analyst.verdict = { ...analyst.verdict, seasonal_factor: 200 }

		const result = await sut.execute({
			product_id: "prod-1",
			stock_id: "lilian",
			refresh: false,
		})

		// 9 no fisico menos 3 de reserva = 6 disponiveis, e nao 9.
		expect(result.adjusted_quantity).toBe(6)
		expect(result.adjustment_capped).toBe(true)
	})

	it("corta a sugestão quando o analista manda segurar", async () => {
		analyst.verdict = { ...analyst.verdict, verdict: "segurar", seasonal_factor: 70 }

		const result = await sut.execute({
			product_id: "prod-1",
			stock_id: "lilian",
			refresh: false,
		})

		// 8 x 0,70 = 5,6 -> 6.
		expect(result.adjusted_quantity).toBe(6)
		expect(result.adjusted_sources).toEqual([
			{ stock_id: "galpao", stock_title: "Galpão", quantity: 6 },
		])
	})
})
