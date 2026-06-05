import {
	TRANSCRIPT_STATUS_LABELS,
	type TranscriptStatus,
} from "@/features/transcripts/types";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<TranscriptStatus, string> = {
	processing:
		"bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
	ready_for_edit:
		"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
	failed: "bg-destructive/10 text-destructive ring-destructive/20",
};

export function TranscriptStatusBadge({
	status,
}: {
	status: TranscriptStatus;
}) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset",
				STATUS_CLASSES[status],
			)}
		>
			{status === "processing" ? (
				<span className="size-1.5 animate-pulse rounded-full bg-current" />
			) : null}
			{TRANSCRIPT_STATUS_LABELS[status]}
		</span>
	);
}
