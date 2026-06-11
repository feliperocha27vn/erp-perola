import { migrate } from "drizzle-orm/postgres-js/migrator"
import { client, db } from "./connection.js"

async function runMigrations() {
	console.log("Running database migrations...")
	await migrate(db, { migrationsFolder: "./drizzle" })
	console.log("Migrations applied successfully.")
	await client.end()
}

runMigrations()
	.then(() => {
		process.exit(0)
	})
	.catch((error) => {
		console.error("Migration failed:", error)
		process.exit(1)
	})
