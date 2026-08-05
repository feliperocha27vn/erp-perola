# Domain Glossary

## Sale (Venda)
A record of a product sold from a specific stock entry. A Sale references both a Product and a Stock (the Stock must belong to that Product). Stored in cents.

## Product (Produto)
A catalog item with a SKU, EAN, and optional Brand. A Product has zero or more Stocks.

## Stock (Estoque)
A named inventory entry belonging to a Product (e.g. a warehouse or marketplace slot). Holds a quantity that is decremented when a Sale is created and incremented when a Sale is deleted.

## Physical Stock (Estoque Físico)
The subset of a Product's Stock records where `full = false` — inventory held by the business itself (e.g. Galpão, Loja Centro), as opposed to inventory held in marketplace fulfillment centers (`full = true`, e.g. Amazon FBA, ML Full). Physical Stock quantity is the sum of `qtde` across those records only.

## Full Stock (Estoque Full)
The subset of a Product's Stock records where `full = true` — inventory physically held in a marketplace fulfillment center, not by the business. Each Full Stock belongs to exactly one Marketplace. Named after the account that owns it rather than the marketplace (e.g. "Lilian", "Laurinda" on Mercado Livre Full; "Lilian FBA" on Amazon FBA), so the name alone does not identify the Marketplace. The complement of [Physical Stock](#physical-stock-estoque-físico).

## Marketplace
The fulfillment platform a Full Stock lives in — Mercado Livre Full, Amazon FBA, or Shopee. Distinct from `Sale.channel` (where a sale happened) and from Store (who sold it): a Marketplace is an attribute of *where inventory sits*. Only Full Stock has a Marketplace; Physical Stock has none. It matters because the platforms have opposing constraints — Amazon caps how much inventory it accepts per item, while Mercado Livre accepts it but charges for stock that sits idle — so the same Dias de Autonomia figure warrants different action depending on the Marketplace.

## Brand (Marca)
A label grouping Products (e.g. ORIENT, MONDAINE). A Product may have no Brand (`brand_id` is nullable). Deleting a Brand sets all its Products' `brand_id` to NULL.

## Store (Loja)
A named point of sale or responsible person (e.g. Lilian, Santo, Laurinda). A Sale may reference one Store via `store_id` (nullable — sales created before this feature have no Store). From this feature forward, Store is required when creating or editing a Sale. Stores are managed via seed/migration; there is no UI CRUD for them. Deleting a Store is not defined yet.

## Purchase Restock Alert (Alerta de Reposição)
A per-Product signal, computed live (no scheduled job, no persisted snapshot) on every load of the Dashboard (`/`) and its dedicated page (`/alertas-de-reposicao`). Compares 30-day Sales Velocity (`units_30d`, all channels) against Physical Stock for the Product, with two severities:
- 🔴 **Crítico**: `units_30d > Physical Stock` (equivalent to a Stock Coverage under 100%, but using Physical Stock instead of total stock).
- 🟡 **Atenção**: not Crítico, but either (a) coverage between 100% and 130% — tagged "Perto do limite" — or (b) the 15-day pace projected to 30 days would exceed the actual 30-day total, `units_15d × 2 > units_30d` — tagged "Vendas acelerando". Both tags can apply at once.
Products with zero 30-day sales are never flagged, regardless of stock level — same reasoning as Stock Coverage: no recent sales isn't evidence of shortage. Does not suggest a purchase quantity — only flags the Product.
Deliberately distinct from Stock Coverage: this alert is global per-Product (not per-Store), uses a fixed 30-day window (not 90), and considers Physical Stock only (excludes marketplace-fulfillment stock) — because a purchase decision is about what's on hand to sell in-house *and* to replenish marketplace fulfillment centers, not a per-Store breakdown. See [ADR 0004](./docs/adr/0004-alerta-de-reposicao-sem-ia-sem-cron.md) for why this has no AI/LLM layer and no real scheduled job despite the feature originally being framed as "cron job with an AI layer".

## Sales Velocity (Velocidade de Giro)
Units sold per product across fixed trailing windows: 15, 30, 60, and 90 days counted back from today. Measured as the sum of `Sale.quantity` (units), not the count of Sale records. All four windows are always shown simultaneously on the Product card. Data is fetched from a dedicated endpoint (`GET /products/sales-velocity`) that accepts the same pagination and search params as `GET /products`, keeping both in sync.

## Product Sales Dashboard (Dashboard de Vendas do Produto)
A per-product modal opened from the Product card. Shows a LineChart of daily units sold, a period selector (15/30/60/90d) in the top-right corner, and a total-units figure for the active period. Tabs across the top switch between "Todas" (all stores combined, including legacy sales with no Store) and each individual Store. Data is fetched from a single endpoint (`GET /products/:id/sales-daily`) that returns all stores and all four periods at once. The request fires lazily when the modal is first opened and is cached by TanStack Query keyed to the product id.

## Sales Filter (Filtro de Vendas)
A set of optional constraints applied server-side to the GET /sales query: date range (`startDate`, `endDate`), Brand (`brandId`), and Store (`storeId`). "Limpar filtros" resets all constraints at once. There is no "Sem marca" or "Sem loja" filter option — absence of a filter means show all sales.

## Stock Entry (Lançamento de Estoque)
A record of units added to an existing Stock (replenishment). A Stock Entry references one Stock and carries a positive quantity and an optional text note. `created_at` is the canonical timestamp — there is no separate "entry date" field. A Stock Entry simultaneously increments `stocks.qtde` (audit-log model: the entry is not the source of truth for current quantity, but records what was added and when). Stock Entries are always additions; corrections to quantity are done via direct Stock edit. Who registered the entry is not captured (shared credentials in the system). Stock Entries are created from within the Product edit modal (per-stock action) and are visible both in a per-product history tab and on a global page (`/lancamentos-de-estoque`) filtered by period and Brand.

## Shipment (Envio)
A transfer of units from Physical Stock to Full Stock, grouped under one Shipment Account and one date. Each Shipment Item names a Product, a quantity, a source Stock (always Physical) and a destination Stock (always Full). A Shipment moves through three states:
- **Rascunho** — planned only. No Stock has changed.
- **Em trânsito** — dispatched. Source Stock is debited; destination Full Stock is **not** yet credited, because the units exist physically but are not sellable until the fulfillment center checks them in.
- **Recebido** — checked in. Destination Full Stock is credited.
The middle state exists because `Stock.qtde` on a Full Stock must mean *available to sell*, not *already shipped*. Crediting the destination at dispatch would overstate [Dias de Autonomia](#dias-de-autonomia) for the entire lead time — precisely the window in which a stockout is most likely. Every state change writes Stock Entries, keeping the audit-log model intact. See [ADR 0006](./docs/adr/0006-alerta-de-abastecimento-do-full.md).

## In-Transit Stock (Estoque em Trânsito)
Units belonging to a Product that have left Physical Stock toward a specific Full Stock but have not been received there — that is, items of Shipments in the "em trânsito" state, plus items of "rascunho" Shipments, which are already committed as a plan. Counted when deciding *whether* to replenish (so the same shipment is not suggested twice), but never counted as available when computing Dias de Autonomia.

## Stock Report (Relatório de Estoque)
A dedicated page (`/relatorio-de-estoque`) for viewing stock distribution per brand. The user selects a Brand (including a "Sem marca" option for products with no brand) and sees a table of all Products in that brand. Table columns are dynamic: one column per distinct Stock title found across the brand's products, plus a "Total" column (sum of all stock quantities for that product). Products with no stocks appear with `—` in all stock columns and Total = 0. No table is shown until a brand is selected. On mobile, the table scrolls horizontally. Inventory turnover calculation is out of scope for the initial version.

## Sales Report — By Store View (Relatório de Vendas — Visão por Loja)
A view toggle on `/relatorio-de-vendas` ("Lista" / "Por loja", button-group pattern — same as the Store tabs in the Product Sales Dashboard, not a Radix Tabs primitive) that switches the existing sale-by-sale table into blocks grouped by Store, using the same filtered data already returned by `GET /reports/sales` (no new endpoint). Each block keeps one row per individual sale (same columns as the flat view, minus "Loja") and ends with a subtotal (quantity + total value) for that Store. Sales with no Store are grouped into a "Sem loja" block, consistent with the Curva ABC report. Blocks are ordered alphabetically by Store name, with "Sem loja" always last. "Lista" is the default view on page load.

## WhatsApp Sales Share (Envio de Vendas por WhatsApp)
A button on `/relatorio-de-vendas`, visible in both views (Lista and Por loja) alongside "Copiar link" and "Exportar CSV", that opens a `wa.me` share link with a pre-filled message — there is no fixed recipient, since Store has no phone number on file, so the user picks the contact manually in WhatsApp. The message is built client-side from the same filtered data on screen, aggregated by SKU within each Store (collapsing individual sale rows to one line per product, quantity summed), in the same alphabetical Store order as the "Por loja" view ("Sem loja" last), ending with a grand total. The header line reads "Vendas de hoje — DD/MM/AAAA" when the filtered period is a single day, or "Vendas do período — DD/MM a DD/MM/AAAA" when it spans multiple days. Products are identified by SKU only (no product title), consistent with the rest of the report.

## Product Technical Description (Descrição Técnica do Produto)
A Product's marketing/technical copy used to build marketplace listings, split into two fields: `technical_title` (single line) and `technical_description` (freeform Markdown). `technical_description` consolidates what used to be eight separate columns (subtitle, technical analysis, movement, case & crystal, specific functionality, dial & luminosity, bracelet construction, and a specs table) into one field, organized with one Markdown heading per former section, in the same order they used to appear. Edited in the "Detalhes técnicos" tab of the Product edit modal. Can be bulk-filled by pasting a standardized "JSON do desenvolvedor" payload (`parseDeveloperDetailsJson`), which produces `technical_title` and the combined `technical_description` in one step. New Products get a placeholder title/description auto-generated from their SKU/EAN/Brand. See [ADR 0005](./docs/adr/0005-descricao-tecnica-markdown-unico.md) for why the other 8 fields collapsed into one instead of staying structured.

## Stock Coverage (Cobertura de Estoque)
A per-Store, per-SKU indicator on the Curva ABC report (`/relatorio-abc`): current total stock quantity for the Product (sum of all its Stock records — Normal + Full, the same figure as the "Total" column in Stock Report) divided by units of that SKU sold through that specific Store in a fixed trailing 90-day window (same 90-day concept as Sales Velocity — not the report's selected `startDate`/`endDate` filter), expressed as a percentage. Stock is a Product-level attribute with no relationship to Store, so the same total stock figure repeats across every Store block where the SKU appears — only the 90-day sales figure (and therefore the resulting percentage) varies per Store. Coverage below 100% raises a "Precisa comprar" flag. When the Store's 90-day sales for that SKU are zero, coverage is not calculated (shown as "—") and no purchase flag is raised — no recent sales history isn't evidence of a stock shortage. Deliberately not called "Giro de Estoque": the classic inventory-turnover formula is inverted (sales ÷ stock), where a higher number means faster turnover; here a higher percentage means the opposite — more idle stock relative to recent sales.

## Dias de Autonomia
How many days a given Full Stock can keep selling before it hits zero, at its own recent pace: `Full Stock quantity ÷ Demand Rate`. Expressed in days, deliberately **not** a percentage — unlike [Stock Coverage](#stock-coverage-cobertura-de-estoque), which is a per-Store percentage on the Curva ABC. The two must not be confused: "130" means 130% there and 130 days here. Days is the required unit because the figure only becomes actionable when compared against how long a shipment takes to arrive — a percentage cannot be compared to a lead time. It is also the unit both Mercado Livre and Amazon report natively to sellers.

## Demand Rate (Ritmo de Saída)
Units per day a Product sells out of one specific Full Stock: `units sold from that Full Stock in a fixed trailing 90-day window ÷ number of days in that window on which the Full Stock had quantity > 0`. The denominator is days *with stock available*, not calendar days, because a Full Stock that sat empty did not fail to sell — it had nothing to sell. Dividing by calendar days would systematically understate demand for exactly the Full Stocks that ran out, making the ones most in need of replenishment look like the ones with least demand. Reconstructed from Sales and Stock Entries, both of which carry a Full Stock reference and a timestamp.
The 90-day window matches the convention already used by [Sales Velocity](#sales-velocity-velocidade-de-giro) and [Stock Coverage](#stock-coverage-cobertura-de-estoque); a shorter window returns zero sales for most watches, which turn over slowly. The stock-available denominator is only trusted above a minimum number of qualifying days — below it, a Full Stock that held stock for two days and sold one unit would imply an implausible rate, so the Product's overall demand prorated across its Full Stocks is used instead.

## Full Replenishment Alert (Alerta de Abastecimento do Full)
A signal that one Product is running low in one specific Full Stock and should be shipped there from Physical Stock. Computed per **Product × Full Stock** pair — never aggregated across Full Stocks, because summing them hides the case this alert exists to catch: the same Product may sit at 1 unit in one fulfillment center and 17 in another, and the total looks healthy while one center is in stockout. Each alert corresponds one-to-one with a prospective Shipment item (same Product, same destination Full Stock).
Deliberately distinct from [Purchase Restock Alert](#purchase-restock-alert-alerta-de-reposição): that one asks "should I buy from the supplier?" and compares all-channel sales against Physical Stock; this one asks "should I transfer what I already own to a fulfillment center?" and compares one Full Stock's own sales against that same Full Stock's quantity. Physical Stock is the *denominator* of the first and the *source of supply* for the second.
A Product × Full Stock pair is only ever evaluated where a Full Stock record already exists; the alert never proposes sending a Product to a fulfillment center it has never been listed in, since a Shipment requires an existing destination Stock. It carries a suggested quantity — unlike the Purchase Restock Alert, which deliberately carries none — because the pair plus a quantity is exactly a Shipment Item, and the alert's payoff is generating that Shipment as a rascunho for review.

## Replenishment Point (Ponto de Reposição)
The Dias de Autonomia threshold below which a Full Stock triggers an alert: `Marketplace lead time + safety margin`. Not an arbitrary "low stock" number — if a fulfillment center has five days of autonomy and a Shipment takes seven days to be checked in, it will run out no matter what, so the alert must fire while there is still time to act. Because lead time is a property of the Marketplace, the same Dias de Autonomia figure triggers an alert in one fulfillment center and not in another.

## Idle Full Stock (Estoque Parado no Full)
The opposite tail of the same measurement: a Full Stock whose Dias de Autonomia exceeds what its Marketplace tolerates. Surfaced alongside the Full Replenishment Alert because it is the same computed number read from the other end, and because it costs money continuously — Mercado Livre starts a removal clock at 90 days without a sale and raises cost after six months idle, while Amazon treats anything over ~90 days of supply as excess, which lowers the seller's capacity to send the items that actually sell. It also competes directly with replenishment: units sitting idle in one fulfillment center are units unavailable in Physical Stock to rescue another. Flags only — removing inventory from a fulfillment center is never suggested automatically.
