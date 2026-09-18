/**
 * Lancamentos de estoque guardam entrada como quantidade positiva e saida como
 * negativa. Mostra o sinal sempre, com o menos tipografico no lugar do hifen.
 */
export function formatSignedQuantity(quantity: number): string {
  return quantity < 0 ? `−${Math.abs(quantity)}` : `+${quantity}`
}
