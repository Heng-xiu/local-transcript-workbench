import {
	MEETING_RECORD_STATUS_LABELS,
	type MeetingRecordStatus,
} from "@/features/records/types";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<MeetingRecordStatus, string> = {
	not_started: "bg-muted text-muted-foreground ring-border",
	generating:
		"bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
	ready:
		"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
	failed: "bg-destructive/10 text-destructive ring-destructive/20",
	exported:
		"bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20",
};

export function RecordStatusBadge({ status }: { status: MeetingRecordStatus }) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset",
				STATUS_CLASSES[status],
			)}
		>
			{status === "generating" ? (
				<span className="size-1.5 animate-pulse rounded-full bg-current" />
			) : null}
			{MEETING_RECORD_STATUS_LABELS[status]}
		</span>
	);
}
