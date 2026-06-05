import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const transcriptKeys = {
	all: ["transcripts"] as const,
	detail: (transcriptId: string) =>
		[...transcriptKeys.all, "detail", transcriptId] as const,
	audio: (transcriptId: string) =>
		[...transcriptKeys.all, "audio", transcriptId] as const,
};

export function transcriptQueryOptions(transcriptId: string) {
	return queryOptions({
		queryKey: transcriptKeys.detail(transcriptId),
		queryFn: () => api.getTranscript(transcriptId),
	});
}

export function useTranscriptQuery(transcriptId: string | undefined) {
	return useQuery({
		...transcriptQueryOptions(transcriptId ?? ""),
		enabled: Boolean(transcriptId),
	});
}
