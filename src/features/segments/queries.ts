import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UpdateSegmentInput } from "@/lib/api/types";
import type { TranscriptSegment } from "./types";

export const segmentKeys = {
	all: ["segments"] as const,
	list: (transcriptId: string) =>
		[...segmentKeys.all, "list", transcriptId] as const,
};

export function segmentsQueryOptions(transcriptId: string) {
	return queryOptions({
		queryKey: segmentKeys.list(transcriptId),
		queryFn: () => api.listSegments(transcriptId),
	});
}

export function useSegmentsQuery(transcriptId: string | undefined) {
	return useQuery({
		...segmentsQueryOptions(transcriptId ?? ""),
		enabled: Boolean(transcriptId),
	});
}

/**
 * Low-level save mutation. On success it patches the cached segment list so the
 * virtual list, revision, and confidence stay in sync without a refetch. The
 * autosave hook layers debounce/blur/retry and status transitions on top.
 */
export function useUpdateSegmentMutation(transcriptId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: UpdateSegmentInput) => api.updateSegment(input),
		onSuccess: (updated) => {
			queryClient.setQueryData<TranscriptSegment[]>(
				segmentKeys.list(transcriptId),
				(prev) => prev?.map((s) => (s.id === updated.id ? updated : s)) ?? prev,
			);
		},
	});
}
