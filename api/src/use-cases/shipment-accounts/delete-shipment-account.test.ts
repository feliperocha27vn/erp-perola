import { describe, expect, it } from "vitest"
import { ShipmentAccountNotFoundError } from "../../errors/shipment-account-not-found-error.js"
import { InMemoryShipmentAccountRepository } from "../../repositories/in-memory/in-memory-shipment-account-repository.js"
import { DeleteShipmentAccountUseCase } from "./delete-shipment-account.js"

describe("DeleteShipmentAccountUseCase", () => {
	it("exclui uma conta existente", async () => {
		const repo = new InMemoryShipmentAccountRepository()
		const account = await repo.create({ name: "Lilian" })
		const useCase = new DeleteShipmentAccountUseCase(repo)

		await useCase.execute({ id: account.id })

		expect(repo.items).toHaveLength(0)
	})

	it("lança erro se conta não existe", async () => {
		const repo = new InMemoryShipmentAccountRepository()
		const useCase = new DeleteShipmentAccountUseCase(repo)

		await expect(useCase.execute({ id: "inexistente" })).rejects.toBeInstanceOf(
			ShipmentAccountNotFoundError,
		)
	})
})
