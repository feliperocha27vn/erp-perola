import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
		include: ["src/**/*.e2e.spec.ts"],
		setupFiles: ["src/tests/e2e/setup.ts"],
		fileParallelism: false,
	},
})
