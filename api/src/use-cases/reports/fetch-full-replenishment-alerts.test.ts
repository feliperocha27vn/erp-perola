import { beforeEach, describe, expect, it } from "vitest"
import type {
	AccountChannelDemandRow,
	AccountChannelRow,
	DraftedSourceRow,
	FullReplenishmentRepository,
	FullStockDemandRow,
	FullStockRow,
	InTransitRow,
	PhysicalSupplyRow,
} from "../../repositories/report-repository.js"
import {
	FetchFullReplenishmentAlertsUseCase,
	MARKETPLACE_PARAMS,
	SAFETY_MARGIN_DAYS,
} from "./fetch-full-replenishment-alerts.js"

class FakeFullReplenishmentRepository implements FullReplenishmentRepository {
	public fullStocks: FullStockRow[] = []
	public demand: FullStockDemandRow[] = []
	public accountDemand: AccountChannelDemandRow[] = []
	public accountChannels: AccountChannelRow[] = []
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
		return this.accountDemand
	}
	async fetchAccountsOperatingFull() {
		return this.accountChannels
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

function fullStock(overrides: Partial<FullStockRow> & { stock_id: string }): FullStockRow {
	return {
		product_id: "prod-1",
		sku: "REL-001",
		brand_name: "ORIENT",
		stock_title: "Lilian",
		marketplace: "mercado_livre",
		qtde: 1,
		store_id: null,
		store_name: null,
		...overrides,
	}
}

function accountDemand(
	overrides: Partial<AccountChannelDemandRow> & { store_id: string },
): AccountChannelDemandRow {
	return {
		product_id: "prod-1",
		sku: "REL-001",
		brand_name: "ORIENT",
		store_name: overrides.store_id,
		marketplace: "mercado_livre",
		units_long: 0,
		units_short: 0,
		...overrides,
	}
}

/** Um deposito fisico so, que e o caso comum. Para varios, montar a mao. */
function physicalSupply(
	overrides: Partial<Omit<PhysicalSupplyRow, "deposits">> & { qtde?: number } = {},
): PhysicalSupplyRow {
	const { qtde = 24, ...rest } = overrides

	return {
		product_id: "prod-1",
		units_window: 0,
		deposits: [{ stock_id: "fisico-1", stock_title: "Galpão", qtde }],
		...rest,
	}
}

let repo: FakeFullReplenishmentRepository
let sut: FetchFullReplenishmentAlertsUseCase

beforeEach(() => {
	repo = new FakeFullReplenishmentRepository()
	sut = new FetchFullReplenishmentAlertsUseCase(repo)
})

describe("FetchFullReplenishmentAlertsUseCase — ritmo de saída", () => {
	it("divide as vendas pelos dias COM estoque, não pelos dias corridos", async () => {
		// 9 unidades em 30 dias com estoque = 0,3/dia. Por dias corridos daria 0,1/dia.
		repo.fullStocks = [fullStock({ stock_id: "lilian", qtde: 3 })]
		repo.demand = [{ stock_id: "lilian", units_window: 9, days_with_stock: 30 }]
		repo.physical = [physicalSupply()]

		const { alerts } = await sut.execute()

		expect(alerts[0].demand_rate_per_day).toBeCloseTo(0.3)
		expect(alerts[0].days_of_autonomy).toBeCloseTo(10)
	})

	it("não puxa o ritmo de um depósito para outro do mesmo produto", async () => {
		// A Lilian gira bem esse relogio no ML; o FBA esta zerado e nao vendeu
		// nenhuma unidade na janela. Sem venda propria nao ha tracao propria:
		// pedir envio para o FBA seria empurrar giro que e do ML.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 10 }),
			fullStock({ stock_id: "fba", stock_title: "Amazon", marketplace: "amazon", qtde: 0 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 27, days_with_stock: 90 },
			{ stock_id: "fba", units_window: 0, days_with_stock: 0 },
		]
		repo.physical = [physicalSupply()]

		const { alerts, idle } = await sut.execute()

		expect(alerts.map((a) => a.stock_id)).not.toContain("fba")
		expect(idle.map((i) => i.stock_id)).not.toContain("fba")
	})

	it("não alerta depósito com estoque parado por causa do giro do vizinho", async () => {
		// O FBA tem unidade em casa e nao vendeu nenhuma: isso e estoque parado,
		// nao ruptura. O giro do ML nao muda esse diagnostico.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 10 }),
			fullStock({ stock_id: "fba", stock_title: "Amazon", marketplace: "amazon", qtde: 2 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 27, days_with_stock: 90 },
			{ stock_id: "fba", units_window: 0, days_with_stock: 40 },
		]
		repo.physical = [physicalSupply()]

		const { alerts, idle } = await sut.execute()

		expect(alerts.map((a) => a.stock_id)).not.toContain("fba")
		expect(idle.map((i) => i.stock_id)).toContain("fba")
	})

	it("alerta o depósito que rupturou depois de ter vendido por conta própria", async () => {
		// Vendeu 4 em 8 dias com estoque e zerou. E venda dela, entao ela alerta.
		repo.fullStocks = [
			fullStock({ stock_id: "laurinda", stock_title: "Laurinda", qtde: 0 }),
		]
		repo.demand = [{ stock_id: "laurinda", units_window: 4, days_with_stock: 8 }]
		repo.physical = [physicalSupply()]

		const { alerts } = await sut.execute()

		expect(alerts[0].stock_id).toBe("laurinda")
		expect(alerts[0].days_of_autonomy).toBe(0)
	})

	it("dilui amostra curta pelo piso de 14 dias em vez de extrapolar", async () => {
		// 2 unidades em 2 dias com estoque. Dividir por 2 daria 1/dia — uma
		// extrapolacao absurda a partir de dois dias. Divide por 14: 0,14/dia.
		repo.fullStocks = [fullStock({ stock_id: "lilian", qtde: 1 })]
		repo.demand = [{ stock_id: "lilian", units_window: 2, days_with_stock: 2 }]
		repo.physical = [physicalSupply()]

		const { alerts } = await sut.execute()

		expect(alerts[0].rate_is_estimated).toBe(true)
		expect(alerts[0].demand_rate_per_day).toBeCloseTo(2 / 14)
	})
})

describe("FetchFullReplenishmentAlertsUseCase — demanda da conta", () => {
	it("lê a demanda da conta quando o full está vazio e a venda saiu do galpão", async () => {
		// A Laurinda vendeu 27 no ML na janela, todas despachadas do galpao porque
		// o full dela esta zerado. Pelo deposito o ritmo e zero e a linha sumia da
		// tela inteira; pela conta sao 0,3/dia de procura real naquele canal.
		repo.fullStocks = [
			fullStock({ stock_id: "laurinda", stock_title: "Laurinda", qtde: 0, store_id: "loja-laurinda", store_name: "Laurinda" }),
		]
		repo.demand = [{ stock_id: "laurinda", units_window: 0, days_with_stock: 0 }]
		repo.accountDemand = [accountDemand({ store_id: "loja-laurinda", store_name: "Laurinda", units_long: 27 })]
		repo.physical = [physicalSupply()]

		const { alerts } = await sut.execute()

		expect(alerts[0].stock_id).toBe("laurinda")
		expect(alerts[0].demand_source).toBe("conta")
		expect(alerts[0].demand_rate_per_day).toBeCloseTo(0.3)
		expect(alerts[0].suggested_quantity).toBe(14)
	})

	it("não marca como crítico o full vazio cuja conta ainda entrega pelo galpão", async () => {
		// Autonomia zero, mas nenhuma venda esta sendo perdida: a conta continua
		// entregando por envio proprio. E reforco de full, nao incendio.
		repo.fullStocks = [
			fullStock({ stock_id: "laurinda", qtde: 0, store_id: "loja-laurinda" }),
		]
		repo.demand = [{ stock_id: "laurinda", units_window: 0, days_with_stock: 0 }]
		repo.accountDemand = [accountDemand({ store_id: "loja-laurinda", units_long: 27 })]
		repo.physical = [physicalSupply()]

		const { alerts } = await sut.execute()

		expect(alerts[0].days_of_autonomy).toBe(0)
		expect(alerts[0].severity).toBe("atencao")
	})

	it("dimensiona pelo ritmo dos últimos 15 dias quando ele supera a média da janela", async () => {
		// 30 em 90 dias sao 0,33/dia; 10 nos ultimos 15 sao 0,67/dia. A media longa
		// diluiria a aceleracao pela metade e o envio chegaria curto.
		repo.fullStocks = [
			fullStock({ stock_id: "laurinda", qtde: 0, store_id: "loja-laurinda" }),
		]
		repo.demand = [{ stock_id: "laurinda", units_window: 0, days_with_stock: 0 }]
		repo.accountDemand = [
			accountDemand({ store_id: "loja-laurinda", units_long: 30, units_short: 10 }),
		]
		repo.physical = [physicalSupply({ qtde: 100 })]

		const { alerts } = await sut.execute()

		expect(alerts[0].demand_rate_per_day).toBeCloseTo(10 / 15)
		expect(alerts[0].demand_trend).toBe("acelerando")
	})

	it("ignora a janela curta quando ela tem poucas unidades", async () => {
		// 3 vendas em 15 dias dariam 0,2/dia contra 0,1 da media longa. Volume fino
		// demais para dobrar o alvo por acaso.
		repo.fullStocks = [
			fullStock({ stock_id: "laurinda", qtde: 0, store_id: "loja-laurinda" }),
		]
		repo.demand = [{ stock_id: "laurinda", units_window: 0, days_with_stock: 0 }]
		repo.accountDemand = [
			accountDemand({ store_id: "loja-laurinda", units_long: 9, units_short: 3 }),
		]
		repo.physical = [physicalSupply()]

		const { alerts } = await sut.execute()

		expect(alerts[0].demand_rate_per_day).toBeCloseTo(0.1)
	})

	it("prefere o ritmo do próprio depósito quando ele é maior que o da conta", async () => {
		// O full girou 27 em 30 dias com estoque (0,9/dia). A conta vendeu as mesmas
		// 27 em 90 dias corridos (0,3/dia) — a leitura do deposito e mais fiel.
		repo.fullStocks = [
			fullStock({ stock_id: "laurinda", qtde: 1, store_id: "loja-laurinda" }),
		]
		repo.demand = [{ stock_id: "laurinda", units_window: 27, days_with_stock: 30 }]
		repo.accountDemand = [accountDemand({ store_id: "loja-laurinda", units_long: 27 })]
		repo.physical = [physicalSupply({ qtde: 100 })]

		const { alerts } = await sut.execute()

		expect(alerts[0].demand_source).toBe("deposito")
		expect(alerts[0].demand_rate_per_day).toBeCloseTo(0.9)
	})

	it("não deixa a conta que mais vende perder o SKU por estar com o full vazio", async () => {
		// A Lilian vendeu 1 unidade do full em 90 dias; a Laurinda vendeu 25 no
		// mesmo canal, todas do galpao. Pela contagem do deposito a Lilian ganhava a
		// eleicao e a Laurinda ficava presa: sem estoque nao vende, sem vender nao
		// recebe estoque.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 1, store_id: "loja-lilian", store_name: "Lilian" }),
			fullStock({ stock_id: "laurinda", stock_title: "Laurinda", qtde: 0, store_id: "loja-laurinda", store_name: "Laurinda" }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 1, days_with_stock: 90 },
			{ stock_id: "laurinda", units_window: 0, days_with_stock: 0 },
		]
		repo.accountDemand = [
			accountDemand({ store_id: "loja-lilian", store_name: "Lilian", units_long: 1 }),
			accountDemand({ store_id: "loja-laurinda", store_name: "Laurinda", units_long: 25 }),
		]
		repo.physical = [physicalSupply({ qtde: 100 })]

		const { alerts, idle } = await sut.execute()

		expect(alerts.map((a) => a.stock_id)).toEqual(["laurinda"])
		expect(idle.find((i) => i.stock_id === "lilian")?.reason).toBe("conta_secundaria")
		expect(idle.find((i) => i.stock_id === "lilian")?.winner_stock_title).toBe("Laurinda")
	})

	it("não usa a demanda de uma conta para abastecer o full de outra", async () => {
		// A Laurinda vende; a Lilian nao. O full da Lilian continua sem tracao.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 2, store_id: "loja-lilian" }),
		]
		repo.demand = [{ stock_id: "lilian", units_window: 0, days_with_stock: 90 }]
		repo.accountDemand = [accountDemand({ store_id: "loja-laurinda", units_long: 27 })]
		repo.physical = [physicalSupply()]

		const { alerts, idle } = await sut.execute()

		expect(alerts).toHaveLength(0)
		expect(idle[0].reason).toBe("sem_venda")
	})
})

describe("FetchFullReplenishmentAlertsUseCase — SKU que vende e não está no full", () => {
	const laurindaNoMl: AccountChannelRow = {
		store_id: "loja-laurinda",
		store_name: "Laurinda",
		marketplace: "mercado_livre",
		sample_stock_title: "Full Laurinda",
	}

	it("propõe abrir o SKU no full da conta que já vende o produto no canal", async () => {
		// Nao ha linha de estoque full nenhuma para este produto: o relatorio so
		// sabia repor o que ja existia, entao um relogio que sai todo mes por envio
		// proprio nunca entrava na conta.
		repo.fullStocks = []
		repo.accountDemand = [accountDemand({ store_id: "loja-laurinda", store_name: "Laurinda", units_long: 27 })]
		repo.accountChannels = [laurindaNoMl]
		repo.physical = [physicalSupply()]

		const { alerts, missing } = await sut.execute()

		expect(alerts).toHaveLength(0)
		expect(missing).toHaveLength(1)
		expect(missing[0].sku).toBe("REL-001")
		expect(missing[0].store_name).toBe("Laurinda")
		expect(missing[0].target_quantity).toBe(14)
		expect(missing[0].physical_available_qty).toBe(24)
		expect(missing[0].suggested_stock_title).toBe("Full Laurinda")
	})

	it("não propõe abrir numa segunda conta quando outra já gira mais o SKU no canal", async () => {
		// Espalhar o mesmo SKU por duas contas do mesmo canal reparte o giro — e a
		// mesma razao da eleicao de conta.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 5, store_id: "loja-lilian", store_name: "Lilian" }),
		]
		repo.demand = [{ stock_id: "lilian", units_window: 45, days_with_stock: 90 }]
		repo.accountDemand = [
			accountDemand({ store_id: "loja-lilian", store_name: "Lilian", units_long: 45 }),
			accountDemand({ store_id: "loja-laurinda", store_name: "Laurinda", units_long: 9 }),
		]
		repo.accountChannels = [laurindaNoMl]
		repo.physical = [physicalSupply()]

		const { missing } = await sut.execute()

		expect(missing).toHaveLength(0)
	})

	it("não propõe full para conta que não opera aquele canal", async () => {
		repo.fullStocks = []
		repo.accountDemand = [accountDemand({ store_id: "loja-laurinda", units_long: 27 })]
		repo.accountChannels = []
		repo.physical = [physicalSupply()]

		const { missing } = await sut.execute()

		expect(missing).toHaveLength(0)
	})

	it("não propõe abrir o SKU por causa de umas vendas soltas na janela", async () => {
		// 5 em 90 dias dao um alvo de 3 unidades — nao paga a perna de envio nem o
		// anuncio novo.
		repo.fullStocks = []
		repo.accountDemand = [accountDemand({ store_id: "loja-laurinda", units_long: 5 })]
		repo.accountChannels = [laurindaNoMl]
		repo.physical = [physicalSupply()]

		const { missing } = await sut.execute()

		expect(missing).toHaveLength(0)
	})

	it("não repete na proposta o saldo que os alertas já prometeram", async () => {
		// O mesmo produto tem full na Lilian no ML, em ruptura, e demanda da
		// Laurinda na Shopee. O que for para a Lilian nao esta mais disponivel.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 0, store_id: "loja-lilian", store_name: "Lilian" }),
		]
		repo.demand = [{ stock_id: "lilian", units_window: 18, days_with_stock: 90 }]
		repo.accountDemand = [
			accountDemand({
				store_id: "loja-laurinda",
				store_name: "Laurinda",
				marketplace: "shopee",
				units_long: 27,
			}),
		]
		repo.accountChannels = [
			{
				store_id: "loja-laurinda",
				store_name: "Laurinda",
				marketplace: "shopee",
				sample_stock_title: "Shopee Laurinda",
			},
		]
		repo.physical = [physicalSupply({ qtde: 20 })]

		const { alerts, missing } = await sut.execute()

		expect(alerts[0].suggested_quantity).toBe(9)
		expect(missing[0].physical_available_qty).toBe(11)
	})
})

describe("FetchFullReplenishmentAlertsUseCase — granularidade por depósito", () => {
	it("alerta o ML em ruptura mesmo com o FBA cheio", async () => {
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 1 }),
			fullStock({ stock_id: "fba", stock_title: "Amazon", marketplace: "amazon", qtde: 17 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 18, days_with_stock: 90 },
			{ stock_id: "fba", units_window: 6, days_with_stock: 90 },
		]
		repo.physical = [physicalSupply()]

		const { alerts } = await sut.execute()

		// Somados dariam 18 unidades para 24 vendas/90d — cobertura confortavel.
		expect(alerts.map((a) => a.stock_id)).toContain("lilian")
		expect(alerts.map((a) => a.stock_id)).not.toContain("fba")
	})
})

describe("FetchFullReplenishmentAlertsUseCase — uma conta por SKU", () => {
	it("abastece só a conta que mais vende o SKU dentro do marketplace", async () => {
		// As tres contas do ML estao em ruptura do mesmo relogio. Espalhar o SKU
		// pelas tres divide o giro e imobiliza saldo em duas; fica na Lilian.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 1 }),
			fullStock({ stock_id: "laurinda", stock_title: "Laurinda", qtde: 1 }),
			fullStock({ stock_id: "larissa", stock_title: "Larissa", qtde: 1 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 40, days_with_stock: 90 },
			{ stock_id: "laurinda", units_window: 18, days_with_stock: 90 },
			{ stock_id: "larissa", units_window: 9, days_with_stock: 90 },
		]
		repo.physical = [physicalSupply({ qtde: 100 })]

		const { alerts } = await sut.execute()

		expect(alerts.map((a) => a.stock_id)).toEqual(["lilian"])
	})

	it("manda a conta preterida para o estoque parado, apontando quem ficou com o SKU", async () => {
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 1 }),
			fullStock({ stock_id: "laurinda", stock_title: "Laurinda", qtde: 6 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 40, days_with_stock: 90 },
			{ stock_id: "laurinda", units_window: 18, days_with_stock: 90 },
		]
		repo.physical = [physicalSupply()]

		const { idle } = await sut.execute()

		const laurinda = idle.find((i) => i.stock_id === "laurinda")
		expect(laurinda?.reason).toBe("conta_secundaria")
		expect(laurinda?.winner_stock_title).toBe("Lilian")
	})

	it("elege pelo ritmo, não pelo total de unidades vendidas", async () => {
		// A Lilian teve estoque 10 dos 90 dias e vendeu 8 nesse periodo; a Laurinda
		// teve estoque o tempo todo e vendeu 20. Somando unidades, a Lilian perde o
		// SKU justamente por ter ficado desabastecida — o mesmo vies que o alerta
		// evita ao dividir por dias COM estoque.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 0 }),
			fullStock({ stock_id: "laurinda", stock_title: "Laurinda", qtde: 6 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 8, days_with_stock: 10 },
			{ stock_id: "laurinda", units_window: 20, days_with_stock: 90 },
		]
		repo.physical = [physicalSupply({ qtde: 100 })]

		const { alerts, idle } = await sut.execute()

		expect(alerts.map((a) => a.stock_id)).toEqual(["lilian"])
		expect(idle.find((i) => i.stock_id === "laurinda")?.winner_stock_title).toBe("Lilian")
	})

	it("não deixa uma amostra de dois dias tomar o SKU de quem sustenta o giro", async () => {
		// A Larissa vendeu 2 em 2 dias com estoque — ritmo alto no papel, evidencia
		// fina. Trocar o SKU de conta custa um envio, entao a eleicao dilui a
		// amostra curta por 30 dias e o SKU fica com a Lilian.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 1 }),
			fullStock({ stock_id: "larissa", stock_title: "Larissa", qtde: 1 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 12, days_with_stock: 90 },
			{ stock_id: "larissa", units_window: 2, days_with_stock: 2 },
		]
		repo.physical = [physicalSupply({ qtde: 100 })]

		const { alerts, idle } = await sut.execute()

		expect(alerts.map((a) => a.stock_id)).toEqual(["lilian"])
		expect(idle.find((i) => i.stock_id === "larissa")?.reason).toBe("conta_secundaria")
	})

	it("não considera parada a conta preterida que já está zerada", async () => {
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 1 }),
			fullStock({ stock_id: "laurinda", stock_title: "Laurinda", qtde: 0 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 40, days_with_stock: 90 },
			{ stock_id: "laurinda", units_window: 18, days_with_stock: 90 },
		]
		repo.physical = [physicalSupply()]

		const { alerts, idle } = await sut.execute()

		expect(alerts.map((a) => a.stock_id)).not.toContain("laurinda")
		expect(idle.map((i) => i.stock_id)).not.toContain("laurinda")
	})

	it("concentra por marketplace: o mesmo SKU pode estar no ML e na Amazon", async () => {
		// Sao canais diferentes, cada um com seu proprio CD e seu proprio cliente.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 1 }),
			fullStock({ stock_id: "fba", stock_title: "Amazon", marketplace: "amazon", qtde: 1 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 40, days_with_stock: 90 },
			{ stock_id: "fba", units_window: 18, days_with_stock: 90 },
		]
		repo.physical = [physicalSupply({ qtde: 100 })]

		const { alerts } = await sut.execute()

		expect(alerts.map((a) => a.stock_id).sort()).toEqual(["fba", "lilian"])
	})

	it("desempata pelo saldo que já está no CD", async () => {
		// Mesmas vendas nas duas: fica com quem ja tem mais unidades la, porque
		// mudar o SKU de casa custa um envio.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 2 }),
			fullStock({ stock_id: "laurinda", stock_title: "Laurinda", qtde: 5 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 45, days_with_stock: 90 },
			{ stock_id: "laurinda", units_window: 45, days_with_stock: 90 },
		]
		repo.physical = [physicalSupply({ qtde: 100 })]

		const { alerts } = await sut.execute()

		expect(alerts.map((a) => a.stock_id)).toEqual(["laurinda"])
	})

	it("não elege conta quando nenhuma delas vendeu na janela", async () => {
		// Sem venda em lugar nenhum nao ha o que concentrar: as duas continuam
		// sendo estoque parado pelo motivo delas, e nao por perder a disputa.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 3 }),
			fullStock({ stock_id: "laurinda", stock_title: "Laurinda", qtde: 4 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 0, days_with_stock: 90 },
			{ stock_id: "laurinda", units_window: 0, days_with_stock: 90 },
		]
		repo.physical = [physicalSupply()]

		const { idle } = await sut.execute()

		expect(idle).toHaveLength(2)
		expect(idle.every((i) => i.reason === "sem_venda")).toBe(true)
	})

	it("não sugere reposição para a conta preterida nem quando ela rupturou", async () => {
		// A Laurinda zerou e vendeu por conta propria, mas o SKU e da Lilian.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 1 }),
			fullStock({ stock_id: "laurinda", stock_title: "Laurinda", qtde: 0 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 40, days_with_stock: 90 },
			{ stock_id: "laurinda", units_window: 4, days_with_stock: 8 },
		]
		repo.physical = [physicalSupply({ qtde: 100 })]

		const { alerts } = await sut.execute()

		expect(alerts.map((a) => a.stock_id)).toEqual(["lilian"])
	})
})

describe("FetchFullReplenishmentAlertsUseCase — ponto de reposição por marketplace", () => {
	it("usa lead time maior para Amazon que para Mercado Livre", async () => {
		// 0,2/dia com 3 unidades = 15 dias de autonomia.
		// ML: ponto = 7+7 = 14 -> nao alerta. Amazon: ponto = 14+7 = 21 -> alerta.
		repo.fullStocks = [
			fullStock({ stock_id: "ml", marketplace: "mercado_livre", qtde: 3 }),
			fullStock({
				stock_id: "fba",
				product_id: "prod-2",
				sku: "REL-002",
				marketplace: "amazon",
				qtde: 3,
			}),
		]
		repo.demand = [
			{ stock_id: "ml", units_window: 18, days_with_stock: 90 },
			{ stock_id: "fba", units_window: 18, days_with_stock: 90 },
		]
		repo.physical = [physicalSupply(), physicalSupply({ product_id: "prod-2" })]

		const { alerts } = await sut.execute()

		expect(alerts.map((a) => a.stock_id)).toEqual(["fba"])
		expect(alerts[0].reorder_point_days).toBe(
			MARKETPLACE_PARAMS.amazon.leadTimeDays + SAFETY_MARGIN_DAYS,
		)
	})

	it("marca como crítico quando vai rupturar antes do envio chegar", async () => {
		// 1 unidade a 0,2/dia = 5 dias, abaixo do lead time de 7 do ML.
		repo.fullStocks = [fullStock({ stock_id: "lilian", qtde: 1 })]
		repo.demand = [{ stock_id: "lilian", units_window: 18, days_with_stock: 90 }]
		repo.physical = [physicalSupply()]

		const { alerts } = await sut.execute()

		expect(alerts[0].severity).toBe("critico")
	})
})

describe("FetchFullReplenishmentAlertsUseCase — estoque em trânsito", () => {
	it("não sugere de novo o que já está em trânsito", async () => {
		repo.fullStocks = [fullStock({ stock_id: "lilian", qtde: 1 })]
		repo.demand = [{ stock_id: "lilian", units_window: 18, days_with_stock: 90 }]
		repo.physical = [physicalSupply()]
		repo.inTransit = [{ destination_stock_id: "lilian", quantity: 20 }]

		const { alerts } = await sut.execute()

		expect(alerts).toHaveLength(0)
	})

	it("mostra a autonomia real, sem contar o que ainda não chegou", async () => {
		repo.fullStocks = [fullStock({ stock_id: "lilian", qtde: 1 })]
		repo.demand = [{ stock_id: "lilian", units_window: 18, days_with_stock: 90 }]
		repo.physical = [physicalSupply()]
		repo.inTransit = [{ destination_stock_id: "lilian", quantity: 1 }]

		const { alerts } = await sut.execute()

		expect(alerts[0].in_transit_qty).toBe(1)
		// 1 unidade disponivel a 0,2/dia = 5 dias, e nao 10.
		expect(alerts[0].days_of_autonomy).toBeCloseTo(5)
	})
})

describe("FetchFullReplenishmentAlertsUseCase — quantidade sugerida e rateio", () => {
	it("sugere o que falta para atingir o alvo do marketplace", async () => {
		// 0,2/dia, alvo ML de 45 dias = 9 unidades. Tem 1, sugere 8.
		repo.fullStocks = [fullStock({ stock_id: "lilian", qtde: 1 })]
		repo.demand = [{ stock_id: "lilian", units_window: 18, days_with_stock: 90 }]
		repo.physical = [physicalSupply()]

		const { alerts } = await sut.execute()

		expect(alerts[0].suggested_quantity).toBe(8)
	})

	it("esgota o físico no primeiro da fila e diz ao segundo que o saldo foi para outro CD", async () => {
		// Os dois vendem 0,5/dia e querem mais de 20 unidades, mas so ha 5 no
		// fisico. A Amazon fica 6 dias sem estoque ate o envio chegar (8 de
		// autonomia contra 14 de lead time) e a Lilian, 5 — a Amazon vai primeiro.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 1 }),
			fullStock({ stock_id: "fba", stock_title: "Amazon", marketplace: "amazon", qtde: 4 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 45, days_with_stock: 90 },
			{ stock_id: "fba", units_window: 45, days_with_stock: 90 },
		]
		repo.physical = [physicalSupply({ qtde: 5 })]

		const { alerts } = await sut.execute()

		const lilian = alerts.find((a) => a.stock_id === "lilian")
		const fba = alerts.find((a) => a.stock_id === "fba")

		expect(fba?.suggested_quantity).toBe(5)
		expect(lilian?.suggested_quantity).toBe(0)
		expect(lilian?.shortfall_reason).toBe("dividido_entre_cds")
	})

	it("serve primeiro quem tem menos folga sobre o lead time, não menos autonomia", async () => {
		// ML com 10 dias de autonomia e lead time de 7 ainda da tempo (folga +3).
		// A Amazon com 12 dias e lead time de 14 ja rupturou mesmo enviando hoje
		// (folga -2). Por autonomia pura o ML seria servido primeiro e a Amazon
		// ficaria sem nada.
		repo.fullStocks = [
			fullStock({ stock_id: "ml", stock_title: "Lilian", qtde: 2 }),
			fullStock({
				stock_id: "fba",
				stock_title: "Amazon",
				marketplace: "amazon",
				qtde: 3,
			}),
		]
		repo.demand = [
			{ stock_id: "ml", units_window: 18, days_with_stock: 90 },
			{ stock_id: "fba", units_window: 18, days_with_stock: 72 },
		]
		repo.physical = [physicalSupply({ qtde: 5 })]

		const { alerts } = await sut.execute()

		expect(alerts.find((a) => a.stock_id === "fba")?.suggested_quantity).toBe(5)
		expect(alerts.find((a) => a.stock_id === "ml")?.suggested_quantity).toBe(0)
	})

	it("reserva estoque físico para as vendas diretas", async () => {
		// Balcao vende 18 em 90 dias = 0,2/dia -> reserva 15 dias = 3 unidades.
		// `units_window` do fisico ja chega filtrado pelo canal Direto.
		repo.fullStocks = [fullStock({ stock_id: "lilian", qtde: 1 })]
		repo.demand = [{ stock_id: "lilian", units_window: 45, days_with_stock: 90 }]
		repo.physical = [physicalSupply({ qtde: 10, units_window: 18 })]

		const { alerts } = await sut.execute()

		expect(alerts[0].suggested_quantity).toBe(7)
	})

	it("soma todos os depósitos físicos, não só o maior", async () => {
		// O mesmo relogio mora parte no Galpao e parte na Loja Centro. Um envio
		// pode ter itens saindo de origens diferentes, entao o que da para mandar
		// e a soma — olhar so o maior deposito dizia "limitado pelo fisico" com
		// mercadoria em casa.
		repo.fullStocks = [fullStock({ stock_id: "lilian", qtde: 1 })]
		repo.demand = [{ stock_id: "lilian", units_window: 18, days_with_stock: 90 }]
		repo.physical = [
			{
				product_id: "prod-1",
				units_window: 0,
				deposits: [
					{ stock_id: "galpao", stock_title: "Galpão", qtde: 3 },
					{ stock_id: "loja", stock_title: "Loja Centro", qtde: 5 },
				],
			},
		]

		const { alerts } = await sut.execute()

		expect(alerts[0].physical_total_qty).toBe(8)
		expect(alerts[0].suggested_quantity).toBe(8)
		expect(alerts[0].shortfall_reason).toBeNull()
	})

	it("divide a sugestão entre os depósitos, do mais cheio para o mais vazio", async () => {
		repo.fullStocks = [fullStock({ stock_id: "lilian", qtde: 1 })]
		repo.demand = [{ stock_id: "lilian", units_window: 18, days_with_stock: 90 }]
		repo.physical = [
			{
				product_id: "prod-1",
				units_window: 0,
				deposits: [
					{ stock_id: "galpao", stock_title: "Galpão", qtde: 3 },
					{ stock_id: "loja", stock_title: "Loja Centro", qtde: 5 },
				],
			},
		]

		const { alerts } = await sut.execute()

		expect(alerts[0].sources).toEqual([
			{ stock_id: "loja", stock_title: "Loja Centro", quantity: 5 },
			{ stock_id: "galpao", stock_title: "Galpão", quantity: 3 },
		])
	})

	it("nunca sugere além do teto de dias do marketplace", async () => {
		repo.fullStocks = [fullStock({ stock_id: "lilian", qtde: 0 })]
		repo.demand = [{ stock_id: "lilian", units_window: 90, days_with_stock: 90 }]
		repo.physical = [physicalSupply({ qtde: 500 })]

		const { alerts } = await sut.execute()

		// 1 unidade/dia: alvo de 45 dias, jamais acima do teto de 90.
		expect(alerts[0].suggested_quantity).toBeLessThanOrEqual(MARKETPLACE_PARAMS.mercado_livre.maxDays)
		expect(alerts[0].suggested_quantity).toBe(MARKETPLACE_PARAMS.mercado_livre.targetDays)
	})
})

describe("FetchFullReplenishmentAlertsUseCase — por que a sugestão ficou curta", () => {
	// O deposito precisa de 8 unidades em todos estes casos: 0,2/dia, alvo ML de
	// 45 dias = 9, menos 1 que ja esta la.
	beforeEach(() => {
		repo.fullStocks = [fullStock({ stock_id: "lilian", qtde: 1 })]
		repo.demand = [{ stock_id: "lilian", units_window: 18, days_with_stock: 90 }]
	})

	it("aponta a reserva de venda direta quando é ela que segura o saldo", async () => {
		// 3 no fisico e 18 vendas diretas em 90 dias: a reserva de 15 dias come as
		// 3. Dizer so "limitado pelo fisico" ao lado de um saldo de 3 e o que
		// parecia inconsistente na tela.
		repo.physical = [physicalSupply({ qtde: 3, units_window: 18 })]

		const { alerts } = await sut.execute()

		expect(alerts[0].needed_quantity).toBe(8)
		expect(alerts[0].suggested_quantity).toBe(0)
		expect(alerts[0].physical_total_qty).toBe(3)
		expect(alerts[0].physical_reserved_qty).toBe(3)
		expect(alerts[0].physical_available_qty).toBe(0)
		expect(alerts[0].shortfall_reason).toBe("reserva_venda_direta")
	})

	it("distingue não ter estoque de ter pouco", async () => {
		repo.physical = []

		const semEstoque = await sut.execute()

		expect(semEstoque.alerts[0].shortfall_reason).toBe("sem_estoque_fisico")
		expect(semEstoque.alerts[0].sources).toEqual([])

		repo.physical = [physicalSupply({ qtde: 2 })]

		const pouco = await sut.execute()

		expect(pouco.alerts[0].shortfall_reason).toBe("estoque_insuficiente")
		expect(pouco.alerts[0].suggested_quantity).toBe(2)
	})

	it("não oferece de novo o saldo já prometido a um rascunho", async () => {
		// O rascunho nao debita a origem. Sem descontar, as mesmas 8 unidades
		// seriam sugeridas para o ML tambem, e o despacho dos dois nao caberia.
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", qtde: 1 }),
			fullStock({ stock_id: "fba", stock_title: "Amazon", marketplace: "amazon", qtde: 0 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 18, days_with_stock: 90 },
			{ stock_id: "fba", units_window: 18, days_with_stock: 90 },
		]
		repo.physical = [physicalSupply({ qtde: 8 })]
		repo.inTransit = [{ destination_stock_id: "fba", quantity: 8 }]
		repo.drafted = [{ source_stock_id: "fisico-1", quantity: 8 }]

		const { alerts } = await sut.execute()

		const lilian = alerts.find((a) => a.stock_id === "lilian")
		expect(lilian?.physical_committed_qty).toBe(8)
		expect(lilian?.suggested_quantity).toBe(0)
		expect(lilian?.shortfall_reason).toBe("rascunho_pendente")
	})
})

describe("FetchFullReplenishmentAlertsUseCase — estoque parado", () => {
	it("sinaliza depósito full sem nenhuma venda na janela", async () => {
		repo.fullStocks = [fullStock({ stock_id: "laurinda", stock_title: "Laurinda", qtde: 17 })]
		repo.demand = [{ stock_id: "laurinda", units_window: 0, days_with_stock: 90 }]
		repo.physical = [physicalSupply()]

		const { alerts, idle } = await sut.execute()

		expect(alerts).toHaveLength(0)
		expect(idle).toHaveLength(1)
		expect(idle[0].stock_id).toBe("laurinda")
		expect(idle[0].days_of_autonomy).toBeNull()
	})

	it("sinaliza autonomia acima do teto do marketplace", async () => {
		// 17 unidades a 0,05/dia = 340 dias.
		repo.fullStocks = [fullStock({ stock_id: "laurinda", qtde: 17 })]
		repo.demand = [{ stock_id: "laurinda", units_window: 4, days_with_stock: 90 }]
		repo.physical = [physicalSupply()]

		const { alerts, idle } = await sut.execute()

		expect(alerts).toHaveLength(0)
		expect(idle[0].days_of_autonomy).toBeGreaterThan(MARKETPLACE_PARAMS.mercado_livre.maxDays)
	})

	it("não considera parado um depósito vazio", async () => {
		repo.fullStocks = [fullStock({ stock_id: "lilian", qtde: 0 })]
		repo.demand = [{ stock_id: "lilian", units_window: 0, days_with_stock: 0 }]
		repo.physical = [physicalSupply()]

		const { idle } = await sut.execute()

		expect(idle).toHaveLength(0)
	})
})

describe("FetchFullReplenishmentAlertsUseCase — ordenação", () => {
	it("coloca os críticos primeiro e os de menor autonomia no topo", async () => {
		repo.fullStocks = [
			fullStock({ stock_id: "a", product_id: "p-a", sku: "A", qtde: 2 }),
			fullStock({ stock_id: "b", product_id: "p-b", sku: "B", qtde: 1 }),
			fullStock({ stock_id: "c", product_id: "p-c", sku: "C", qtde: 26 }),
		]
		repo.demand = [
			// a e c ficam em "atencao" (10 e 13 dias), b em "critico" (5 dias).
			{ stock_id: "a", units_window: 18, days_with_stock: 90 },
			{ stock_id: "b", units_window: 18, days_with_stock: 90 },
			{ stock_id: "c", units_window: 180, days_with_stock: 90 },
		]
		repo.physical = [
			physicalSupply({ product_id: "p-a" }),
			physicalSupply({ product_id: "p-b" }),
			physicalSupply({ product_id: "p-c" }),
		]

		const { alerts } = await sut.execute()

		expect(alerts.map((a) => a.stock_id)).toEqual(["b", "a", "c"])
	})
})
