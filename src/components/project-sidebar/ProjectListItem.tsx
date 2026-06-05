import { Clock, Timer } from "lucide-react";
import { memo } from "react";
import type { Project } from "@/features/projects/types";
import { cn } from "@/lib/utils";
import { formatDuration, formatRelativeTime } from "@/lib/utils/time";
import { ProjectStatusBadge } from "./ProjectStatusBadge";

interface ProjectListItemProps {
	project: Project;
	selected: boolean;
	onSelect: (project: Project) => void;
}

function ProjectListItemImpl({
	project,
	selected,
	onSelect,
}: ProjectListItemProps) {
	return (
		<button
			type="button"
			onClick={() => onSelect(project)}
			aria-current={selected ? "true" : undefined}
			className={cn(
				"flex w-full flex-col gap-1.5 rounded-md border border-transparent px-3 py-2.5 text-left transition-colors",
				"hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				selected && "border-border bg-accent",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<span className="line-clamp-2 text-sm font-medium leading-snug">
					{project.name}
				</span>
				<ProjectStatusBadge status={project.status} />
			</div>
			<div className="flex items-center gap-3 text-xs text-muted-foreground">
				<span className="inline-flex items-center gap-1">
					<Clock className="size-3" />
					{formatRelativeTime(project.updatedAt)}
				</span>
				<span className="inline-flex items-center gap-1 tabular-nums">
					<Timer className="size-3" />
					{formatDuration(project.durationSec)}
				</span>
			</div>
		</button>
	);
}

export const ProjectListItem = memo(ProjectListItemImpl);
