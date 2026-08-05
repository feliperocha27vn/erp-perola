import { InvalidShipmentTransitionError } from "../../errors/invalid-shipment-transition-error.js"
import { ShipmentNotFoundError } from "../../errors/shipment-not-found-error.js"
import type { ShipmentRepository } from "../../repositories/shipment-repository.js"
import type { StockEntryRepository } from "../../repositories/stock-entry-repository.js"
import type { StockRepository } from "../../repositories/stock-repository.js"

interface ReceiveShipmentUseCaseRequest {
	shipmentId: string
}

/**
 * em_transito -> recebido.
 *
 * Credita o estoque full de destino: a partir daqui a mercadoria esta disponivel
 * para venda no CD, que e o significado de qtde num estoque full. A origem ja foi
 * debitada no despacho.
 */
export class ReceiveShipmentUseCase {
	constructor(
		private shipmentRepo: ShipmentRepository,
		private stockRepo: StockRepository,
		private stockEntryRepo: StockEntryRepository,
	) {}

	async execute({ shipmentId }: ReceiveShipmentUseCaseRequest) {
		const shipment = await this.shipmentRepo.getById(shipmentId)
		if (!shipment) throw new ShipmentNotFoundError()
		if (shipment.status !== "em_transito") {
			throw new InvalidShipmentTransitionError(shipment.status, "em_transito")
		}

		const note = `Envio #${shipmentId} — recebido no CD`

		for (const item of shipment.items) {
			const destinationStock = await this.stockRepo.getById(item.destination_stock_id)
			if (!destinationStock) throw new ShipmentNotFoundError()

			await this.stockRepo.update(item.destination_stock_id, {
				qtde: destinationStock.qtde + item.quantity,
			})
			await this.stockEntryRepo.create({
				stock_id: item.destination_stock_id,
				quantity: item.quantity,
				notes: note,
			})
		}

		await this.shipmentRepo.updateStatus(shipmentId, "recebido")
	}
}
