import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

const DATABASE_URL =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@localhost:5432/analise_de_valores"

export const client = postgres(DATABASE_URL)
export const db = drizzle({ client })
