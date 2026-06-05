import {
	MEETING_STATUS_LABELS,
	type MeetingStatus,
} from "@/features/meetings/types";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<MeetingStatus, string> = {
	scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
	live: "bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20",
	ended: "bg-muted text-muted-foreground ring-border",
};

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset",
				STATUS_CLASSES[status],
			)}
		>
			{status === "live" ? (
				<span className="size-1.5 animate-pulse rounded-full bg-current" />
			) : null}
			{MEETING_STATUS_LABELS[status]}
		</span>
	);
}
