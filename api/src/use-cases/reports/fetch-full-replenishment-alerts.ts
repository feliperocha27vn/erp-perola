import type {
	AccountChannelDemandRow,
	AccountChannelRow,
	FullReplenishmentRepository,
	FullStockRow,
	Marketplace,
	PhysicalSupplyRow,
} from "../../repositories/report-repository.js"

/** Janela de apuracao. Relogio gira devagar; 30 dias devolve zero na maioria dos SKUs. */
export const WINDOW_DAYS = 90

/**
 * Janela curta, para a media de 90 dias nao esconder uma aceleracao. Um relogio
 * que vendeu 34 em 90 dias esta em 0,38/dia na conta longa; se 10 dessas sairam
 * nos ultimos 15, o ritmo de agora e 0,67/dia — quase o dobro, e e por ele que a
 * reposicao tem de ser dimensionada.
 */
export const SHORT_WINDOW_DAYS = 15

/**
 * Minimo de unidades na janela curta para ela poder mandar no calculo. Abaixo
 * disso, duas ou tres vendas em sequencia virariam "tendencia" e o alvo dobraria
 * por acaso.
 */
export const TREND_MIN_UNITS = 5

/**
 * Alvo minimo para valer a pena abrir o SKU no full de uma conta. Abrir custa
 * uma perna de envio e o anuncio novo; com o alvo do ML isso equivale a exigir
 * cerca de 8 unidades na janela, ou uma venda a cada 11 dias. Abaixo disso a
 * lista viraria o catalogo inteiro de quem ja vendeu duas pecas no trimestre.
 */
export const MIN_TARGET_TO_OPEN_FULL = 4

/**
 * Piso do denominador. Abaixo disto "dias com estoque" e pequeno demais para
 * dividir: um deposito que teve estoque 2 dias e vendeu 1 implicaria 0,5
 * unidade/dia. Nesses casos o ritmo e diluido por 14 dias em vez do periodo
 * real — continua sendo venda do proprio deposito, so que sem extrapolar.
 */
export const MIN_DAYS_WITH_STOCK = 14

/**
 * Piso mais alto para eleger a conta dona do SKU. Trocar o SKU de conta custa um
 * envio e desmonta o historico do anuncio, entao a evidencia exigida e maior que
 * a do alerta do dia a dia: uma conta que teve estoque tres dias nao tira o SKU
 * de quem sustenta o giro ha meses.
 */
export const ELECTION_MIN_DAYS = 30

/** Folga sobre o lead time, para o alerta nao chegar em cima da hora. */
export const SAFETY_MARGIN_DAYS = 7

/**
 * Dias de venda direta que ficam reservados no estoque fisico.
 *
 * Direta mesmo — balcao. Venda de marketplace despachada do galpao fica de
 * fora: ela e a demanda que o full existe para absorver, e reserva-la seria
 * usar o mesmo pedido como razao para abastecer e para nao abastecer.
 */
export const PHYSICAL_RESERVE_DAYS = 15

interface MarketplaceParams {
	/** Do despacho ate ficar vendavel no CD. */
	leadTimeDays: number
	/** Cobertura que se busca ao abastecer. */
	targetDays: number
	/** Acima disto o CD vira custo: Amazon trata como excesso, ML cobra por parado. */
	maxDays: number
}

export const MARKETPLACE_PARAMS: Record<Marketplace, MarketplaceParams> = {
	mercado_livre: { leadTimeDays: 7, targetDays: 45, maxDays: 90 },
	amazon: { leadTimeDays: 14, targetDays: 60, maxDays: 90 },
	shopee: { leadTimeDays: 10, targetDays: 45, maxDays: 90 },
}

/**
 * Por que a sugestao ficou abaixo do que o deposito precisava. Sem isso a tela
 * dizia so "limitado pelo fisico" ao lado de um saldo fisico visivelmente maior
 * que zero — dois numeros que se contradizem na mesma linha.
 *
 * - `sem_estoque_fisico`: nao ha nenhuma unidade em deposito proprio.
 * - `estoque_insuficiente`: ha estoque proprio, mas menos do que falta.
 * - `reserva_venda_direta`: o saldo esta preso na reserva das vendas diretas.
 * - `rascunho_pendente`: as unidades ja estao prometidas num envio em rascunho.
 * - `dividido_entre_cds`: outro CD do mesmo produto foi servido primeiro.
 */
export type ShortfallReason =
	| "sem_estoque_fisico"
	| "estoque_insuficiente"
	| "reserva_venda_direta"
	| "rascunho_pendente"
	| "dividido_entre_cds"

/**
 * De onde veio o Ritmo de Saida da linha.
 *
 * - `deposito`: das vendas que sairam daquele full. E a leitura preferida —
 *   mede o anuncio que existe, ja corrigida por dias com estoque.
 * - `conta`: das vendas da conta naquele canal, tenha saido de onde tiver
 *   saido. Vale quando o full esta vazio ou vende menos do que a conta procura:
 *   um full zerado nao vende por nao ter o que vender, e ler isso como
 *   "sem demanda" era o que fazia o produto sumir da tela.
 */
export type DemandSource = "deposito" | "conta"

/** Para onde o ritmo recente aponta em relacao a media da janela. */
export type DemandTrend = "acelerando" | "estavel" | "desacelerando"

/** De qual deposito proprio sai cada parte da quantidade sugerida. */
export interface AlertSource {
	stock_id: string
	stock_title: string
	quantity: number
}

export interface FullReplenishmentAlertItem {
	product_id: string
	sku: string
	brand_name: string | null
	stock_id: string
	stock_title: string
	/** Conta dona do deposito. Nulo enquanto o deposito nao tiver conta associada. */
	store_id: string | null
	store_name: string | null
	marketplace: Marketplace
	available_qty: number
	in_transit_qty: number
	units_window: number
	demand_rate_per_day: number
	demand_source: DemandSource
	demand_trend: DemandTrend
	/** Unidades que a conta vendeu no canal na janela longa, de qualquer deposito. */
	account_units_long: number
	/** As mesmas, na janela curta. */
	account_units_short: number
	/** Autonomia do que esta disponivel para venda hoje, sem contar o que vem a caminho. */
	days_of_autonomy: number | null
	rate_is_estimated: boolean
	reorder_point_days: number
	severity: "critico" | "atencao"
	/** O que faltaria para chegar ao alvo do marketplace, ignorando o fisico. */
	needed_quantity: number
	/** O que o fisico consegue cobrir agora. Nunca maior que `needed_quantity`. */
	suggested_quantity: number
	sources: AlertSource[]
	/** Soma de todos os depositos proprios do produto. */
	physical_total_qty: number
	/** Parte do fisico segurada para as vendas diretas. */
	physical_reserved_qty: number
	/** Parte do fisico ja prometida a envios em rascunho. */
	physical_committed_qty: number
	/** O que sobrou do fisico para abastecer os fulls deste produto. */
	physical_available_qty: number
	shortfall_reason: ShortfallReason | null
}

/**
 * Por que aquele saldo esta parado.
 * - `sem_venda`: nenhuma unidade saiu do deposito na janela.
 * - `excesso`: ha mais cobertura do que o teto do marketplace admite.
 * - `conta_secundaria`: o SKU foi concentrado em outra conta do mesmo canal.
 */
export type IdleReason = "sem_venda" | "excesso" | "conta_secundaria"

export interface IdleFullStockItem {
	product_id: string
	sku: string
	brand_name: string | null
	stock_id: string
	stock_title: string
	marketplace: Marketplace
	qtde: number
	units_window: number
	/** null quando nao houve nenhuma venda na janela. */
	days_of_autonomy: number | null
	max_days: number
	reason: IdleReason
	/** Conta que ficou com o SKU. Preenchido so quando `reason` e `conta_secundaria`. */
	winner_stock_title: string | null
}

/**
 * Um produto que a conta vende bem no canal e que nao esta no full dela.
 *
 * Fica numa lista separada de proposito: os alertas falam de depositos que
 * existem e precisam de reposicao, enquanto isto e uma proposta de abrir o SKU
 * na conta. Misturar os dois enterraria a reposicao do dia sob uma lista de
 * oportunidades.
 */
export interface MissingFullListingItem {
	product_id: string
	sku: string
	brand_name: string | null
	store_id: string
	store_name: string
	marketplace: Marketplace
	account_units_long: number
	account_units_short: number
	demand_rate_per_day: number
	demand_trend: DemandTrend
	/** Quanto iria para o full, se o deposito existisse. */
	target_quantity: number
	/** Saldo proprio livre do produto, ja descontado o que os alertas prometeram. */
	physical_available_qty: number
	/** Titulo sugerido para o deposito a criar, copiado dos outros fulls da conta. */
	suggested_stock_title: string
}

interface FetchFullReplenishmentAlertsUseCaseResponse {
	alerts: FullReplenishmentAlertItem[]
	idle: IdleFullStockItem[]
	missing: MissingFullListingItem[]
}

interface Evaluated {
	stock: FullStockRow
	rate: number
	rateIsEstimated: boolean
	unitsWindow: number
	daysWithStock: number
	inTransit: number
	/** Ritmo lido na conta+canal. Zero quando o deposito nao tem conta associada. */
	accountRate: number
	accountUnitsLong: number
	accountUnitsShort: number
	demandSource: DemandSource
	demandTrend: DemandTrend
	/** Autonomia do disponivel — e o que aparece na tela. */
	autonomy: number | null
	/** Autonomia contando o que ja vem a caminho — e o que decide se alerta. */
	effectiveAutonomy: number | null
}

/** Um deposito proprio durante o rateio, com o saldo que ainda nao foi prometido. */
export interface DepositPool {
	stock_id: string
	stock_title: string
	free: number
}

/** O estoque proprio de um produto ja lido como fonte de abastecimento. */
export interface PhysicalPool {
	/** Soma bruta de todos os depositos proprios. */
	total: number
	/** Preso em envios em rascunho, que nao debitaram a origem ainda. */
	committed: number
	/** Segurado para as vendas diretas dos proximos `PHYSICAL_RESERVE_DAYS` dias. */
	reserved: number
	/** O que pode ser abastecido: livre menos reserva. */
	available: number
	/** Saldo por deposito, ja sem o que esta em rascunho, do mais cheio para o mais vazio. */
	deposits: DepositPool[]
}

/**
 * Le o estoque proprio de um produto como fonte de abastecimento. Exportada
 * porque a analise de IA precisa da mesma leitura para saber quanto ainda cabe
 * acima da sugestao — se ela recalculasse por conta propria, a reserva e os
 * rascunhos poderiam ser respeitados num lugar e ignorados no outro.
 */
export function buildPhysicalPool(
	supply: PhysicalSupplyRow | undefined,
	draftedBySource: Map<string, number>,
): PhysicalPool {
	let total = 0
	let committed = 0
	const deposits: DepositPool[] = []

	for (const deposit of supply?.deposits ?? []) {
		// O rascunho nao debita a origem, mas aquelas unidades ja tem dono. Sem
		// descontar aqui, o mesmo saldo seria oferecido a outro CD e os dois
		// rascunhos juntos nao caberiam no despacho.
		const drafted = Math.min(deposit.qtde, draftedBySource.get(deposit.stock_id) ?? 0)
		total += deposit.qtde
		committed += drafted
		deposits.push({
			stock_id: deposit.stock_id,
			stock_title: deposit.stock_title,
			free: deposit.qtde - drafted,
		})
	}

	// Sai primeiro do deposito mais cheio: divide menos o envio e deixa os saldos
	// pequenos inteiros para quem vier depois.
	deposits.sort((a, b) => b.free - a.free || a.stock_title.localeCompare(b.stock_title))

	const directRate = supply ? supply.units_window / WINDOW_DAYS : 0
	const freeTotal = deposits.reduce((sum, deposit) => sum + deposit.free, 0)
	const reserved = Math.min(total, Math.ceil(directRate * PHYSICAL_RESERVE_DAYS))

	return {
		total,
		committed,
		reserved,
		available: Math.max(0, freeTotal - reserved),
		deposits,
	}
}

/** Tira `wanted` unidades dos depositos, do mais cheio para o mais vazio. */
export function drawFromDeposits(deposits: DepositPool[], wanted: number): AlertSource[] {
	const sources: AlertSource[] = []
	let remaining = wanted

	for (const deposit of deposits) {
		if (remaining <= 0) break

		const taken = Math.min(deposit.free, remaining)
		if (taken <= 0) continue

		deposit.free -= taken
		remaining -= taken
		sources.push({
			stock_id: deposit.stock_id,
			stock_title: deposit.stock_title,
			quantity: taken,
		})
	}

	return sources
}

export class FetchFullReplenishmentAlertsUseCase {
	constructor(private repo: FullReplenishmentRepository) {}

	async execute(): Promise<FetchFullReplenishmentAlertsUseCaseResponse> {
		const [
			fullStocks,
			demandRows,
			accountDemandRows,
			accountChannels,
			physicalRows,
			inTransitRows,
			draftedRows,
		] = await Promise.all([
			this.repo.fetchFullStocks(),
			this.repo.fetchFullStockDemand(WINDOW_DAYS),
			this.repo.fetchAccountChannelDemand(WINDOW_DAYS, SHORT_WINDOW_DAYS),
			this.repo.fetchAccountsOperatingFull(),
			this.repo.fetchPhysicalSupply(WINDOW_DAYS),
			this.repo.fetchInTransitQuantities(),
			this.repo.fetchDraftedSourceCommitments(),
		])

		const demandByStock = new Map(demandRows.map((row) => [row.stock_id, row]))
		const physicalByProduct = new Map(physicalRows.map((row) => [row.product_id, row]))
		const accountDemandBySlot = new Map(
			accountDemandRows.map((row) => [
				slotKey(row.product_id, row.store_id, row.marketplace),
				row,
			]),
		)

		const inTransitByStock = new Map<string, number>()
		for (const row of inTransitRows) {
			const current = inTransitByStock.get(row.destination_stock_id) ?? 0
			inTransitByStock.set(row.destination_stock_id, current + row.quantity)
		}

		const draftedBySource = new Map<string, number>()
		for (const row of draftedRows) {
			const current = draftedBySource.get(row.source_stock_id) ?? 0
			draftedBySource.set(row.source_stock_id, current + row.quantity)
		}

		const evaluated: Evaluated[] = fullStocks.map((stock) => {
			const demand = demandByStock.get(stock.stock_id)
			const unitsWindow = demand?.units_window ?? 0
			const daysWithStock = demand?.days_with_stock ?? 0
			const inTransit = inTransitByStock.get(stock.stock_id) ?? 0

			// O deposito e tracionado pelas proprias vendas: e a medida do anuncio
			// que existe, ja corrigida pelos dias em que houve o que vender.
			const ownRate =
				unitsWindow > 0 ? unitsWindow / Math.max(daysWithStock, MIN_DAYS_WITH_STOCK) : 0

			// Mas o silencio de um deposito vazio nao e falta de procura. A conta
			// dona dele pode estar vendendo o mesmo produto no mesmo canal despachando
			// do galpao — demanda que migraria para o full se ele tivesse mercadoria.
			// Continua valendo que giro de OUTRA conta nao puxa esta: a leitura e da
			// conta deste deposito, nao a soma do canal.
			const accountDemand = stock.store_id
				? accountDemandBySlot.get(
						slotKey(stock.product_id, stock.store_id, stock.marketplace),
					)
				: undefined
			const accountRate = accountDemand ? channelRate(accountDemand) : 0

			const rate = Math.max(ownRate, accountRate)
			const demandSource: DemandSource = accountRate > ownRate ? "conta" : "deposito"

			return {
				stock,
				rate,
				rateIsEstimated:
					demandSource === "deposito" &&
					unitsWindow > 0 &&
					daysWithStock < MIN_DAYS_WITH_STOCK,
				unitsWindow,
				daysWithStock,
				inTransit,
				accountRate,
				accountUnitsLong: accountDemand?.units_long ?? 0,
				accountUnitsShort: accountDemand?.units_short ?? 0,
				demandSource,
				demandTrend: demandTrend(accountDemand),
				autonomy: rate > 0 ? stock.qtde / rate : null,
				effectiveAutonomy: rate > 0 ? (stock.qtde + inTransit) / rate : null,
			}
		})

		const runnersUp = this.electAccounts(evaluated)

		const idle: IdleFullStockItem[] = []
		const candidates: Evaluated[] = []

		for (const entry of evaluated) {
			const params = MARKETPLACE_PARAMS[entry.stock.marketplace]
			const reorderPoint = params.leadTimeDays + SAFETY_MARGIN_DAYS
			const winnerTitle = runnersUp.get(entry.stock.stock_id)

			// Conta preterida nao recebe abastecimento, mesmo em ruptura: o SKU mora
			// na conta vizinha. O que ja esta la vira estoque parado, para escoar ou
			// ser retirado.
			if (winnerTitle !== undefined) {
				if (entry.stock.qtde > 0) {
					idle.push(
						this.toIdleItem(
							entry,
							params.maxDays,
							entry.autonomy,
							"conta_secundaria",
							winnerTitle,
						),
					)
				}
				continue
			}

			// Sem ritmo nao ha o que projetar. Se ainda assim ha estoque parado la,
			// isso e o caso "90 dias sem venda" que o ML penaliza.
			if (entry.rate === 0) {
				if (entry.stock.qtde > 0) {
					idle.push(
						this.toIdleItem(entry, params.maxDays, null, "sem_venda", null),
					)
				}
				continue
			}

			if (entry.autonomy !== null && entry.autonomy > params.maxDays) {
				idle.push(
					this.toIdleItem(
						entry,
						params.maxDays,
						entry.autonomy,
						"excesso",
						null,
					),
				)
				continue
			}

			if (entry.effectiveAutonomy !== null && entry.effectiveAutonomy < reorderPoint) {
				candidates.push(entry)
			}
		}

		const alerts = this.allocate(candidates, physicalByProduct, draftedBySource)

		alerts.sort((a, b) => {
			if (a.severity !== b.severity) return a.severity === "critico" ? -1 : 1
			return (a.days_of_autonomy ?? 0) - (b.days_of_autonomy ?? 0)
		})

		idle.sort((a, b) => (b.days_of_autonomy ?? Number.MAX_SAFE_INTEGER) - (a.days_of_autonomy ?? Number.MAX_SAFE_INTEGER))

		const missing = this.findMissingListings({
			accountDemandRows,
			accountChannels,
			evaluated,
			alerts,
			physicalByProduct,
			draftedBySource,
		})

		return { alerts, idle, missing }
	}

	/**
	 * Produtos que a conta vende no canal e que nao estao no full dela.
	 *
	 * O relatorio so sabia repor o que ja existia: sem linha em `stocks` com
	 * `full = true`, o produto nunca entrava na conta, por mais que vendesse. E o
	 * caso do relogio que sai por envio proprio todo mes e nunca foi para o CD.
	 *
	 * A concentracao continua valendo: so entra a conta que vende mais do que
	 * qualquer full ja existente do mesmo produto no mesmo canal — abrir o SKU
	 * numa segunda conta reparte o giro, que e exatamente o que a eleicao evita.
	 */
	private findMissingListings(input: {
		accountDemandRows: AccountChannelDemandRow[]
		accountChannels: AccountChannelRow[]
		evaluated: Evaluated[]
		alerts: FullReplenishmentAlertItem[]
		physicalByProduct: Map<string, PhysicalSupplyRow>
		draftedBySource: Map<string, number>
	}): MissingFullListingItem[] {
		const channelByAccount = new Map(
			input.accountChannels.map((row) => [
				`${row.store_id}::${row.marketplace}`,
				row,
			]),
		)

		const occupiedSlots = new Set<string>()
		const incumbentRate = new Map<string, number>()

		for (const entry of input.evaluated) {
			const { product_id, store_id, marketplace } = entry.stock
			if (store_id) occupiedSlots.add(slotKey(product_id, store_id, marketplace))

			const key = `${product_id}::${marketplace}`
			incumbentRate.set(key, Math.max(incumbentRate.get(key) ?? 0, entry.rate))
		}

		// O saldo proprio ja prometido aos alertas nao esta mais disponivel para
		// uma conta que sequer tem deposito aberto.
		const grantedByProduct = new Map<string, number>()
		for (const alert of input.alerts) {
			grantedByProduct.set(
				alert.product_id,
				(grantedByProduct.get(alert.product_id) ?? 0) + alert.suggested_quantity,
			)
		}

		const items: MissingFullListingItem[] = []

		for (const row of input.accountDemandRows) {
			if (occupiedSlots.has(slotKey(row.product_id, row.store_id, row.marketplace))) {
				continue
			}

			// Sugerir full numa conta que nao opera o canal seria propor abrir uma
			// operacao, nao um SKU.
			const channel = channelByAccount.get(`${row.store_id}::${row.marketplace}`)
			if (!channel) continue

			const rate = channelRate(row)
			if (rate <= 0) continue

			if (rate <= (incumbentRate.get(`${row.product_id}::${row.marketplace}`) ?? 0)) {
				continue
			}

			const params = MARKETPLACE_PARAMS[row.marketplace]
			const target = Math.min(
				Math.ceil(rate * params.targetDays),
				Math.floor(rate * params.maxDays),
			)
			if (target < MIN_TARGET_TO_OPEN_FULL) continue

			const pool = buildPhysicalPool(
				input.physicalByProduct.get(row.product_id),
				input.draftedBySource,
			)

			items.push({
				product_id: row.product_id,
				sku: row.sku,
				brand_name: row.brand_name,
				store_id: row.store_id,
				store_name: row.store_name,
				marketplace: row.marketplace,
				account_units_long: row.units_long,
				account_units_short: row.units_short,
				demand_rate_per_day: round2(rate),
				demand_trend: demandTrend(row),
				target_quantity: target,
				physical_available_qty: Math.max(
					0,
					pool.available - (grantedByProduct.get(row.product_id) ?? 0),
				),
				suggested_stock_title: channel.sample_stock_title,
			})
		}

		items.sort((a, b) => b.demand_rate_per_day - a.demand_rate_per_day)

		return items
	}

	/**
	 * Dentro de um marketplace, cada SKU fica em uma conta so: a que vende mais
	 * rapido. Espalhar o mesmo produto pelos tres fulls do ML reparte o giro entre
	 * os anuncios, multiplica o frete de abastecimento e deixa saldo imobilizado em
	 * duas contas — quando concentrado, o mesmo estoque gira em um lugar so.
	 *
	 * Compara ritmo, nao total de unidades, pelo mesmo motivo que o alerta divide
	 * por dias COM estoque: uma conta que passou 80 dias zerada vendeu pouco por
	 * falta de mercadoria, nao por falta de demanda, e somando unidades ela perde
	 * o SKU justamente por ter ficado desabastecida. O piso de 30 dias impede o
	 * contrario — que uma amostra de tres dias tome o SKU de quem sustenta o giro.
	 *
	 * Empate resolve pelo saldo que ja esta no CD: trocar o SKU de casa custa um
	 * envio, entao na duvida fica onde ja tem mercadoria.
	 *
	 * A regra so vale quando alguma conta do canal vendeu na janela. Se ninguem
	 * vendeu, nao ha o que concentrar e nenhuma delas e "preterida" — cada uma
	 * segue para estoque parado pelo motivo dela.
	 *
	 * @returns stock_id de cada conta preterida -> titulo da conta que ficou com o SKU
	 */
	private electAccounts(evaluated: Evaluated[]): Map<string, string> {
		const byProductAndMarketplace = new Map<string, Evaluated[]>()

		for (const entry of evaluated) {
			const key = `${entry.stock.product_id}::${entry.stock.marketplace}`
			const list = byProductAndMarketplace.get(key) ?? []
			list.push(entry)
			byProductAndMarketplace.set(key, list)
		}

		const runnersUp = new Map<string, string>()

		for (const entries of byProductAndMarketplace.values()) {
			if (entries.length < 2) continue
			if (!entries.some((entry) => electionScore(entry) > 0)) continue

			const [winner, ...rest] = [...entries].sort(
				(a, b) =>
					electionScore(b) - electionScore(a) ||
					b.unitsWindow - a.unitsWindow ||
					b.stock.qtde - a.stock.qtde ||
					a.stock.stock_id.localeCompare(b.stock.stock_id),
			)

			for (const loser of rest) {
				runnersUp.set(loser.stock.stock_id, winner.stock.stock_title)
			}
		}

		return runnersUp
	}

	private toIdleItem(
		entry: Evaluated,
		maxDays: number,
		autonomy: number | null,
		reason: IdleReason,
		winnerStockTitle: string | null,
	): IdleFullStockItem {
		return {
			product_id: entry.stock.product_id,
			sku: entry.stock.sku,
			brand_name: entry.stock.brand_name,
			stock_id: entry.stock.stock_id,
			stock_title: entry.stock.stock_title,
			marketplace: entry.stock.marketplace,
			qtde: entry.stock.qtde,
			units_window: entry.unitsWindow,
			days_of_autonomy: autonomy === null ? null : round2(autonomy),
			max_days: maxDays,
			reason,
			winner_stock_title: winnerStockTitle,
		}
	}

	/**
	 * O estoque fisico do produto — somando todos os depositos proprios — e
	 * disputado por todos os seus depositos full. Quem chegar mais perto de
	 * rupturar antes do envio chegar e servido primeiro; o que sobra vai para o
	 * proximo.
	 *
	 * A urgencia e medida em folga (`autonomia - lead time`), nao em autonomia
	 * pura: 10 dias de autonomia na Amazon, com 14 de lead time, ja e ruptura
	 * garantida, enquanto 10 dias no ML ainda da tempo de repor.
	 */
	private allocate(
		candidates: Evaluated[],
		physicalByProduct: Map<string, PhysicalSupplyRow>,
		draftedBySource: Map<string, number>,
	): FullReplenishmentAlertItem[] {
		const byProduct = new Map<string, Evaluated[]>()
		for (const entry of candidates) {
			const list = byProduct.get(entry.stock.product_id) ?? []
			list.push(entry)
			byProduct.set(entry.stock.product_id, list)
		}

		const items: FullReplenishmentAlertItem[] = []

		for (const [productId, entries] of byProduct) {
			const { total, committed, reserved, available, deposits } = buildPhysicalPool(
				physicalByProduct.get(productId),
				draftedBySource,
			)

			const poolAtStart = available
			let pool = poolAtStart

			const ordered = [...entries].sort((a, b) => slack(a) - slack(b))

			for (const entry of ordered) {
				const params = MARKETPLACE_PARAMS[entry.stock.marketplace]
				const onHand = entry.stock.qtde + entry.inTransit

				const toTarget = Math.ceil(entry.rate * params.targetDays) - onHand
				const toCeiling = Math.floor(entry.rate * params.maxDays) - onHand
				const needed = Math.max(0, Math.min(toTarget, toCeiling))

				const poolBefore = pool
				const sources = drawFromDeposits(deposits, Math.min(needed, pool))
				const granted = sources.reduce((sum, source) => sum + source.quantity, 0)
				pool -= granted

				items.push({
					product_id: entry.stock.product_id,
					sku: entry.stock.sku,
					brand_name: entry.stock.brand_name,
					stock_id: entry.stock.stock_id,
					stock_title: entry.stock.stock_title,
					store_id: entry.stock.store_id,
					store_name: entry.stock.store_name,
					marketplace: entry.stock.marketplace,
					available_qty: entry.stock.qtde,
					in_transit_qty: entry.inTransit,
					units_window: entry.unitsWindow,
					demand_rate_per_day: round2(entry.rate),
					demand_source: entry.demandSource,
					demand_trend: entry.demandTrend,
					account_units_long: entry.accountUnitsLong,
					account_units_short: entry.accountUnitsShort,
					days_of_autonomy: entry.autonomy === null ? null : round2(entry.autonomy),
					rate_is_estimated: entry.rateIsEstimated,
					reorder_point_days: params.leadTimeDays + SAFETY_MARGIN_DAYS,
					// Critico e perda de venda: o anuncio do full esta girando e vai
					// parar. Se o deposito nao vendeu nada na janela, nao ha anuncio
					// girando para parar — a conta continua entregando por outro
					// caminho, e o caso e de reforcar o full, nao de apagar incendio.
					severity:
						entry.unitsWindow > 0 &&
						entry.effectiveAutonomy !== null &&
						entry.effectiveAutonomy < params.leadTimeDays
							? "critico"
							: "atencao",
					needed_quantity: needed,
					suggested_quantity: granted,
					sources,
					physical_total_qty: total,
					physical_reserved_qty: reserved,
					physical_committed_qty: committed,
					physical_available_qty: poolAtStart,
					shortfall_reason:
						granted >= needed
							? null
							: shortfallReason({
									total,
									reserved,
									committed,
									consumedBySiblings: poolAtStart - poolBefore,
								}),
				})
			}
		}

		return items
	}
}

/**
 * Ritmo para efeito de eleicao da conta dona do SKU. Mesma conta do ritmo do
 * alerta, com denominador minimo maior — ver `ELECTION_MIN_DAYS`.
 *
 * Entra tambem o ritmo da conta no canal, porque senao a eleicao trava quem
 * mais vende: uma conta cujo full zerou pontua zero pelo deposito, perde o SKU
 * para quem vendeu uma unica unidade e nunca mais recebe abastecimento — nao
 * vende porque nao tem estoque, e nao tem estoque porque nao vende.
 */
function electionScore(entry: Evaluated) {
	return Math.max(
		entry.unitsWindow / Math.max(entry.daysWithStock, ELECTION_MIN_DAYS),
		entry.accountRate,
	)
}

/** Chave de um par produto+conta+canal — a unidade de decisao do relatorio. */
function slotKey(productId: string, storeId: string, marketplace: Marketplace) {
	return `${productId}::${storeId}::${marketplace}`
}

/**
 * Ritmo de uma conta num canal. Fica com o maior entre a media da janela longa
 * e a da curta: a longa e a base estavel, a curta so assume quando tem volume
 * para sustentar a leitura e aponta para cima.
 */
function channelRate(row: { units_long: number; units_short: number }) {
	const longRate = row.units_long / WINDOW_DAYS
	const shortRate =
		row.units_short >= TREND_MIN_UNITS ? row.units_short / SHORT_WINDOW_DAYS : 0

	return Math.max(longRate, shortRate)
}

/**
 * Para onde o ritmo recente aponta. Serve de aviso na tela, nao entra na conta —
 * quem dimensiona a reposicao e `channelRate`.
 */
function demandTrend(row: { units_long: number; units_short: number } | undefined): DemandTrend {
	if (!row || row.units_long === 0) return "estavel"

	const longRate = row.units_long / WINDOW_DAYS
	const shortRate = row.units_short / SHORT_WINDOW_DAYS

	if (row.units_short >= TREND_MIN_UNITS && shortRate > longRate * 1.3) return "acelerando"
	if (shortRate < longRate * 0.5) return "desacelerando"

	return "estavel"
}

/** Dias de folga antes de a ruptura passar a ser inevitavel mesmo enviando hoje. */
function slack(entry: Evaluated) {
	return (
		(entry.effectiveAutonomy ?? 0) - MARKETPLACE_PARAMS[entry.stock.marketplace].leadTimeDays
	)
}

/**
 * Qual dos fatores segurou a sugestao. Quando mais de um pesa, ganha o maior:
 * e o que o usuario precisa destravar para o envio sair completo.
 */
function shortfallReason(input: {
	total: number
	reserved: number
	committed: number
	consumedBySiblings: number
}): ShortfallReason {
	if (input.total === 0) return "sem_estoque_fisico"

	const blockers: { reason: ShortfallReason; weight: number }[] = [
		{ reason: "dividido_entre_cds", weight: input.consumedBySiblings },
		{ reason: "reserva_venda_direta", weight: input.reserved },
		{ reason: "rascunho_pendente", weight: input.committed },
	]

	const worst = blockers.reduce((top, blocker) =>
		blocker.weight > top.weight ? blocker : top,
	)

	return worst.weight > 0 ? worst.reason : "estoque_insuficiente"
}

function round2(value: number) {
	return Math.round(value * 100) / 100
}
