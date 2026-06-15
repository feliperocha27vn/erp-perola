import { resolve } from "node:path"
import { config } from "dotenv"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { db } from "../../db/connection.js"

config({
	path: resolve(process.cwd(), ".env"),
	quiet: true,
})

process.env.NODE_ENV = "test"
process.env.DATABASE_URL =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@localhost:5432/analise_de_valores_test"
process.env.BETTER_AUTH_SECRET =
	process.env.BETTER_AUTH_SECRET ||
	"dev-secret-change-in-production-min-32-chars"
process.env.BETTER_AUTH_URL =
	process.env.BETTER_AUTH_URL || "http://localhost:3333"

async function runMigrations() {
	await migrate(db, { migrationsFolder: "./drizzle" })
}

await runMigrations()
