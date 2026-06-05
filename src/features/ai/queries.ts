import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { api } from "@/lib/api";
import type { GenerateOutputInput } from "@/lib/api/types";

export const aiKeys = {
	all: ["ai"] as const,
	templates: () => [...aiKeys.all, "templates"] as const,
};

export function templatesQueryOptions() {
	return queryOptions({
		queryKey: aiKeys.templates(),
		queryFn: () => api.listTemplates(),
		staleTime: Number.POSITIVE_INFINITY, // templates are static metadata
	});
}

export function useTemplatesQuery() {
	return useQuery(templatesQueryOptions());
}

/**
 * Generation mutation. The mock backend streams Markdown chunks through
 * `onToken`; the component uses that to render a live "typing" preview while
 * `mutation.isPending` drives the loading state. The final `GeneratedOutput`
 * is the source of truth on success.
 */
export function useGenerateOutputMutation(options?: {
	onToken?: (chunk: string, fullText: string) => void;
}) {
	const onTokenRef = useRef(options?.onToken);
	onTokenRef.current = options?.onToken;
	return useMutation({
		mutationFn: (input: GenerateOutputInput) =>
			api.generateOutput(input, {
				onToken: (chunk, full) => onTokenRef.current?.(chunk, full),
			}),
	});
}
