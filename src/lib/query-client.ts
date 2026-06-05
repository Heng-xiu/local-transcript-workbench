import { QueryClient } from "@tanstack/react-query";

/**
 * Shared QueryClient factory. Defaults are tuned for a local-first workbench:
 * data is fairly stable within a session, window-focus refetches are noise, and
 * reads retry once while mutations never auto-retry (the editor owns retry UX).
 */
export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				gcTime: 5 * 60_000,
				retry: 1,
				refetchOnWindowFocus: false,
			},
			mutations: {
				retry: 0,
			},
		},
	});
}
