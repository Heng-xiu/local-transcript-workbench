import {
	PROJECT_STATUS_LABELS,
	type ProjectStatus,
} from "@/features/projects/types";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<ProjectStatus, string> = {
	recording: "bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20",
	processing:
		"bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
	ready:
		"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
	archived: "bg-muted text-muted-foreground ring-border",
	error: "bg-destructive/10 text-destructive ring-destructive/20",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset",
				STATUS_CLASSES[status],
			)}
		>
			{status === "recording" ? (
				<span className="size-1.5 animate-pulse rounded-full bg-current" />
			) : null}
			{PROJECT_STATUS_LABELS[status]}
		</span>
	);
}
