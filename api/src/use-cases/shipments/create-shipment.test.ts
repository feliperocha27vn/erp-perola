import { describe, expect, it } from "vitest"
import { ShipmentAccountNotFoundError } from "../../errors/shipment-account-not-found-error.js"
import { InMemoryShipmentAccountRepository } from "../../repositories/in-memory/in-memory-shipment-account-repository.js"
import { InMemoryShipmentRepository } from "../../repositories/in-memory/in-memory-shipment-repository.js"
import { CreateShipmentUseCase } from "./create-shipment.js"

describe("CreateShipmentUseCase", () => {
	it("cria um envio em rascunho", async () => {
		const accountRepo = new InMemoryShipmentAccountRepository()
		const account = await accountRepo.create({ name: "Lilian Amazon" })
		const shipmentRepo = new InMemoryShipmentRepository()
		shipmentRepo.accountNames.set(account.id, account.name)

		const useCase = new CreateShipmentUseCase(accountRepo, shipmentRepo)

		const { shipment } = await useCase.execute({
			account_id: account.id,
			date: new Date("2026-06-26"),
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

		expect(shipment.status).toBe("rascunho")
		expect(shipment.items).toHaveLength(1)
		expect(shipment.account_name).toBe("Lilian Amazon")
	})

	it("lança erro se a conta não existe", async () => {
		const accountRepo = new InMemoryShipmentAccountRepository()
		const shipmentRepo = new InMemoryShipmentRepository()
		const useCase = new CreateShipmentUseCase(accountRepo, shipmentRepo)

		await expect(
			useCase.execute({
				account_id: "inexistente",
				date: new Date(),
				notes: null,
				items: [],
			}),
		).rejects.toBeInstanceOf(ShipmentAccountNotFoundError)
	})
})
