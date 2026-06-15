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
import { env } from "./env.js"
import { authRoutes } from "./http/controllers/auth/routes.js"
import { brandsRoutes } from "./http/controllers/brands/routes.js"
import { fbaRoutes } from "./http/controllers/fba/routes.js"
import { dashboardRoutes } from "./http/controllers/metrics/routes.js"
import { productsRoutes } from "./http/controllers/products/routes.js"
import { salesRoutes } from "./http/controllers/sales/routes.js"
import { stocksRoutes } from "./http/controllers/stocks/routes.js"
import { storesRoutes } from "./http/controllers/stores/routes.js"
import { verifyAuth } from "./http/middlewares/verify-auth.js"
import "./types.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function buildApp() {
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

	const app = fastify({
		logger: loggerConfig,
	}).withTypeProvider<ZodTypeProvider>()

	app.setValidatorCompiler(validatorCompiler)
	app.setSerializerCompiler(serializerCompiler)

	const corsOrigins = env.CORS_ORIGINS
		? env.CORS_ORIGINS.split(",")
				.map((origin) => origin.trim())
				.filter(Boolean)
		: []

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
		credentials: true,
	})

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

	app.get("/health", async () => {
		return { status: "ok", timestamp: new Date().toISOString() }
	})

	await app.register(authRoutes)

	app.addHook("onRequest", verifyAuth)

	await app.register(productsRoutes)
	await app.register(brandsRoutes)
	await app.register(storesRoutes)
	await app.register(dashboardRoutes)
	await app.register(salesRoutes)
	await app.register(stocksRoutes)
	await app.register(fbaRoutes)

	if (env.NODE_ENV === "production") {
		const webDistPath = path.join(__dirname, "../web")

		app.register(fastifyStatic, {
			root: webDistPath,
			prefix: "/",
			maxAge: "30d",
			immutable: true,
		})

		app.setNotFoundHandler((_request, reply) => {
			return reply.sendFile("index.html", { maxAge: 0, immutable: false })
		})
	}

	await app.ready()

	return app
}
