import { describe, expect, it } from "vitest"
import { InvalidFbaCsvError } from "../../errors/invalid-fba-csv-error.js"
import { parseFbaBusinessReportCsv } from "./fba-csv-parser.js"

const csv = `﻿ASIN (parent),ASIN (child),Título,Código SKU,Sessões - Total,Porcentagem de sessões – Total,Visualizações da página - Total,Porcentagem de visualizações de páginas – Total,Porcentagem de Ofertas em destaque,Unidades pedidas,Porcentagem de sessão de unidade,Vendas de produtos pedidos,Total de itens do pedido
B0TESTPARENT,B0TESTCHILD,"Relogio, Linha Especial",SKU-123,"1,025",11.91%,"1,271",11.34%,99.48%,5,0.49%,"R$ 1.698,00",5
B0TESTPARENT2,B0TESTCHILD2,Sem SKU,,180,2.09%,293,2.61%,95.22%,1,2.78%,"R$ 100,00",1
`

describe("parseFbaBusinessReportCsv", () => {
	it("parses valid rows and keeps invalid rows as pending", () => {
		const result = parseFbaBusinessReportCsv(csv)

		expect(result.rows).toHaveLength(1)
		expect(result.pending_items).toHaveLength(1)

		expect(result.rows[0]).toMatchObject({
			sku: "SKU-123",
			sessions_total: 1025,
			page_views_total: 1271,
			units_sold_90d: 5,
			conversion_rate: 0.49,
			revenue_cents_90d: 169800,
		})
	})

	it("throws for empty CSV", () => {
		expect(() => parseFbaBusinessReportCsv("   ")).toThrow(InvalidFbaCsvError)
	})
})
