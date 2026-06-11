import { writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { app } from "./app.js"
import { env } from "./env.js"

app
	.listen({
		port: env.PORT,
		host: env.HOST,
	})
	.then(() => {
		console.log("HTTP server running 🦅")
		console.log(
			`Documentation available at http://localhost:${env.PORT}/docs 💻`,
		)
	})

if (env.NODE_ENV === "development") {
	const specFile = resolve(process.cwd(), "swagger.json")

	app.ready().then(() => {
		const spec = JSON.stringify(app.swagger(), null, 2)

		writeFile(specFile, spec).then(() => {
			console.log("Swagger spec generated 📄")
		})
	})
}
