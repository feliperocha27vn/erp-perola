import type { ReplenishmentAnalystGateway } from "../../gateways/replenishment-analyst-gateway.js"
import type {
	ProductInsight,
	ProductInsightRepository,
} from "../../repositories/product-insight-repository.js"
import type { ProductRepository } from "../../repositories/product-repository.js"

import type { FullReplenishmentRepository } from "../../repositories/report-repository.js"
import {
	type AlertSource,
	buildPhysicalPool,
	drawFromDeposits,
	FetchFullReplenishmentAlertsUseCase,
	type FullReplenishmentAlertItem,
	WINDOW_DAYS,
} from "./fetch-full-replenishment-alerts.js"

/**
 * Depois disto a leitura de mercado e refeita sozinha. Identidade de produto e
 * calendario comercial mudam devagar; uma semana e curta o bastante para nao
 * carregar uma data que ja passou e longa o bastante para a analise custar uma
 * chamada por produto, nao uma por clique.
 */
export const INSIGHT_TTL_DAYS = 7

/** So o cadastro do produto interessa aqui — o resto do repositorio nao entra. */
type ProductLookup = Pick<ProductRepository, "getProductById">

/**
 * Quanto os numeros da linha precisam andar para a analise ser considerada
 * envelhecida. Ritmo de saida oscila casa decimal a toa; so uma mudanca de
 * verdade merece o aviso na tela.
 */
const STALE_RATE_TOLERANCE = 0.05

export class ProductNotInReplenishmentAlertsError extends Error {
	constructor() {
		super("Este produto não está entre os alertas de abastecimento agora.")
	}
}

interface AnalyzeFullReplenishmentSuggestionUseCaseRequest {
	product_id: string
	stock_id: string
	/** Ignora o cache e paga uma chamada nova. */
	refresh: boolean
}

interface AnalyzeFullReplenishmentSuggestionUseCaseResponse {
	insight: ProductInsight
	/** O que a regra determinou. Continua sendo o numero padrao da tela. */
	suggested_quantity: number
	/** A proposta da IA, ja limitada pelo que o estoque proprio permite. */
	adjusted_quantity: number
	/** De onde sairia a quantidade ajustada, se ela for aceita. */
	adjusted_sources: AlertSource[]
	/** true quando o fator pedia mais do que o estoque proprio conseguiu cobrir. */
	adjustment_capped: boolean
	/** true quando a analise veio do cache com numeros diferentes dos de agora. */
	stale: boolean
	from_cache: boolean
}

/**
 * Une o parecer do analista externo ao rateio determinístico da mesma linha.
 *
 * A IA nunca escreve quantidade: ela devolve um fator, e o fator vira unidades
 * aqui, dentro do que sobrou do estoque proprio depois da reserva de venda
 * direta e dos rascunhos em aberto. Um fator alucinado no maximo pede mais do
 * que existe — e ai a resposta e a mesma de sempre, limitada pelo fisico. Ver
 * ADR 0008.
 */
export class AnalyzeFullReplenishmentSuggestionUseCase {
	constructor(
		private alertsUseCase: FetchFullReplenishmentAlertsUseCase,
		private replenishmentRepo: FullReplenishmentRepository,
		private productRepo: ProductLookup,
		private insightRepo: ProductInsightRepository,
		private analyst: ReplenishmentAnalystGateway,
		private now: () => Date = () => new Date(),
	) {}

	async execute(
		request: AnalyzeFullReplenishmentSuggestionUseCaseRequest,
	): Promise<AnalyzeFullReplenishmentSuggestionUseCaseResponse> {
		const { alerts, idle } = await this.alertsUseCase.execute()

		const line = alerts.find(
			(alert) =>
				alert.product_id === request.product_id && alert.stock_id === request.stock_id,
		)

		// Sem a linha nao ha o que analisar: os numeros da opiniao viriam do
		// cliente, e ai a IA estaria comentando um relatorio que nao existe mais.
		if (!line) throw new ProductNotInReplenishmentAlertsError()

		const snapshot = {
			demand_rate_per_day: line.demand_rate_per_day,
			days_of_autonomy: line.days_of_autonomy,
			needed_quantity: line.needed_quantity,
		}

		const cached = await this.insightRepo.findByProductId(request.product_id)
		const reusable = !request.refresh && cached !== null && this.isFresh(cached)

		const insight = reusable
			? (cached as ProductInsight)
			: await this.analyzeNow(line, idle, snapshot)

		const adjustment = await this.adjust(line, alerts, insight.seasonal_factor)

		return {
			insight,
			suggested_quantity: line.suggested_quantity,
			adjusted_quantity: adjustment.quantity,
			adjusted_sources: adjustment.sources,
			adjustment_capped: adjustment.capped,
			stale: reusable && this.hasMoved(insight.context_snapshot, snapshot),
			from_cache: reusable,
		}
	}

	private async analyzeNow(
		line: FullReplenishmentAlertItem,
		idle: { product_id: string; stock_title: string; qtde: number; reason: string }[],
		snapshot: ProductInsight["context_snapshot"],
	): Promise<ProductInsight> {
		const product = await this.productRepo.getProductById(line.product_id)

		const verdict = await this.analyst.analyze({
			product: {
				sku: line.sku,
				ean: product?.ean ?? "",
				brand_name: line.brand_name,
				technical_title: product?.technical_title ?? null,
				technical_description: product?.technical_description ?? null,
			},
			situation: {
				stock_title: line.stock_title,
				marketplace: line.marketplace,
				available_qty: line.available_qty,
				in_transit_qty: line.in_transit_qty,
				units_window: line.units_window,
				demand_rate_per_day: line.demand_rate_per_day,
				days_of_autonomy: line.days_of_autonomy,
				rate_is_estimated: line.rate_is_estimated,
				needed_quantity: line.needed_quantity,
				suggested_quantity: line.suggested_quantity,
				shortfall_reason: line.shortfall_reason,
				idle_elsewhere: idle
					.filter((item) => item.product_id === line.product_id)
					.map((item) => ({
						stock_title: item.stock_title,
						qtde: item.qtde,
						reason: item.reason,
					})),
				today: this.now().toISOString().slice(0, 10),
			},
		})

		return this.insightRepo.upsert({
			product_id: line.product_id,
			verdict: verdict.verdict,
			seasonal_factor: verdict.seasonal_factor,
			identity: verdict.identity,
			rationale: verdict.rationale,
			critique: verdict.critique,
			sources: verdict.sources,
			grounded: verdict.grounded,
			context_snapshot: snapshot,
			model: verdict.model,
		})
	}

	/**
	 * Transforma o fator em unidades. O teto e o mesmo do rateio: o que sobrou do
	 * estoque proprio depois da reserva e dos rascunhos, menos o que ja foi
	 * prometido as outras linhas do mesmo produto. Antecipar por causa do Natal
	 * nao pode esvaziar o balcao pelas costas.
	 */
	private async adjust(
		line: FullReplenishmentAlertItem,
		alerts: FullReplenishmentAlertItem[],
		factor: number,
	): Promise<{ quantity: number; sources: AlertSource[]; capped: boolean }> {
		const target = Math.round((line.needed_quantity * factor) / 100)

		if (target <= line.suggested_quantity) {
			return { quantity: target, sources: trim(line.sources, target), capped: false }
		}

		const [supplyRows, draftedRows] = await Promise.all([
			this.replenishmentRepo.fetchPhysicalSupply(WINDOW_DAYS),
			this.replenishmentRepo.fetchDraftedSourceCommitments(),
		])

		const draftedBySource = new Map<string, number>()
		for (const row of draftedRows) {
			draftedBySource.set(
				row.source_stock_id,
				(draftedBySource.get(row.source_stock_id) ?? 0) + row.quantity,
			)
		}

		const pool = buildPhysicalPool(
			supplyRows.find((row) => row.product_id === line.product_id),
			draftedBySource,
		)

		// Tira do pool o que o rateio ja prometeu a este produto, inclusive a esta
		// linha, para o saque extra sair do que de fato sobrou.
		let granted = 0
		for (const alert of alerts) {
			if (alert.product_id !== line.product_id) continue
			granted += alert.suggested_quantity
			for (const source of alert.sources) {
				const deposit = pool.deposits.find((d) => d.stock_id === source.stock_id)
				if (deposit) deposit.free -= source.quantity
			}
		}

		const headroom = Math.max(0, pool.available - granted)
		const extra = Math.min(target - line.suggested_quantity, headroom)
		const extraSources = drawFromDeposits(pool.deposits, extra)

		return {
			quantity: line.suggested_quantity + extra,
			sources: merge(line.sources, extraSources),
			capped: extra < target - line.suggested_quantity,
		}
	}

	private isFresh(insight: ProductInsight): boolean {
		const ageMs = this.now().getTime() - insight.updated_at.getTime()
		return ageMs < INSIGHT_TTL_DAYS * 24 * 60 * 60 * 1000
	}

	private hasMoved(
		before: ProductInsight["context_snapshot"],
		now: ProductInsight["context_snapshot"],
	): boolean {
		return (
			Math.abs(before.demand_rate_per_day - now.demand_rate_per_day) > STALE_RATE_TOLERANCE ||
			before.needed_quantity !== now.needed_quantity
		)
	}
}

/** Corta a sugestao original quando a IA pede para segurar. */
function trim(sources: AlertSource[], target: number): AlertSource[] {
	const trimmed: AlertSource[] = []
	let remaining = target

	for (const source of sources) {
		if (remaining <= 0) break
		const quantity = Math.min(source.quantity, remaining)
		remaining -= quantity
		trimmed.push({ ...source, quantity })
	}

	return trimmed
}

/** Junta o saque extra ao original sem repetir deposito na lista. */
function merge(original: AlertSource[], extra: AlertSource[]): AlertSource[] {
	const merged = original.map((source) => ({ ...source }))

	for (const source of extra) {
		const existing = merged.find((item) => item.stock_id === source.stock_id)
		if (existing) {
			existing.quantity += source.quantity
		} else {
			merged.push({ ...source })
		}
	}

	return merged
}
