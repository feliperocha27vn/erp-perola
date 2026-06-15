import type { FastifyInstance } from "fastify"
import { buildApp } from "../../../app.js"

export async function makeTestApp(): Promise<FastifyInstance> {
	return buildApp()
}
