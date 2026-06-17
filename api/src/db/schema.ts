import { relations } from "drizzle-orm"
import {
	boolean,
	index,
	integer,
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
	technical_subtitle: text("technical_subtitle"),
	technical_analysis: text("technical_analysis"),
	technical_movement: text("technical_movement"),
	technical_case_and_crystal: text("technical_case_and_crystal"),
	technical_specific_functionality: text("technical_specific_functionality"),
	technical_dial_and_luminosity: text("technical_dial_and_luminosity"),
	technical_bracelet_construction: text("technical_bracelet_construction"),
	technical_table: text("technical_table"),
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

export const stocksRelations = relations(stocks, ({ many, one }) => ({
	product: one(products, {
		fields: [stocks.product_id],
		references: [products.id],
	}),
	sales: many(sales),
}))

export const storesRelations = relations(stores, ({ many }) => ({
	sales: many(sales),
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
