import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const projectKeys = {
	all: ["projects"] as const,
	list: () => [...projectKeys.all, "list"] as const,
	detail: (projectId: string) =>
		[...projectKeys.all, "detail", projectId] as const,
};

export function projectsQueryOptions() {
	return queryOptions({
		queryKey: projectKeys.list(),
		queryFn: () => api.listProjects(),
	});
}

export function projectQueryOptions(projectId: string) {
	return queryOptions({
		queryKey: projectKeys.detail(projectId),
		queryFn: () => api.getProject(projectId),
	});
}

export function useProjectsQuery() {
	return useQuery(projectsQueryOptions());
}

export function useProjectQuery(projectId: string | undefined) {
	return useQuery({
		...projectQueryOptions(projectId ?? ""),
		enabled: Boolean(projectId),
	});
}
