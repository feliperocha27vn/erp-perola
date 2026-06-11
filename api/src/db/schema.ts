import { relations } from "drizzle-orm"
import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const salesChannelEnum = pgEnum("sales_channel", ["Amazon", "Mercado Livre", "Shopee", "Direto"])

export const stores = pgTable("stores", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull().unique(),
	created_at: timestamp("created_at").notNull().defaultNow(),
	updated_at: timestamp("updated_at").notNull().defaultNow(),
})

export const brands = pgTable("brands", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull().unique(),
	created_at: timestamp("created_at").notNull().defaultNow(),
	updated_at: timestamp("updated_at").notNull().defaultNow(),
})

export const products = pgTable("products", {
	id: uuid("id").primaryKey().defaultRandom(),
	sku: text("sku").notNull().unique(),
	ean: text("ean").notNull().unique(),
	sale_price_cents: integer("sale_price_cents"),
	brand_id: uuid("brand_id").references(() => brands.id, { onDelete: "set null" }),
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
	store_id: uuid("store_id").references(() => stores.id, { onDelete: "set null" }),
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
