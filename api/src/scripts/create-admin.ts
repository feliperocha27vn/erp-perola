import { db } from "../db/connection.js"
import { user, account } from "../db/schema.js"
import { hashPassword } from "better-auth/crypto"
import { eq } from "drizzle-orm"

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
		console.error("Uso: node dist/scripts/create-admin.js --email admin@example.com --password secretpassword [--name Admin]")
		process.exit(1)
	}

	const existingUser = await db.select().from(user).where(eq(user.email, email))

	if (existingUser.length > 0) {
		const userId = existingUser[0].id
		await db.delete(account).where(eq(account.userId, userId))
		await db.delete(user).where(eq(user.id, userId))
		console.log(`Usuario existente removido: ${email}`)
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
		providerId: "password",
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