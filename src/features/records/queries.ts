import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { ExportFormat } from "@/features/export/types";
import { meetingKeys } from "@/features/meetings/queries";
import { transcriptKeys } from "@/features/transcripts/queries";
import { api } from "@/lib/api";
import { downloadBlob } from "@/lib/utils/download";
import type { MeetingRecord } from "./types";

export const recordKeys = {
	all: ["records"] as const,
	list: () => [...recordKeys.all, "list"] as const,
	detail: (recordId: string) =>
		[...recordKeys.all, "detail", recordId] as const,
};

export function recordsQueryOptions() {
	return queryOptions({
		queryKey: recordKeys.list(),
		queryFn: () => api.listMeetingRecords(),
	});
}

export function recordQueryOptions(recordId: string) {
	return queryOptions({
		queryKey: recordKeys.detail(recordId),
		queryFn: () => api.getMeetingRecord(recordId),
	});
}

export function useMeetingRecordsQuery() {
	return useQuery(recordsQueryOptions());
}

export function useMeetingRecordQuery(recordId: string | undefined) {
	return useQuery({
		...recordQueryOptions(recordId ?? ""),
		enabled: Boolean(recordId),
	});
}

/**
 * Generation runs as a (mock) backend job; `mutation.isPending` drives the
 * waiting state and `mutation.isError` the retry state. On success the record
 * caches are patched so the detail + sidebar reflect the new status/markdown.
 */
export function useGenerateMeetingRecordMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { transcriptId: string; templateId: string }) =>
			api.generateMeetingRecord(input.transcriptId, input.templateId),
		onSuccess: (record: MeetingRecord) => {
			queryClient.setQueryData(recordKeys.detail(record.id), record);
			void queryClient.invalidateQueries({ queryKey: recordKeys.list() });
			void queryClient.invalidateQueries({ queryKey: meetingKeys.all });
			void queryClient.invalidateQueries({ queryKey: transcriptKeys.all });
		},
	});
}

/**
 * Export a record as Markdown or DOCX. The produced blob is downloaded
 * immediately (real DOCX in the browser); the record caches are then refreshed
 * so its status flips to `exported`.
 */
export function useExportMeetingRecordMutation(recordId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (format: ExportFormat) => {
			if (!recordId) throw new Error("No record selected to export.");
			return api.exportMeetingRecord(recordId, format);
		},
		onSuccess: (result) => {
			downloadBlob(result.filename, result.blob);
			if (recordId) {
				void queryClient.invalidateQueries({
					queryKey: recordKeys.detail(recordId),
				});
			}
			void queryClient.invalidateQueries({ queryKey: recordKeys.list() });
		},
	});
}
