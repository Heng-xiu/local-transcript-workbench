import type { IntegrationStatusState } from "@/features/settings/types";
import { cn } from "@/lib/utils";

const STATE_LABELS: Record<IntegrationStatusState, string> = {
	placeholder: "Placeholder",
	configured: "Configured",
	missing: "Missing",
	error: "Error",
};

const STATE_CLASSES: Record<IntegrationStatusState, string> = {
	placeholder: "bg-muted text-muted-foreground ring-border",
	configured:
		"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
	missing:
		"bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
	error: "bg-destructive/10 text-destructive ring-destructive/20",
};

export function SettingsStatusPill({
	status,
}: {
	status: IntegrationStatusState;
}) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset",
				STATE_CLASSES[status],
			)}
		>
			{STATE_LABELS[status]}
		</span>
	);
}
