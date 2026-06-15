import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ContextSidebarProps {
	title: string;
	/** Optional item count shown as a pill next to the title. */
	count?: number;
	/** Optional one-line subtitle under the title. */
	description?: string;
	/** Optional control rendered at the right of the header (e.g. a "+" button). */
	action?: ReactNode;
	children: ReactNode;
}

/**
 * Section-specific data sidebar shell (the middle "context" column). Provides a
 * consistent header + scroll area for the Meetings / Transcripts / Records /
 * Settings lists. Visually distinct from the global navigation rail.
 */
export function ContextSidebar({
	title,
	count,
	description,
	action,
	children,
}: ContextSidebarProps) {
	return (
		<aside className="flex h-full min-h-0 flex-col border-r bg-sidebar text-sidebar-foreground">
			<div className="border-b px-3 py-3">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold">{title}</h2>
					<div className="flex items-center gap-2">
						{typeof count === "number" ? (
							<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
								{count}
							</span>
						) : null}
						{action}
					</div>
				</div>
				{description ? (
					<p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
				) : null}
			</div>
			<ScrollArea className="min-h-0 flex-1">
				<div className="flex flex-col gap-1 p-2">{children}</div>
			</ScrollArea>
		</aside>
	);
}
