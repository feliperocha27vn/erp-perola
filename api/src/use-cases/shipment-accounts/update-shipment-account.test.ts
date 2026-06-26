import { describe, expect, it } from "vitest"
import { ShipmentAccountNameAlreadyExistsError } from "../../errors/shipment-account-name-already-exists-error.js"
import { ShipmentAccountNotFoundError } from "../../errors/shipment-account-not-found-error.js"
import { InMemoryShipmentAccountRepository } from "../../repositories/in-memory/in-memory-shipment-account-repository.js"
import { UpdateShipmentAccountUseCase } from "./update-shipment-account.js"

describe("UpdateShipmentAccountUseCase", () => {
	it("atualiza o nome da conta", async () => {
		const repo = new InMemoryShipmentAccountRepository()
		await repo.create({ name: "Lilian" })
		const existing = await repo.getByName("Lilian")
		const useCase = new UpdateShipmentAccountUseCase(repo)

		const { account } = await useCase.execute({ id: existing!.id, name: "Lilian Amazon" })

		expect(account.name).toBe("Lilian Amazon")
	})

	it("lança erro se conta não existe", async () => {
		const repo = new InMemoryShipmentAccountRepository()
		const useCase = new UpdateShipmentAccountUseCase(repo)

		await expect(
			useCase.execute({ id: "inexistente", name: "Qualquer" }),
		).rejects.toBeInstanceOf(ShipmentAccountNotFoundError)
	})

	it("lança erro se o novo nome já está em uso por outra conta", async () => {
		const repo = new InMemoryShipmentAccountRepository()
		await repo.create({ name: "Lilian" })
		const santo = await repo.create({ name: "Santo" })
		const useCase = new UpdateShipmentAccountUseCase(repo)

		await expect(
			useCase.execute({ id: santo.id, name: "Lilian" }),
		).rejects.toBeInstanceOf(ShipmentAccountNameAlreadyExistsError)
	})
})
