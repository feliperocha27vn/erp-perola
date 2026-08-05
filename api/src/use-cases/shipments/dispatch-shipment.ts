import { InsufficientStockError } from "../../errors/insufficient-stock-error.js"
import { InvalidShipmentTransitionError } from "../../errors/invalid-shipment-transition-error.js"
import { ShipmentNotFoundError } from "../../errors/shipment-not-found-error.js"
import type { ShipmentRepository } from "../../repositories/shipment-repository.js"
import type { StockEntryRepository } from "../../repositories/stock-entry-repository.js"
import type { StockRepository } from "../../repositories/stock-repository.js"

interface DispatchShipmentUseCaseRequest {
	shipmentId: string
}

/**
 * rascunho -> em_transito.
 *
 * Debita o estoque de origem, porque a mercadoria saiu fisicamente do galpao.
 * NAO credita o destino: no CD ela so fica vendavel apos o check-in, e creditar
 * agora inflaria os Dias de Autonomia durante todo o lead time — justamente a
 * janela em que a ruptura e mais provavel. Ver ADR 0006.
 */
export class DispatchShipmentUseCase {
	constructor(
		private shipmentRepo: ShipmentRepository,
		private stockRepo: StockRepository,
		private stockEntryRepo: StockEntryRepository,
	) {}

	async execute({ shipmentId }: DispatchShipmentUseCaseRequest) {
		const shipment = await this.shipmentRepo.getById(shipmentId)
		if (!shipment) throw new ShipmentNotFoundError()
		if (shipment.status !== "rascunho") {
			throw new InvalidShipmentTransitionError(shipment.status, "rascunho")
		}

		// Valida todos os itens antes de mexer em qualquer estoque, para nao
		// deixar o envio pela metade quando um item nao couber.
		for (const item of shipment.items) {
			const sourceStock = await this.stockRepo.getById(item.source_stock_id)
			if (!sourceStock) throw new ShipmentNotFoundError()

			if (sourceStock.qtde < item.quantity) {
				throw new InsufficientStockError(item.product_id, sourceStock.qtde, item.quantity)
			}
		}

		const note = `Envio #${shipmentId} — despachado`

		for (const item of shipment.items) {
			const sourceStock = await this.stockRepo.getById(item.source_stock_id)
			if (!sourceStock) throw new ShipmentNotFoundError()

			await this.stockRepo.update(item.source_stock_id, {
				qtde: sourceStock.qtde - item.quantity,
			})
			await this.stockEntryRepo.create({
				stock_id: item.source_stock_id,
				quantity: -item.quantity,
				notes: note,
			})
		}

		await this.shipmentRepo.updateStatus(shipmentId, "em_transito")
	}
}
