import { beforeEach, describe, expect, it } from "vitest"
import { InsufficientStockError } from "../../errors/insufficient-stock-error.js"
import { StockNotFoundError } from "../../errors/stock-not-found-error.js"
import type { ProductStock } from "../../repositories/product-repository.js"
import type { CreateStockEntryInput, StockEntryRow } from "../../repositories/stock-entry-repository.js"
import type { StockRepository } from "../../repositories/stock-repository.js"
import { CreateStockExitUseCase } from "./create-stock-exit.js"

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

	async create(data: CreateStockEntryInput) {
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

function makeStock(qtde: number): ProductStock {
	return {
		id: "stock-1",
		product_id: "prod-1",
		title: "Físico",
		qtde,
		full: false,
		marketplace: null,
		store_id: null,
		created_at: new Date(),
		updated_at: new Date(),
	}
}

describe("CreateStockExitUseCase", () => {
	let stockRepo: FakeStockRepository
	let stockEntryRepo: FakeStockEntryRepository
	let sut: CreateStockExitUseCase

	beforeEach(() => {
		stockRepo = new FakeStockRepository()
		stockEntryRepo = new FakeStockEntryRepository()
		sut = new CreateStockExitUseCase(
			stockRepo as unknown as StockRepository,
			stockEntryRepo as never,
		)
	})

	it("debita a quantidade do estoque", async () => {
		stockRepo.stocks.set("stock-1", makeStock(10))

		await sut.execute({ stockId: "stock-1", quantity: 4, notes: null })

		expect(stockRepo.stocks.get("stock-1")?.qtde).toBe(6)
	})

	it("registra a saida como lancamento negativo com a observacao", async () => {
		stockRepo.stocks.set("stock-1", makeStock(10))

		const { entry } = await sut.execute({
			stockId: "stock-1",
			quantity: 4,
			notes: "Avaria",
		})

		expect(entry.quantity).toBe(-4)
		expect(stockEntryRepo.entries).toHaveLength(1)
		expect(stockEntryRepo.entries[0]).toMatchObject({
			stock_id: "stock-1",
			quantity: -4,
			notes: "Avaria",
		})
	})

	it("permite zerar o estoque", async () => {
		stockRepo.stocks.set("stock-1", makeStock(3))

		await sut.execute({ stockId: "stock-1", quantity: 3, notes: null })

		expect(stockRepo.stocks.get("stock-1")?.qtde).toBe(0)
	})

	it("recusa retirar mais do que ha no estoque sem mexer em nada", async () => {
		stockRepo.stocks.set("stock-1", makeStock(2))

		await expect(
			sut.execute({ stockId: "stock-1", quantity: 3, notes: null }),
		).rejects.toBeInstanceOf(InsufficientStockError)

		expect(stockRepo.stocks.get("stock-1")?.qtde).toBe(2)
		expect(stockEntryRepo.entries).toHaveLength(0)
	})

	it("falha quando o estoque nao existe", async () => {
		await expect(
			sut.execute({ stockId: "inexistente", quantity: 1, notes: null }),
		).rejects.toBeInstanceOf(StockNotFoundError)

		expect(stockEntryRepo.entries).toHaveLength(0)
	})
})
