import { db } from "../db/connection.js"
import { user, account } from "../db/schema.js"
import { hashPassword } from "better-auth/crypto"

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
		console.error("Uso: tsx src/scripts/create-admin.ts --email admin@example.com --password secretpassword [--name Admin]")
		process.exit(1)
	}

	const hashedPassword = await hashPassword(password)

	const userId = crypto.randomUUID()

	await db.insert(user).values({
		id: userId,
		name,
		email,
		emailVerified: true,
	})

	await db.insert(account).values({
		id: crypto.randomUUID(),
		accountId: email,
		providerId: "credential",
		userId,
		password: hashedPassword,
	})

	console.log(`Admin criado com sucesso!`)
	console.log(`  Email: ${email}`)
	console.log(`  Name: ${name}`)
	process.exit(0)
}

createAdmin().catch((err) => {
	console.error("Erro ao criar admin:", err)
	process.exit(1)
})