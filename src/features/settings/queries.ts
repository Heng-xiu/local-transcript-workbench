import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const settingsKeys = {
	all: ["settings"] as const,
	integrations: () => [...settingsKeys.all, "integrations"] as const,
	storage: () => [...settingsKeys.all, "storage"] as const,
};

export function integrationStatusesQueryOptions() {
	return queryOptions({
		queryKey: settingsKeys.integrations(),
		queryFn: () => api.getIntegrationStatuses(),
		staleTime: Number.POSITIVE_INFINITY, // derived from static env config
	});
}

export function storageStatusQueryOptions() {
	return queryOptions({
		queryKey: settingsKeys.storage(),
		queryFn: () => api.getStorageStatus(),
	});
}

export function useIntegrationStatusesQuery() {
	return useQuery(integrationStatusesQueryOptions());
}

export function useStorageStatusQuery() {
	return useQuery(storageStatusQueryOptions());
}
