import { Check, Copy, Download, FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ExportStatus } from "@/features/export/types";
import { useExportMeetingRecordMutation } from "@/features/records/queries";
import type { MeetingRecord } from "@/features/records/types";
import { copyToClipboard } from "@/lib/utils/clipboard";

/**
 * Export actions for a meeting record: copy Markdown, export Markdown, export
 * DOCX. DOCX is produced for real in the browser. The export lifecycle is
 * surfaced as a simple {@link ExportStatus}.
 */
export function RecordExportControls({ record }: { record: MeetingRecord }) {
	const exportMutation = useExportMeetingRecordMutation(record.id);
	const [copied, setCopied] = useState(false);

	const pendingFormat = exportMutation.isPending
		? exportMutation.variables
		: undefined;
	const exportStatus: ExportStatus = exportMutation.isPending
		? "exporting"
		: exportMutation.isError
			? "failed"
			: exportMutation.isSuccess
				? "exported"
				: "idle";

	const hasContent = Boolean(record.markdown);

	async function handleCopy() {
		if (!record.markdown) return;
		const ok = await copyToClipboard(record.markdown);
		if (ok) {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	}

	return (
		<div className="flex flex-col gap-2 border-t bg-card p-4">
			<div className="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleCopy}
					disabled={!hasContent}
				>
					{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
					{copied ? "Copied" : "Copy Markdown"}
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => exportMutation.mutate("markdown")}
					disabled={!hasContent || exportMutation.isPending}
				>
					{pendingFormat === "markdown" ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<FileDown className="size-4" />
					)}
					Export Markdown
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={() => exportMutation.mutate("docx")}
					disabled={!hasContent || exportMutation.isPending}
				>
					{pendingFormat === "docx" ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Download className="size-4" />
					)}
					Export DOCX
				</Button>
			</div>
			{exportStatus === "exporting" ? (
				<p className="text-xs text-muted-foreground">Exporting…</p>
			) : exportStatus === "failed" ? (
				<p className="text-xs text-destructive">
					Export failed. Please try again.
				</p>
			) : exportStatus === "exported" && exportMutation.data ? (
				<p className="text-xs text-emerald-600 dark:text-emerald-400">
					Downloaded {exportMutation.data.filename}
				</p>
			) : null}
		</div>
	);
}
