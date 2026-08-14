import { describe, expect, it } from "vitest"
import { InvalidShipmentTransitionError } from "../../errors/invalid-shipment-transition-error.js"
import { ShipmentNotFoundError } from "../../errors/shipment-not-found-error.js"
import { InMemoryShipmentAccountRepository } from "../../repositories/in-memory/in-memory-shipment-account-repository.js"
import { InMemoryShipmentRepository } from "../../repositories/in-memory/in-memory-shipment-repository.js"
import type { ProductStock } from "../../repositories/product-repository.js"
import type { StockEntryRow } from "../../repositories/stock-entry-repository.js"
import type { StockRepository } from "../../repositories/stock-repository.js"
import { DispatchShipmentUseCase } from "./dispatch-shipment.js"
import { ReceiveShipmentUseCase } from "./receive-shipment.js"

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

async function setup() {
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
	stockRepo.stocks.set("stock-src", makeStock("stock-src", 10, false))
	stockRepo.stocks.set("stock-dst", makeStock("stock-dst", 0, true))

	const entryRepo = new FakeStockEntryRepository()

	return { shipmentRepo, stockRepo, entryRepo, shipmentId: shipment.id }
}

describe("ReceiveShipmentUseCase", () => {
	it("credita o destino ao dar entrada no CD", async () => {
		const { shipmentRepo, stockRepo, entryRepo, shipmentId } = await setup()
		const dispatch = new DispatchShipmentUseCase(
			shipmentRepo,
			stockRepo as never,
			entryRepo as never,
		)
		const receive = new ReceiveShipmentUseCase(shipmentRepo, stockRepo as never, entryRepo as never)

		await dispatch.execute({ shipmentId })
		await receive.execute({ shipmentId })

		const updated = await shipmentRepo.getById(shipmentId)
		expect(updated?.status).toBe("recebido")
		expect(stockRepo.stocks.get("stock-dst")?.qtde).toBe(3)
		// A origem ja tinha sido debitada no despacho, nao debita de novo.
		expect(stockRepo.stocks.get("stock-src")?.qtde).toBe(7)
	})

	it("registra o lançamento positivo no destino", async () => {
		const { shipmentRepo, stockRepo, entryRepo, shipmentId } = await setup()
		const dispatch = new DispatchShipmentUseCase(
			shipmentRepo,
			stockRepo as never,
			entryRepo as never,
		)
		const receive = new ReceiveShipmentUseCase(shipmentRepo, stockRepo as never, entryRepo as never)

		await dispatch.execute({ shipmentId })
		await receive.execute({ shipmentId })

		expect(entryRepo.entries).toHaveLength(2)
		const destinationEntry = entryRepo.entries.find((e) => e.stock_id === "stock-dst")
		expect(destinationEntry?.quantity).toBe(3)
	})

	it("não deixa receber um envio que ainda é rascunho", async () => {
		const { shipmentRepo, stockRepo, entryRepo, shipmentId } = await setup()
		const receive = new ReceiveShipmentUseCase(shipmentRepo, stockRepo as never, entryRepo as never)

		await expect(receive.execute({ shipmentId })).rejects.toBeInstanceOf(
			InvalidShipmentTransitionError,
		)
	})

	it("não deixa receber duas vezes", async () => {
		const { shipmentRepo, stockRepo, entryRepo, shipmentId } = await setup()
		const dispatch = new DispatchShipmentUseCase(
			shipmentRepo,
			stockRepo as never,
			entryRepo as never,
		)
		const receive = new ReceiveShipmentUseCase(shipmentRepo, stockRepo as never, entryRepo as never)

		await dispatch.execute({ shipmentId })
		await receive.execute({ shipmentId })

		await expect(receive.execute({ shipmentId })).rejects.toBeInstanceOf(
			InvalidShipmentTransitionError,
		)
		expect(stockRepo.stocks.get("stock-dst")?.qtde).toBe(3)
	})

	it("lança erro se envio não existe", async () => {
		const { shipmentRepo, stockRepo, entryRepo } = await setup()
		const receive = new ReceiveShipmentUseCase(shipmentRepo, stockRepo as never, entryRepo as never)

		await expect(receive.execute({ shipmentId: "inexistente" })).rejects.toBeInstanceOf(
			ShipmentNotFoundError,
		)
	})
})
