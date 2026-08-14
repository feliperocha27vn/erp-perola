import { relations } from "drizzle-orm"
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"

export const salesChannelEnum = pgEnum("sales_channel", [
	"Amazon",
	"Mercado Livre",
	"Shopee",
	"Direto",
])

export const shipmentStatusEnum = pgEnum("shipment_status", [
	"rascunho",
	"em_transito",
	"recebido",
])

export const marketplaceEnum = pgEnum("marketplace", [
	"mercado_livre",
	"amazon",
	"shopee",
])

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
)

export const account = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
)

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}))

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}))

export const stores = pgTable("stores", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull().unique(),
	created_at: timestamp("created_at").notNull().defaultNow(),
	updated_at: timestamp("updated_at").notNull().defaultNow(),
})

export const brands = pgTable("brands", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull().unique(),
	deleted_at: timestamp("deleted_at"),
	created_at: timestamp("created_at").notNull().defaultNow(),
	updated_at: timestamp("updated_at").notNull().defaultNow(),
})

export const products = pgTable("products", {
	id: uuid("id").primaryKey().defaultRandom(),
	sku: text("sku").notNull().unique(),
	ean: text("ean").notNull().unique(),
	sale_price_cents: integer("sale_price_cents"),
	brand_id: uuid("brand_id").references(() => brands.id, {
		onDelete: "set null",
	}),
	url_image: text("url_image"),
	technical_title: text("technical_title"),
	technical_description: text("technical_description"),
	deleted_at: timestamp("deleted_at"),
	created_at: timestamp("created_at").notNull().defaultNow(),
	updated_at: timestamp("updated_at").notNull().defaultNow(),
})

export const stocks = pgTable("stocks", {
	id: uuid("id").primaryKey().defaultRandom(),
	product_id: uuid("product_id")
		.notNull()
		.references(() => products.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	qtde: integer("qtde").notNull(),
	full: boolean("full").notNull().default(false),
	marketplace: marketplaceEnum("marketplace"),
	/**
	 * A conta dona do deposito. Preenchido nos fulls, nulo nos depositos
	 * proprios: o galpao atende todas as contas e nao pertence a nenhuma.
	 *
	 * Sem esta coluna a demanda de uma conta nao chega ao full dela — uma venda
	 * da conta no marketplace despachada do galpao fica registrada no galpao, e
	 * o full da mesma conta parece nao ter demanda. Ver ADR 0009.
	 */
	store_id: uuid("store_id").references(() => stores.id, {
		onDelete: "set null",
	}),
	created_at: timestamp("created_at").notNull().defaultNow(),
	updated_at: timestamp("updated_at").notNull().defaultNow(),
})

export const sales = pgTable("sales", {
	id: uuid("id").primaryKey().defaultRandom(),
	product_id: uuid("product_id")
		.notNull()
		.references(() => products.id, { onDelete: "restrict" }),
	stock_id: uuid("stock_id")
		.notNull()
		.references(() => stocks.id, { onDelete: "restrict" }),
	quantity: integer("quantity").notNull(),
	sale_price: integer("sale_price").notNull(),
	total_price: integer("total_price").notNull().default(0),
	channel: salesChannelEnum("channel").notNull().default("Direto"),
	store_id: uuid("store_id").references(() => stores.id, {
		onDelete: "set null",
	}),
	sale_date: timestamp("sale_date").notNull(),
	created_at: timestamp("created_at").notNull().defaultNow(),
	updated_at: timestamp("updated_at").notNull().defaultNow(),
})

export const brandsRelations = relations(brands, ({ many }) => ({
	products: many(products),
}))

export const productsRelations = relations(products, ({ many, one }) => ({
	brand: one(brands, {
		fields: [products.brand_id],
		references: [brands.id],
	}),
	stocks: many(stocks),
	sales: many(sales),
}))

export const stockEntries = pgTable("stock_entries", {
	id: uuid("id").primaryKey().defaultRandom(),
	stock_id: uuid("stock_id")
		.notNull()
		.references(() => stocks.id, { onDelete: "cascade" }),
	quantity: integer("quantity").notNull(),
	notes: text("notes"),
	created_at: timestamp("created_at").notNull().defaultNow(),
})

export const stocksRelations = relations(stocks, ({ many, one }) => ({
	product: one(products, {
		fields: [stocks.product_id],
		references: [products.id],
	}),
	store: one(stores, {
		fields: [stocks.store_id],
		references: [stores.id],
	}),
	sales: many(sales),
	entries: many(stockEntries),
}))

export const stockEntriesRelations = relations(stockEntries, ({ one }) => ({
	stock: one(stocks, {
		fields: [stockEntries.stock_id],
		references: [stocks.id],
	}),
}))

export const storesRelations = relations(stores, ({ many }) => ({
	sales: many(sales),
	stocks: many(stocks),
}))

export const salesRelations = relations(sales, ({ one }) => ({
	product: one(products, {
		fields: [sales.product_id],
		references: [products.id],
	}),
	stock: one(stocks, {
		fields: [sales.stock_id],
		references: [stocks.id],
	}),
	store: one(stores, {
		fields: [sales.store_id],
		references: [stores.id],
	}),
}))

export const shipmentAccounts = pgTable("shipment_accounts", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull().unique(),
	created_at: timestamp("created_at").notNull().defaultNow(),
	updated_at: timestamp("updated_at").notNull().defaultNow(),
})

export const shipments = pgTable("shipments", {
	id: uuid("id").primaryKey().defaultRandom(),
	account_id: uuid("account_id")
		.notNull()
		.references(() => shipmentAccounts.id, { onDelete: "restrict" }),
	date: timestamp("date").notNull(),
	notes: text("notes"),
	status: shipmentStatusEnum("status").notNull().default("rascunho"),
	created_at: timestamp("created_at").notNull().defaultNow(),
	updated_at: timestamp("updated_at").notNull().defaultNow(),
})

export const shipmentItems = pgTable("shipment_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	shipment_id: uuid("shipment_id")
		.notNull()
		.references(() => shipments.id, { onDelete: "cascade" }),
	product_id: uuid("product_id")
		.notNull()
		.references(() => products.id, { onDelete: "restrict" }),
	quantity: integer("quantity").notNull(),
	source_stock_id: uuid("source_stock_id")
		.notNull()
		.references(() => stocks.id, { onDelete: "restrict" }),
	destination_stock_id: uuid("destination_stock_id")
		.notNull()
		.references(() => stocks.id, { onDelete: "restrict" }),
	created_at: timestamp("created_at").notNull().defaultNow(),
})

export const insightVerdictEnum = pgEnum("insight_verdict", [
	"antecipar",
	"manter",
	"segurar",
])

/**
 * Cache da leitura de mercado de um produto: o que ele e, o que o calendario
 * comercial diz sobre ele e o que a busca encontrou. Uma linha por produto.
 *
 * Existe porque essa parte da analise custa uma chamada com busca na web e muda
 * devagar — o que muda todo dia sao os numeros do relatorio, e esses nunca vem
 * daqui. `context_snapshot` guarda os numeros de quando a analise foi feita, para
 * a tela conseguir dizer que ela envelheceu.
 */
export const productInsights = pgTable("product_insights", {
	id: uuid("id").primaryKey().defaultRandom(),
	product_id: uuid("product_id")
		.notNull()
		.unique()
		.references(() => products.id, { onDelete: "cascade" }),
	verdict: insightVerdictEnum("verdict").notNull(),
	/** Fator sazonal em centesimos: 140 = 1,40x. Sempre uma proposta, nunca aplicado sozinho. */
	seasonal_factor: integer("seasonal_factor").notNull(),
	identity: text("identity").notNull(),
	rationale: text("rationale").notNull(),
	critique: text("critique"),
	sources: jsonb("sources").$type<{ title: string; url: string }[]>().notNull(),
	/** false quando a busca na web nao estava disponivel e o parecer saiu so do modelo. */
	grounded: boolean("grounded").notNull().default(true),
	context_snapshot: jsonb("context_snapshot")
		.$type<{ demand_rate_per_day: number; days_of_autonomy: number | null; needed_quantity: number }>()
		.notNull(),
	model: text("model").notNull(),
	created_at: timestamp("created_at").notNull().defaultNow(),
	updated_at: timestamp("updated_at").notNull().defaultNow(),
})

export const productInsightsRelations = relations(productInsights, ({ one }) => ({
	product: one(products, {
		fields: [productInsights.product_id],
		references: [products.id],
	}),
}))

export const shipmentAccountsRelations = relations(shipmentAccounts, ({ many }) => ({
	shipments: many(shipments),
}))

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
	account: one(shipmentAccounts, {
		fields: [shipments.account_id],
		references: [shipmentAccounts.id],
	}),
	items: many(shipmentItems),
}))

export const shipmentItemsRelations = relations(shipmentItems, ({ one }) => ({
	shipment: one(shipments, {
		fields: [shipmentItems.shipment_id],
		references: [shipments.id],
	}),
	product: one(products, {
		fields: [shipmentItems.product_id],
		references: [products.id],
	}),
	sourceStock: one(stocks, {
		fields: [shipmentItems.source_stock_id],
		references: [stocks.id],
	}),
	destinationStock: one(stocks, {
		fields: [shipmentItems.destination_stock_id],
		references: [stocks.id],
	}),
}))
