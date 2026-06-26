import { describe, expect, it } from "vitest"
import { InsufficientStockError } from "../../errors/insufficient-stock-error.js"
import { ShipmentAlreadyConfirmedError } from "../../errors/shipment-already-confirmed-error.js"
import { ShipmentNotFoundError } from "../../errors/shipment-not-found-error.js"
import { InMemoryShipmentAccountRepository } from "../../repositories/in-memory/in-memory-shipment-account-repository.js"
import { InMemoryShipmentRepository } from "../../repositories/in-memory/in-memory-shipment-repository.js"
import type { ProductStock } from "../../repositories/product-repository.js"
import type { StockEntryRow } from "../../repositories/stock-entry-repository.js"
import type { StockRepository } from "../../repositories/stock-repository.js"
import { ConfirmShipmentUseCase } from "./confirm-shipment.js"

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

function makeStock(id: string, qtde: number): ProductStock {
	return {
		id,
		product_id: "prod-1",
		title: "Galpão",
		qtde,
		full: false,
		created_at: new Date(),
		updated_at: new Date(),
	}
}

describe("ConfirmShipmentUseCase", () => {
	async function setup(sourceQtde = 10) {
		const accountRepo = new InMemoryShipmentAccountRepository()
		const account = await accountRepo.create({ name: "Lilian Amazon" })

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
		stockRepo.stocks.set("stock-src", makeStock("stock-src", sourceQtde))
		stockRepo.stocks.set("stock-dst", makeStock("stock-dst", 0))

		const entryRepo = new FakeStockEntryRepository()

		return { shipmentRepo, stockRepo, entryRepo, shipmentId: shipment.id }
	}

	it("confirma o envio e move o estoque", async () => {
		const { shipmentRepo, stockRepo, entryRepo, shipmentId } = await setup(10)
		const useCase = new ConfirmShipmentUseCase(shipmentRepo, stockRepo as any, entryRepo as any)

		await useCase.execute({ shipmentId })

		const updated = await shipmentRepo.getById(shipmentId)
		expect(updated?.status).toBe("confirmado")
		expect(stockRepo.stocks.get("stock-src")?.qtde).toBe(7)
		expect(stockRepo.stocks.get("stock-dst")?.qtde).toBe(3)
		expect(entryRepo.entries).toHaveLength(2)
		expect(entryRepo.entries.find((e) => e.stock_id === "stock-src")?.quantity).toBe(-3)
		expect(entryRepo.entries.find((e) => e.stock_id === "stock-dst")?.quantity).toBe(3)
	})

	it("lança erro se estoque insuficiente", async () => {
		const { shipmentRepo, stockRepo, entryRepo, shipmentId } = await setup(2)
		const useCase = new ConfirmShipmentUseCase(shipmentRepo, stockRepo as any, entryRepo as any)

		await expect(useCase.execute({ shipmentId })).rejects.toBeInstanceOf(InsufficientStockError)
	})

	it("lança erro se envio não existe", async () => {
		const { shipmentRepo, stockRepo, entryRepo } = await setup()
		const useCase = new ConfirmShipmentUseCase(shipmentRepo, stockRepo as any, entryRepo as any)

		await expect(useCase.execute({ shipmentId: "inexistente" })).rejects.toBeInstanceOf(
			ShipmentNotFoundError,
		)
	})

	it("lança erro se envio já foi confirmado", async () => {
		const { shipmentRepo, stockRepo, entryRepo, shipmentId } = await setup(10)
		const useCase = new ConfirmShipmentUseCase(shipmentRepo, stockRepo as any, entryRepo as any)

		await useCase.execute({ shipmentId })

		await expect(useCase.execute({ shipmentId })).rejects.toBeInstanceOf(
			ShipmentAlreadyConfirmedError,
		)
	})
})
