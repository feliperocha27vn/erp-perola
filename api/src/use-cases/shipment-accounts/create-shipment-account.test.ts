import { describe, expect, it } from "vitest"
import { ShipmentAccountNameAlreadyExistsError } from "../../errors/shipment-account-name-already-exists-error.js"
import { InMemoryShipmentAccountRepository } from "../../repositories/in-memory/in-memory-shipment-account-repository.js"
import { CreateShipmentAccountUseCase } from "./create-shipment-account.js"

describe("CreateShipmentAccountUseCase", () => {
	it("cria uma conta com nome válido", async () => {
		const repo = new InMemoryShipmentAccountRepository()
		const useCase = new CreateShipmentAccountUseCase(repo)

		const { account } = await useCase.execute({ name: "Lilian" })

		expect(account.name).toBe("Lilian")
		expect(account.id).toBeDefined()
	})

	it("lança erro se o nome já existe", async () => {
		const repo = new InMemoryShipmentAccountRepository()
		const useCase = new CreateShipmentAccountUseCase(repo)

		await useCase.execute({ name: "Lilian" })

		await expect(useCase.execute({ name: "Lilian" })).rejects.toBeInstanceOf(
			ShipmentAccountNameAlreadyExistsError,
		)
	})
})
