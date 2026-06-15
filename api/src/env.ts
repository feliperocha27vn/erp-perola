import { resolve } from "node:path"
import { config } from "dotenv"
import z from "zod"

const envSchema = z.object({
	PORT: z.coerce.number().default(3333),
	HOST: z.string().default("0.0.0.0"),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	CORS_ORIGINS: z.string().optional(),
	GEMINI_API_KEY: z.string().optional(),
	DATABASE_URL: z.string().optional(),
	BETTER_AUTH_SECRET: z
		.string()
		.min(1)
		.default("dev-secret-change-in-production-min-32-chars"),
})

type EnvInput = Record<string, string | undefined>

export function createEnv(
	processEnv: EnvInput = process.env,
	cwd = process.cwd(),
) {
	config({
		path: resolve(cwd, ".env"),
		processEnv,
		quiet: true,
	})

	return envSchema.parse(processEnv)
}

export const env = createEnv()
