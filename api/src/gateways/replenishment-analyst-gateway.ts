/**
 * Porta para o analista externo (LLM com busca na web). Fica fora de
 * `repositories/` de proposito: nao e persistencia, e uma opiniao de fora que
 * pode falhar, demorar e custar dinheiro — o use case trata os tres casos.
 *
 * O contrato e deliberadamente estreito: entra o que o sistema sabe do produto e
 * os numeros da linha, sai um parecer. O analista nunca decide quantidade; ele
 * propoe um fator, e quem multiplica e o use case, dentro do que o estoque
 * fisico permite. Ver ADR 0008.
 */

/** O que o sistema ja sabe do produto, para o analista nao ter que adivinhar. */
export interface AnalystProduct {
	sku: string
	ean: string
	brand_name: string | null
	technical_title: string | null
	technical_description: string | null
}

/** Os numeros da linha do relatorio, exatamente como saem da regra. */
export interface AnalystSituation {
	stock_title: string
	marketplace: string
	available_qty: number
	in_transit_qty: number
	units_window: number
	demand_rate_per_day: number
	days_of_autonomy: number | null
	rate_is_estimated: boolean
	needed_quantity: number
	suggested_quantity: number
	shortfall_reason: string | null
	/** Saldo do mesmo SKU parado em outra conta do canal, se houver. */
	idle_elsewhere: { stock_title: string; qtde: number; reason: string }[]
	/** Data de referencia da analise, para o calendario comercial fazer sentido. */
	today: string
}

export interface AnalystVerdict {
	verdict: "antecipar" | "manter" | "segurar"
	/** Em centesimos: 140 = 1,40x. Limitado pelo use case antes de virar quantidade. */
	seasonal_factor: number
	/** O que e o produto, em uma frase. */
	identity: string
	/** Por que o veredito, citando o que a busca encontrou. */
	rationale: string
	/** O que nao fecha nos proprios numeros da linha. Null quando nao ha reparo. */
	critique: string | null
	sources: { title: string; url: string }[]
	/**
	 * false quando a busca na web nao pode ser usada e o parecer saiu so do que o
	 * modelo ja sabia. A tela precisa dizer isso: sem busca nao ha como afirmar
	 * que um modelo saiu de linha ou que o preco subiu.
	 */
	grounded: boolean
	model: string
}

export interface ReplenishmentAnalystGateway {
	analyze(input: {
		product: AnalystProduct
		situation: AnalystSituation
	}): Promise<AnalystVerdict>
}
