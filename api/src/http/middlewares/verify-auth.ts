import { fromNodeHeaders } from "better-auth/node"
import type { FastifyReply, FastifyRequest } from "fastify"
import { auth } from "../../auth.js"

function getPathname(url: string): string {
	try {
		return new URL(url, "http://localhost").pathname
	} catch {
		return url
	}
}

function isPublicPath(url: string): boolean {
	const pathname = getPathname(url)

	// Health check
	if (pathname === "/health") return true

	// Auth endpoints (login, logout, session, etc.)
	if (pathname.startsWith("/api/auth")) return true

	// API documentation
	if (pathname.startsWith("/docs")) return true
	if (pathname === "/documentation/json") return true
	if (pathname.startsWith("/documentation")) return true

	// SPA root and static assets (production)
	if (pathname === "/") return true
	if (pathname.lastIndexOf(".") > pathname.lastIndexOf("/")) return true

	return false
}

export async function verifyAuth(request: FastifyRequest, reply: FastifyReply) {
	if (isPublicPath(request.url)) return

	const headers = fromNodeHeaders(request.headers)
	const req = new Request(`http://${request.headers.host}${request.url}`, {
		method: request.method,
		headers,
	})

	const session = await auth.api.getSession({
		headers: req.headers,
	})

	if (!session) {
		return reply.status(401).send({
			statusCode: 401,
			error: "Unauthorized",
			message: "Sessão expirada ou inválida. Faça login novamente.",
		})
	}

	request.user = {
		id: session.user.id,
		name: session.user.name,
		email: session.user.email,
		emailVerified: session.user.emailVerified,
		image: session.user.image ?? null,
		createdAt: session.user.createdAt,
		updatedAt: session.user.updatedAt,
	}
	request.session = {
		id: session.session.id,
		userId: session.session.userId,
		token: session.session.token,
		expiresAt: session.session.expiresAt,
		ipAddress: session.session.ipAddress ?? null,
		userAgent: session.session.userAgent ?? null,
		createdAt: session.session.createdAt,
		updatedAt: session.session.updatedAt,
	}
}
