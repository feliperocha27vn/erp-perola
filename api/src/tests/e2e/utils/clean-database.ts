import { db } from "../../../db/connection.js"

export async function cleanDatabase() {
	await db.execute(`
		TRUNCATE TABLE 
			sales, 
			stocks, 
			products, 
			brands, 
			stores, 
			session, 
			account, 
			verification, 
			"user"
		RESTART IDENTITY CASCADE
	`)
}
