import { authClient } from "./auth-client"

export function useAuth() {
	const { data, isPending, error } = authClient.useSession()

	return {
		user: data?.user ?? null,
		session: data?.session ?? null,
		isLoading: isPending,
		isAuthenticated: !!data?.user,
		error,
	}
}