import path from "node:path"
import { fileURLToPath } from "node:url"
import fastifyCors from "@fastify/cors"
import fastifyStatic from "@fastify/static"
import fastifySwagger from "@fastify/swagger"
import scalarApiReference from "@scalar/fastify-api-reference"
import fastify from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod"
import { db } from "./db/connection.js"
import { env } from "./env.js"
import { makeAnalyzeFbaCsvUseCase } from "./factories/fba/make-analyze-fba-csv-use-case.js"
import { brandsRoutes } from "./http/controllers/brands/routes.js"
import { fbaRoutes } from "./http/controllers/fba/routes.js"
import { metricsRoutes } from "./http/controllers/metrics/routes.js"
import { productsRoutes } from "./http/controllers/products/routes.js"
import { salesRoutes } from "./http/controllers/sales/routes.js"
import { stocksRoutes } from "./http/controllers/stocks/routes.js"
import { storesRoutes } from "./http/controllers/stores/routes.js"
import "./types.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const loggerConfig =
	env.NODE_ENV === "production"
		? { level: "info" }
		: {
				level: "info",
				transport: {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "HH:MM:ss",
						ignore: "pid,hostname",
					},
				},
			}

export const app = fastify({
	logger: loggerConfig,
}).withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

const corsOrigins = env.CORS_ORIGINS
	? env.CORS_ORIGINS.split(",")
			.map((origin) => origin.trim())
			.filter(Boolean)
	: []

// CORS para permitir requisições do frontend
await app.register(fastifyCors, {
	origin:
		corsOrigins.length > 0
			? (origin, cb) => {
					if (!origin || corsOrigins.includes(origin)) {
						cb(null, true)
						return
					}

					cb(new Error("Not allowed by CORS"), false)
				}
			: true,
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
})

// Registra a instância do banco como decorator
app.decorate("db", db)
app.decorate("analyzeFbaCsvUseCase", makeAnalyzeFbaCsvUseCase())

await app.register(fastifySwagger, {
	openapi: {
		info: {
			title: "Análise de Valores API",
			description: "API para busca e análise de valores de produtos",
			version: "1.0.0",
		},
	},
	transform: jsonSchemaTransform,
})

await app.register(scalarApiReference, {
	routePrefix: "/docs",
	configuration: {
		title: "Análise de Valores API",
	},
})

// Health check endpoint
app.get("/health", async () => {
	return { status: "ok", timestamp: new Date().toISOString() }
})

// Registra as rotas da API
await app.register(productsRoutes)
await app.register(brandsRoutes)
await app.register(storesRoutes)
await app.register(metricsRoutes)
await app.register(salesRoutes)
await app.register(stocksRoutes)
await app.register(fbaRoutes)

// Serve arquivos estáticos do frontend (produção)
if (env.NODE_ENV === "production") {
	const webDistPath = path.join(__dirname, "../../web")

	app.register(fastifyStatic, {
		root: webDistPath,
		prefix: "/",
		wildcard: false,
		maxAge: "30d",
		immutable: true,
	})

	// SPA fallback: rotas não-estáticas retornam index.html
	app.setNotFoundHandler((_request, reply) => {
		return reply.sendFile("index.html", { maxAge: 0, immutable: false })
	})
}
