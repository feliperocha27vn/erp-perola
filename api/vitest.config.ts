import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
		include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
		exclude: ["src/**/*.e2e.spec.ts", "node_modules", "dist"],
	},
})
