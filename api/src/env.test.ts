import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { afterEach, describe, expect, it } from "vitest"
import { createEnv } from "./env.js"

const tempDirs: string[] = []

async function makeTempEnvFile(contents: string) {
	const dir = await mkdtemp(join(tmpdir(), "analise-env-"))
	tempDirs.push(dir)
	await writeFile(join(dir, ".env"), contents)
	return dir
}

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe("createEnv", () => {
	it("loads Gemini key from .env when missing from process env", async () => {
		const cwd = await makeTempEnvFile([
			"GEMINI_API_KEY=gemini-from-file",
		].join("\n"))

		const env = createEnv({}, cwd)

		expect(env.GEMINI_API_KEY).toBe("gemini-from-file")
	})

	it("preserves explicit process env values over .env values", async () => {
		const cwd = await makeTempEnvFile([
			"GEMINI_API_KEY=gemini-from-file",
		].join("\n"))

		const env = createEnv(
			{
				GEMINI_API_KEY: "gemini-from-process",
			},
			cwd,
		)

		expect(env.GEMINI_API_KEY).toBe("gemini-from-process")
	})
})