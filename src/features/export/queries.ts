import { useMutation } from "@tanstack/react-query";
import type { ExportRequest } from "@/features/export/types";
import { api } from "@/lib/api";
import { downloadBlob } from "@/lib/utils/download";

/**
 * Export job state lives in this mutation. On success the produced blob is
 * downloaded immediately. Swapping to a backend export endpoint is transparent:
 * `api.exportOutput` is the only thing that changes.
 */
export function useExportMutation() {
	return useMutation({
		mutationFn: (request: ExportRequest) => api.exportOutput(request),
		onSuccess: (result) => {
			downloadBlob(result.filename, result.blob);
		},
	});
}
