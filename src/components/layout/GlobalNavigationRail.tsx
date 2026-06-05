import { FileCheck2, FileText, Settings, Video } from "lucide-react";
import type { ComponentType } from "react";
import {
	NAVIGATION_SECTIONS,
	type NavigationSection,
} from "@/features/navigation/types";
import { cn } from "@/lib/utils";

const SECTION_ICONS: Record<
	NavigationSection,
	ComponentType<{ className?: string }>
> = {
	meetings: Video,
	transcripts: FileText,
	records: FileCheck2,
	settings: Settings,
};

interface GlobalNavigationRailProps {
	section: NavigationSection;
	onSelect: (section: NavigationSection) => void;
}

/**
 * Leftmost app-level navigation rail. Deliberately compact (~64px) and visually
 * distinct from the data sidebars: it selects the top-level workflow section,
 * not a piece of data. Keyboard-accessible buttons with `aria-current` state.
 */
export function GlobalNavigationRail({
	section,
	onSelect,
}: GlobalNavigationRailProps) {
	return (
		<nav
			aria-label="Primary"
			className="flex w-16 shrink-0 flex-col items-center gap-1 border-r bg-sidebar py-3"
		>
			{NAVIGATION_SECTIONS.map((item) => {
				const Icon = SECTION_ICONS[item.id];
				const active = item.id === section;
				return (
					<button
						key={item.id}
						type="button"
						onClick={() => onSelect(item.id)}
						aria-current={active ? "page" : undefined}
						title={item.description}
						className={cn(
							"group relative flex w-14 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition-colors",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							active
								? "bg-primary/10 text-primary"
								: "text-muted-foreground hover:bg-accent hover:text-foreground",
						)}
					>
						<span
							className={cn(
								"absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity",
								active ? "opacity-100" : "opacity-0",
							)}
							aria-hidden
						/>
						<Icon className="size-5" />
						{item.label}
					</button>
				);
			})}
		</nav>
	);
}
