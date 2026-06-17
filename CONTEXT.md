# Domain Glossary

## Sale (Venda)
A record of a product sold from a specific stock entry. A Sale references both a Product and a Stock (the Stock must belong to that Product). Stored in cents.

## Product (Produto)
A catalog item with a SKU, EAN, and optional Brand. A Product has zero or more Stocks.

## Stock (Estoque)
A named inventory entry belonging to a Product (e.g. a warehouse or marketplace slot). Holds a quantity that is decremented when a Sale is created and incremented when a Sale is deleted.

## Brand (Marca)
A label grouping Products (e.g. ORIENT, MONDAINE). A Product may have no Brand (`brand_id` is nullable). Deleting a Brand sets all its Products' `brand_id` to NULL.

## Store (Loja)
A named point of sale or responsible person (e.g. Lilian, Santo, Laurinda). A Sale may reference one Store via `store_id` (nullable — sales created before this feature have no Store). From this feature forward, Store is required when creating or editing a Sale. Stores are managed via seed/migration; there is no UI CRUD for them. Deleting a Store is not defined yet.

## Sales Velocity (Velocidade de Giro)
Units sold per product across fixed trailing windows: 15, 30, 60, and 90 days counted back from today. Measured as the sum of `Sale.quantity` (units), not the count of Sale records. All four windows are always shown simultaneously on the Product card. Data is fetched from a dedicated endpoint (`GET /products/sales-velocity`) that accepts the same pagination and search params as `GET /products`, keeping both in sync.

## Product Sales Dashboard (Dashboard de Vendas do Produto)
A per-product modal opened from the Product card. Shows a LineChart of daily units sold, a period selector (15/30/60/90d) in the top-right corner, and a total-units figure for the active period. Tabs across the top switch between "Todas" (all stores combined, including legacy sales with no Store) and each individual Store. Data is fetched from a single endpoint (`GET /products/:id/sales-daily`) that returns all stores and all four periods at once. The request fires lazily when the modal is first opened and is cached by TanStack Query keyed to the product id.

## Sales Filter (Filtro de Vendas)
A set of optional constraints applied server-side to the GET /sales query: date range (`startDate`, `endDate`), Brand (`brandId`), and Store (`storeId`). "Limpar filtros" resets all constraints at once. There is no "Sem marca" or "Sem loja" filter option — absence of a filter means show all sales.

## Stock Report (Relatório de Estoque)
A dedicated page (`/relatorio-de-estoque`) for viewing stock distribution per brand. The user selects a Brand (including a "Sem marca" option for products with no brand) and sees a table of all Products in that brand. Table columns are dynamic: one column per distinct Stock title found across the brand's products, plus a "Total" column (sum of all stock quantities for that product). Products with no stocks appear with `—` in all stock columns and Total = 0. No table is shown until a brand is selected. On mobile, the table scrolls horizontally. Inventory turnover calculation is out of scope for the initial version.
