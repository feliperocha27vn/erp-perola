import { describe, expect, it } from "vitest"
import { InsufficientStockError } from "../../errors/insufficient-stock-error.js"
import { InvalidShipmentTransitionError } from "../../errors/invalid-shipment-transition-error.js"
import { ShipmentNotFoundError } from "../../errors/shipment-not-found-error.js"
import { InMemoryShipmentAccountRepository } from "../../repositories/in-memory/in-memory-shipment-account-repository.js"
import { InMemoryShipmentRepository } from "../../repositories/in-memory/in-memory-shipment-repository.js"
import type { ProductStock } from "../../repositories/product-repository.js"
import type { StockEntryRow } from "../../repositories/stock-entry-repository.js"
import type { StockRepository } from "../../repositories/stock-repository.js"
import { DispatchShipmentUseCase } from "./dispatch-shipment.js"

class FakeStockRepository implements Pick<StockRepository, "getById" | "update"> {
	public stocks: Map<string, ProductStock> = new Map()

	async getById(id: string) {
		return this.stocks.get(id) ?? null
	}

	async update(id: string, data: { qtde?: number }) {
		const stock = this.stocks.get(id)
		if (!stock) return null
		const updated = { ...stock, ...(data.qtde !== undefined && { qtde: data.qtde }) }
		this.stocks.set(id, updated)
		return updated
	}
}

class FakeStockEntryRepository {
	public entries: StockEntryRow[] = []

	async create(data: { stock_id: string; quantity: number; notes: string | null }) {
		const entry: StockEntryRow = {
			id: crypto.randomUUID(),
			stock_id: data.stock_id,
			quantity: data.quantity,
			notes: data.notes,
			created_at: new Date(),
		}
		this.entries.push(entry)
		return entry
	}
}

function makeStock(id: string, qtde: number, full: boolean): ProductStock {
	return {
		id,
		product_id: "prod-1",
		title: full ? "Laurinda" : "Físico",
		qtde,
		full,
		marketplace: full ? "mercado_livre" : null,
		store_id: null,
		created_at: new Date(),
		updated_at: new Date(),
	}
}

async function setup(sourceQtde = 10) {
	const accountRepo = new InMemoryShipmentAccountRepository()
	const account = await accountRepo.create({ name: "Laurinda ML" })

	const shipmentRepo = new InMemoryShipmentRepository()
	shipmentRepo.accountNames.set(account.id, account.name)

	const shipment = await shipmentRepo.create({
		account_id: account.id,
		date: new Date(),
		notes: null,
		items: [
			{
				product_id: "prod-1",
				quantity: 3,
				source_stock_id: "stock-src",
				destination_stock_id: "stock-dst",
			},
		],
	})

	const stockRepo = new FakeStockRepository()
	stockRepo.stocks.set("stock-src", makeStock("stock-src", sourceQtde, false))
	stockRepo.stocks.set("stock-dst", makeStock("stock-dst", 0, true))

	const entryRepo = new FakeStockEntryRepository()

	return { shipmentRepo, stockRepo, entryRepo, shipmentId: shipment.id }
}

describe("DispatchShipmentUseCase", () => {
	it("debita a origem e NÃO credita o destino", async () => {
		const { shipmentRepo, stockRepo, entryRepo, shipmentId } = await setup(10)
		const useCase = new DispatchShipmentUseCase(
			shipmentRepo,
			stockRepo as never,
			entryRepo as never,
		)

		await useCase.execute({ shipmentId })

		const updated = await shipmentRepo.getById(shipmentId)
		expect(updated?.status).toBe("em_transito")
		expect(stockRepo.stocks.get("stock-src")?.qtde).toBe(7)
		// O destino so recebe no check-in do CD — ate la nao esta disponivel para venda.
		expect(stockRepo.stocks.get("stock-dst")?.qtde).toBe(0)
	})

	it("registra apenas o lançamento negativo na origem", async () => {
		const { shipmentRepo, stockRepo, entryRepo, shipmentId } = await setup(10)
		const useCase = new DispatchShipmentUseCase(
			shipmentRepo,
			stockRepo as never,
			entryRepo as never,
		)

		await useCase.execute({ shipmentId })

		expect(entryRepo.entries).toHaveLength(1)
		expect(entryRepo.entries[0].stock_id).toBe("stock-src")
		expect(entryRepo.entries[0].quantity).toBe(-3)
	})

	it("lança erro se estoque insuficiente", async () => {
		const { shipmentRepo, stockRepo, entryRepo, shipmentId } = await setup(2)
		const useCase = new DispatchShipmentUseCase(
			shipmentRepo,
			stockRepo as never,
			entryRepo as never,
		)

		await expect(useCase.execute({ shipmentId })).rejects.toBeInstanceOf(InsufficientStockError)
	})

	it("não debita nada se um item do envio não couber no estoque", async () => {
		const { shipmentRepo, stockRepo, entryRepo, shipmentId } = await setup(2)
		const useCase = new DispatchShipmentUseCase(
			shipmentRepo,
			stockRepo as never,
			entryRepo as never,
		)

		await expect(useCase.execute({ shipmentId })).rejects.toThrow()

		expect(stockRepo.stocks.get("stock-src")?.qtde).toBe(2)
		expect(entryRepo.entries).toHaveLength(0)
	})

	it("lança erro se envio não existe", async () => {
		const { shipmentRepo, stockRepo, entryRepo } = await setup()
		const useCase = new DispatchShipmentUseCase(
			shipmentRepo,
			stockRepo as never,
			entryRepo as never,
		)

		await expect(useCase.execute({ shipmentId: "inexistente" })).rejects.toBeInstanceOf(
			ShipmentNotFoundError,
		)
	})

	it("lança erro se o envio já saiu do rascunho", async () => {
		const { shipmentRepo, stockRepo, entryRepo, shipmentId } = await setup(10)
		const useCase = new DispatchShipmentUseCase(
			shipmentRepo,
			stockRepo as never,
			entryRepo as never,
		)

		await useCase.execute({ shipmentId })

		await expect(useCase.execute({ shipmentId })).rejects.toBeInstanceOf(
			InvalidShipmentTransitionError,
		)
	})
})
