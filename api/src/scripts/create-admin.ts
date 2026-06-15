import { eq } from "drizzle-orm"
import { auth } from "../auth.js"
import { db } from "../db/connection.js"
import { account, user } from "../db/schema.js"

async function createAdmin() {
	const args = process.argv.slice(2)
	let email = ""
	let password = ""
	let name = "Admin"

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--email" && args[i + 1]) email = args[++i]
		if (args[i] === "--password" && args[i + 1]) password = args[++i]
		if (args[i] === "--name" && args[i + 1]) name = args[++i]
	}

	if (!email || !password) {
		console.error(
			"Uso: node dist/scripts/create-admin.js --email admin@example.com --password secretpassword [--name Admin]",
		)
		process.exit(1)
	}

	const existing = await db.select().from(user).where(eq(user.email, email))
	if (existing.length > 0) {
		await db.delete(account).where(eq(account.userId, existing[0].id))
		await db.delete(user).where(eq(user.id, existing[0].id))
		console.log(`Usuario existente removido: ${email}`)
	}

	const res = await auth.api.signUpEmail({
		body: {
			email,
			password,
			name,
		},
	})

	console.log("Admin criado com sucesso!")
	console.log(`  Email: ${email}`)
	console.log(`  Name: ${name}`)
	console.log(`  User ID: ${res.user.id}`)
	process.exit(0)
}

createAdmin().catch((err) => {
	console.error("Erro ao criar admin:", err?.body || err?.message || err)
	process.exit(1)
})
