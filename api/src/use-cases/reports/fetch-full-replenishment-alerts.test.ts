import { beforeEach, describe, expect, it } from "vitest"
import type {
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
	public physical: PhysicalSupplyRow[] = []
	public inTransit: InTransitRow[] = []

	async fetchFullStocks() {
		return this.fullStocks
	}
	async fetchFullStockDemand() {
		return this.demand
	}
	async fetchPhysicalSupply() {
		return this.physical
	}
	async fetchInTransitQuantities() {
		return this.inTransit
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
		...overrides,
	}
}

function physicalSupply(overrides: Partial<PhysicalSupplyRow> = {}): PhysicalSupplyRow {
	return {
		product_id: "prod-1",
		stock_id: "fisico-1",
		stock_title: "Físico",
		qtde: 24,
		units_window: 0,
		...overrides,
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
		repo.physical = [physicalSupply(), physicalSupply({ product_id: "prod-2", stock_id: "f2" })]

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

	it("serve primeiro quem tem menos autonomia quando o físico não dá para todos", async () => {
		repo.fullStocks = [
			fullStock({ stock_id: "lilian", stock_title: "Lilian", qtde: 1 }),
			fullStock({ stock_id: "fba", stock_title: "Amazon", marketplace: "amazon", qtde: 4 }),
		]
		repo.demand = [
			{ stock_id: "lilian", units_window: 45, days_with_stock: 90 },
			{ stock_id: "fba", units_window: 45, days_with_stock: 90 },
		]
		// Ambos querem mais de 20 unidades, mas so ha 5 no fisico.
		repo.physical = [physicalSupply({ qtde: 5 })]

		const { alerts } = await sut.execute()

		const lilian = alerts.find((a) => a.stock_id === "lilian")
		const fba = alerts.find((a) => a.stock_id === "fba")

		expect(lilian?.suggested_quantity).toBe(5)
		expect(fba?.suggested_quantity).toBe(0)
		expect(fba?.limited_by_physical_stock).toBe(true)
	})

	it("reserva estoque físico para as vendas diretas", async () => {
		// Fisico vende 18 em 90 dias = 0,2/dia -> reserva 15 dias = 3 unidades.
		repo.fullStocks = [fullStock({ stock_id: "lilian", qtde: 1 })]
		repo.demand = [{ stock_id: "lilian", units_window: 45, days_with_stock: 90 }]
		repo.physical = [physicalSupply({ qtde: 10, units_window: 18 })]

		const { alerts } = await sut.execute()

		expect(alerts[0].suggested_quantity).toBe(7)
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
			physicalSupply({ product_id: "p-a", stock_id: "fa" }),
			physicalSupply({ product_id: "p-b", stock_id: "fb" }),
			physicalSupply({ product_id: "p-c", stock_id: "fc" }),
		]

		const { alerts } = await sut.execute()

		expect(alerts.map((a) => a.stock_id)).toEqual(["b", "a", "c"])
	})
})
