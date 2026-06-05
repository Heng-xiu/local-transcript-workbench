import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * LiveKit placeholder query. Returns connection metadata only; the MVP never
 * opens a real session. Real `livekit-client` wiring would slot in here.
 */
export const livekitKeys = {
	connection: (projectId: string) =>
		["livekit", "connection", projectId] as const,
};

export function livekitConnectionQueryOptions(projectId: string) {
	return queryOptions({
		queryKey: livekitKeys.connection(projectId),
		queryFn: () => api.getLiveKitConnection(projectId),
	});
}

export function useLiveKitConnectionQuery(projectId: string | undefined) {
	return useQuery({
		...livekitConnectionQueryOptions(projectId ?? ""),
		enabled: Boolean(projectId),
	});
}
