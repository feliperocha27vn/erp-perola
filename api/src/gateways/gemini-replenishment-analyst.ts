import z from "zod"
import { GeminiAnalysisError } from "../errors/gemini-analysis-error.js"
import type {
	AnalystProduct,
	AnalystSituation,
	AnalystVerdict,
	ReplenishmentAnalystGateway,
} from "./replenishment-analyst-gateway.js"

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions"

/** Uma analise que demora mais que isso ja perdeu a serventia na tela. */
const TIMEOUT_MS = 60_000

/**
 * Faixa aceita para o fator sazonal. Fora dela o modelo esta opinando sobre a
 * operacao, nao sobre a data: dobrar o envio de um relogio por causa do Natal e
 * defensavel, quintuplicar nao e.
 */
const MIN_FACTOR = 50
const MAX_FACTOR = 200

/**
 * Tolerante de proposito nos dois campos onde modelo costuma escorregar: fator
 * como string e critica omitida em vez de nula. Rejeitar a resposta inteira por
 * isso trocaria um parecer util por uma tela de erro.
 */
const verdictSchema = z.object({
	verdict: z.enum(["antecipar", "manter", "segurar"]),
	seasonal_factor: z.coerce.number(),
	identity: z.string().min(1),
	rationale: z.string().min(1),
	critique: z
		.string()
		.nullable()
		.optional()
		.transform((value) => value ?? null),
})

/** Espelha `verdictSchema` para o modelo. O `sources` vem da propria fundamentacao. */
const RESPONSE_SCHEMA = {
	type: "object",
	properties: {
		verdict: { type: "string", enum: ["antecipar", "manter", "segurar"] },
		seasonal_factor: {
			type: "integer",
			description:
				"Fator sazonal em centésimos: 100 = manter como está, 140 = enviar 40% a mais, 70 = enviar 30% a menos.",
		},
		identity: {
			type: "string",
			description: "O que é este produto, em uma frase, em português do Brasil.",
		},
		rationale: {
			type: "string",
			description:
				"Por que este veredito, em até 3 frases, citando o que a busca encontrou. Português do Brasil.",
		},
		critique: {
			type: ["string", "null"],
			description:
				"O que não fecha nos números da própria linha, ou null quando não há reparo a fazer.",
		},
	},
	required: ["verdict", "seasonal_factor", "identity", "rationale", "critique"],
}

const SYSTEM_INSTRUCTION = `Você é o analista de compras de uma relojoaria brasileira que vende em Mercado Livre Full, Amazon FBA e Shopee.

Recebe uma linha de um relatório de abastecimento já calculado por regra determinística e responde em português do Brasil.

Seu papel é o senso crítico que a regra não tem:
- Identifique o produto de verdade. O SKU sozinho não diz nada; pesquise o modelo, o movimento, a faixa de preço praticada no Brasil e se a linha foi descontinuada.
- Pese o calendário comercial brasileiro contra a data informada: Dia das Mães, Dia dos Namorados (12 de junho), Dia dos Pais, Black Friday e Natal movem relógio, que é item de presente. Só conta o que couber dentro do prazo de reposição — antecipar para uma data que já passou não faz sentido.
- Procure sinais de mercado: modelo em falta, alta de preço, lançamento novo canibalizando este.
- Critique os próprios números da linha quando algo não fechar — por exemplo, saldo parado do mesmo SKU em outra conta que deveria ser drenado antes de mandar mercadoria nova do estoque próprio.

Regras rígidas:
- O fator sazonal é uma proposta, não uma ordem: quem decide a quantidade é o operador. Use 100 quando não houver motivo real para mudar — a maioria das linhas é 100.
- Nunca invente número de venda, preço ou estoque. Trabalhe só com o que foi informado e com o que a busca retornou.
- Se a busca não encontrar nada confiável sobre o modelo, diga isso na identificação e mantenha o fator em 100.
- Seja curto. Cada campo é lido dentro de uma célula de tabela.`

interface GeminiConfig {
	apiKey: string
	model: string
	fetchImpl?: typeof fetch
}

export class GeminiReplenishmentAnalyst implements ReplenishmentAnalystGateway {
	constructor(private config: GeminiConfig) {}

	async analyze(input: {
		product: AnalystProduct
		situation: AnalystSituation
	}): Promise<AnalystVerdict> {
		const prompt = buildPrompt(input.product, input.situation)

		let grounded = true
		let response = await this.post(prompt, true)

		// A busca tem cota propria e menor que a do modelo. Quando ela acaba, um
		// parecer sem fontes ainda vale mais que uma tela de erro — desde que a
		// tela diga que foi sem busca. Ver ADR 0008.
		if (response.status === 429) {
			grounded = false
			response = await this.post(prompt, false)
		}

		if (!response.ok) {
			throw new GeminiAnalysisError(describeFailure(response.status))
		}

		const body = (await response.json()) as unknown

		const parsed = verdictSchema.safeParse(extractJson(body))
		if (!parsed.success) {
			throw new GeminiAnalysisError("A análise voltou num formato que não deu para ler.")
		}

		return {
			...parsed.data,
			seasonal_factor: clampFactor(parsed.data.seasonal_factor),
			sources: grounded ? extractSources(body) : [],
			grounded,
			model: this.config.model,
		}
	}

	private async post(prompt: string, withSearch: boolean): Promise<Response> {
		const doFetch = this.config.fetchImpl ?? fetch

		try {
			return await doFetch(ENDPOINT, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-goog-api-key": this.config.apiKey,
				},
				body: JSON.stringify({
					model: this.config.model,
					system_instruction: withSearch
						? SYSTEM_INSTRUCTION
						: `${SYSTEM_INSTRUCTION}\n\nATENÇÃO: a busca na web não está disponível nesta chamada. Trabalhe só com o que você já sabe, diga na identificação quando não tiver certeza do modelo e não afirme preço, ruptura de mercado ou descontinuação sem fonte.`,
					input: prompt,
					...(withSearch ? { tools: [{ type: "google_search" }] } : {}),
					response_format: {
						type: "text",
						mime_type: "application/json",
						schema: RESPONSE_SCHEMA,
					},
					generation_config: { temperature: 0.2 },
				}),
				signal: AbortSignal.timeout(TIMEOUT_MS),
			})
		} catch (error) {
			throw new GeminiAnalysisError(
				error instanceof Error && error.name === "TimeoutError"
					? "A análise demorou demais e foi cancelada. Tente de novo."
					: "Não foi possível falar com o serviço de análise.",
			)
		}
	}
}

function describeFailure(status: number): string {
	if (status === 429) {
		return "A cota da API do Gemini acabou. Ela reseta em 24h; para não depender disso, ative o faturamento no projeto do Google AI Studio."
	}
	if (status === 401 || status === 403) {
		return "A chave da API do Gemini foi recusada. Confira GEMINI_API_KEY."
	}
	if (status === 404) {
		return "O modelo configurado não existe mais. Ajuste GEMINI_MODEL no .env."
	}
	return `O serviço de análise respondeu ${status}.`
}

function buildPrompt(product: AnalystProduct, situation: AnalystSituation): string {
	const idle =
		situation.idle_elsewhere.length > 0
			? situation.idle_elsewhere
					.map((i) => `${i.stock_title}: ${i.qtde} parada(s) (${i.reason})`)
					.join("; ")
			: "nenhum"

	return [
		`Data de hoje: ${situation.today}`,
		"",
		"PRODUTO",
		`SKU: ${product.sku}`,
		`EAN: ${product.ean}`,
		`Marca: ${product.brand_name ?? "sem marca cadastrada"}`,
		`Título técnico: ${product.technical_title ?? "não cadastrado"}`,
		`Descrição técnica: ${truncate(product.technical_description, 1200)}`,
		"",
		"SITUAÇÃO NO CENTRO DE DISTRIBUIÇÃO",
		`Conta/depósito: ${situation.stock_title} (${situation.marketplace})`,
		`Disponível para venda lá: ${situation.available_qty}`,
		`Já a caminho: ${situation.in_transit_qty}`,
		`Vendas nos últimos 90 dias, só deste depósito: ${situation.units_window}`,
		`Ritmo de saída: ${situation.demand_rate_per_day}/dia${
			situation.rate_is_estimated ? " (estimado a partir de amostra curta)" : ""
		}`,
		`Dias de autonomia: ${situation.days_of_autonomy ?? "sem vendas na janela"}`,
		`A regra pede ${situation.needed_quantity} unidade(s) e o estoque próprio cobre ${situation.suggested_quantity}${
			situation.shortfall_reason ? ` (restrição: ${situation.shortfall_reason})` : ""
		}.`,
		`Mesmo SKU parado em outra conta: ${idle}`,
		"",
		"Pesquise o produto e responda no formato pedido.",
	].join("\n")
}

function truncate(value: string | null, max: number): string {
	if (!value) return "não cadastrada"
	return value.length > max ? `${value.slice(0, max)}…` : value
}

function clampFactor(value: number): number {
	return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, Math.round(value)))
}

/**
 * O texto final vem no ultimo bloco de texto de `steps`; os anteriores podem ser
 * raciocinio ou chamada de busca. A leitura e tolerante de proposito: a forma
 * exata da resposta muda entre versoes da API, e uma analise consultiva nao
 * justifica quebrar a tela quando um campo novo aparece no meio.
 */
function extractJson(body: unknown): unknown {
	const texts = collectTexts(body)
	if (texts.length === 0) throw new GeminiAnalysisError("A análise voltou vazia.")

	const raw = texts[texts.length - 1].trim()
	const unfenced = raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "")

	try {
		return JSON.parse(unfenced)
	} catch {
		// Ultimo recurso: o primeiro objeto balanceado que aparecer no texto.
		const start = unfenced.indexOf("{")
		const end = unfenced.lastIndexOf("}")
		if (start === -1 || end <= start) {
			throw new GeminiAnalysisError("A análise não voltou em JSON.")
		}
		try {
			return JSON.parse(unfenced.slice(start, end + 1))
		} catch {
			throw new GeminiAnalysisError("A análise não voltou em JSON.")
		}
	}
}

function collectTexts(node: unknown, found: string[] = []): string[] {
	if (Array.isArray(node)) {
		for (const item of node) collectTexts(item, found)
		return found
	}

	if (node !== null && typeof node === "object") {
		const record = node as Record<string, unknown>
		if (record.type === "text" && typeof record.text === "string") {
			found.push(record.text)
		}
		for (const value of Object.values(record)) collectTexts(value, found)
	}

	return found
}

/** Links que a busca citou, para a tela mostrar em que a opiniao se apoia. */
function extractSources(node: unknown, found = new Map<string, string>()): { title: string; url: string }[] {
	if (Array.isArray(node)) {
		for (const item of node) extractSources(item, found)
	} else if (node !== null && typeof node === "object") {
		const record = node as Record<string, unknown>
		if (typeof record.url === "string" && record.url.startsWith("http")) {
			const title = typeof record.title === "string" ? record.title : record.url
			if (!found.has(record.url)) found.set(record.url, title)
		}
		for (const value of Object.values(record)) extractSources(value, found)
	}

	return [...found].slice(0, 6).map(([url, title]) => ({ title, url }))
}
