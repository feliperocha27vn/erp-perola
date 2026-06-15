import { parse } from "csv-parse/sync"
import { InvalidFbaCsvError } from "../../errors/invalid-fba-csv-error.js"
import type { FbaCsvRow, FbaPendingItem } from "./fba-types.js"

type ParseFbaCsvResult = {
	rows: FbaCsvRow[]
	pending_items: FbaPendingItem[]
}

function parseIntSafe(value: unknown): number {
	if (typeof value !== "string") {
		return 0
	}

	const normalized = value.replaceAll(",", "").trim()
	if (normalized.length === 0) {
		return 0
	}

	const parsed = Number.parseInt(normalized, 10)
	return Number.isFinite(parsed) ? parsed : 0
}

function parsePercentageSafe(value: unknown): number {
	if (typeof value !== "string") {
		return 0
	}

	const normalized = value.replace("%", "").replace(",", ".").trim()
	if (normalized.length === 0) {
		return 0
	}

	const parsed = Number.parseFloat(normalized)
	return Number.isFinite(parsed) ? parsed : 0
}

function parseMoneyToCents(value: unknown): number {
	if (typeof value !== "string") {
		return 0
	}

	const normalized = value
		.replace(/R\$\s*/g, "")
		.replace(/\./g, "")
		.replace(",", ".")
		.trim()

	if (normalized.length === 0) {
		return 0
	}

	const parsed = Number.parseFloat(normalized)
	if (!Number.isFinite(parsed)) {
		return 0
	}

	return Math.round(parsed * 100)
}

export function parseFbaBusinessReportCsv(content: string): ParseFbaCsvResult {
	if (!content.trim()) {
		throw new InvalidFbaCsvError("Arquivo CSV vazio.")
	}

	const sanitizedContent = content.replace(/^\uFEFF/, "")

	const records = parse(sanitizedContent, {
		columns: true,
		skip_empty_lines: true,
		trim: true,
	}) as Record<string, unknown>[]

	if (records.length === 0) {
		throw new InvalidFbaCsvError("Nenhuma linha de dados encontrada no CSV.")
	}

	const rows: FbaCsvRow[] = []
	const pending_items: FbaPendingItem[] = []

	for (const record of records) {
		const skuRaw = record["Código SKU"]
		const sku = typeof skuRaw === "string" ? skuRaw.trim() : ""
		const titleRaw = record.Título
		const title = typeof titleRaw === "string" ? titleRaw.trim() : ""

		if (sku.length === 0) {
			pending_items.push({
				sku: "",
				title,
				reason: "invalid_row",
				detail: "Linha sem Código SKU.",
			})
			continue
		}

		const asinRaw = record["ASIN (child)"]
		const asin = typeof asinRaw === "string" ? asinRaw.trim() : ""

		rows.push({
			asin,
			sku,
			title,
			sessions_total: parseIntSafe(record["Sessões - Total"]),
			page_views_total: parseIntSafe(record["Visualizações da página - Total"]),
			units_sold_90d: parseIntSafe(record["Unidades pedidas"]),
			conversion_rate: parsePercentageSafe(
				record["Porcentagem de sessão de unidade"],
			),
			revenue_cents_90d: parseMoneyToCents(
				record["Vendas de produtos pedidos"],
			),
		})
	}

	if (rows.length === 0) {
		throw new InvalidFbaCsvError("Nenhuma linha valida com SKU foi encontrada.")
	}

	return {
		rows,
		pending_items,
	}
}
