import { InsufficientStockError } from "../../errors/insufficient-stock-error.js"
import { ShipmentAlreadyConfirmedError } from "../../errors/shipment-already-confirmed-error.js"
import { ShipmentNotFoundError } from "../../errors/shipment-not-found-error.js"
import type { StockEntryRepository } from "../../repositories/stock-entry-repository.js"
import type { ShipmentRepository } from "../../repositories/shipment-repository.js"
import type { StockRepository } from "../../repositories/stock-repository.js"

interface ConfirmShipmentUseCaseRequest {
	shipmentId: string
}

export class ConfirmShipmentUseCase {
	constructor(
		private shipmentRepo: ShipmentRepository,
		private stockRepo: StockRepository,
		private stockEntryRepo: StockEntryRepository,
	) {}

	async execute({ shipmentId }: ConfirmShipmentUseCaseRequest) {
		const shipment = await this.shipmentRepo.getById(shipmentId)
		if (!shipment) throw new ShipmentNotFoundError()
		if (shipment.status === "confirmado") throw new ShipmentAlreadyConfirmedError()

		for (const item of shipment.items) {
			const sourceStock = await this.stockRepo.getById(item.source_stock_id)
			if (!sourceStock) throw new ShipmentNotFoundError()

			if (sourceStock.qtde < item.quantity) {
				throw new InsufficientStockError(item.product_id, sourceStock.qtde, item.quantity)
			}
		}

		const note = `Envio FBA #${shipmentId}`

		for (const item of shipment.items) {
			const sourceStock = await this.stockRepo.getById(item.source_stock_id)
			const destinationStock = await this.stockRepo.getById(item.destination_stock_id)

			await this.stockRepo.update(item.source_stock_id, {
				qtde: sourceStock!.qtde - item.quantity,
			})
			await this.stockEntryRepo.create({
				stock_id: item.source_stock_id,
				quantity: -item.quantity,
				notes: note,
			})

			await this.stockRepo.update(item.destination_stock_id, {
				qtde: destinationStock!.qtde + item.quantity,
			})
			await this.stockEntryRepo.create({
				stock_id: item.destination_stock_id,
				quantity: item.quantity,
				notes: note,
			})
		}

		await this.shipmentRepo.updateStatus(shipmentId, "confirmado")
	}
}
