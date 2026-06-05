import { AlertCircle, Check, Loader2, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SegmentSaveStatus } from "@/features/segments/types";
import { cn } from "@/lib/utils";

interface SaveStatusBadgeProps {
	status: SegmentSaveStatus;
	onRetry?: () => void;
	className?: string;
}

/** Compact per-segment save indicator with a retry affordance on error. */
export function SaveStatusBadge({
	status,
	onRetry,
	className,
}: SaveStatusBadgeProps) {
	const base = cn(
		"inline-flex items-center gap-1 text-xs font-medium",
		className,
	);

	switch (status.state) {
		case "saving":
			return (
				<span className={cn(base, "text-muted-foreground")}>
					<Loader2 className="size-3 animate-spin" aria-hidden />
					Saving…
				</span>
			);
		case "saved":
			return (
				<span className={cn(base, "text-emerald-600 dark:text-emerald-400")}>
					<Check className="size-3" aria-hidden />
					Saved
				</span>
			);
		case "dirty":
			return (
				<span className={cn(base, "text-amber-600 dark:text-amber-400")}>
					<PencilLine className="size-3" aria-hidden />
					Unsaved
				</span>
			);
		case "error":
			return (
				<span className={cn(base, "text-destructive")}>
					<AlertCircle className="size-3" aria-hidden />
					<span title={status.error}>Save failed</span>
					{onRetry ? (
						<Button
							type="button"
							variant="link"
							size="xs"
							className="h-auto p-0 text-xs text-destructive underline"
							onClick={onRetry}
						>
							Retry
						</Button>
					) : null}
				</span>
			);
		default:
			return (
				<span className={cn(base, "text-muted-foreground/50")}>
					<span className="size-1.5 rounded-full bg-current" aria-hidden />
					<span className="sr-only">In sync</span>
				</span>
			);
	}
}
