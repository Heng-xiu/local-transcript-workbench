import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectsQuery } from "@/features/projects/queries";
import type { Project } from "@/features/projects/types";
import { ProjectListItem } from "./ProjectListItem";

interface ProjectSidebarProps {
	selectedProjectId: string | undefined;
	onSelect: (project: Project) => void;
}

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

export function ProjectSidebar({
	selectedProjectId,
	onSelect,
}: ProjectSidebarProps) {
	const { data, isPending, isError } = useProjectsQuery();

	const projects = useMemo(
		() =>
			[...(data ?? [])].sort(
				(a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
			),
		[data],
	);

	return (
		<aside className="flex h-full min-h-0 flex-col border-r bg-sidebar text-sidebar-foreground">
			<div className="flex items-center justify-between px-3 py-3">
				<h2 className="text-sm font-semibold">Projects</h2>
				{data ? (
					<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
						{projects.length}
					</span>
				) : null}
			</div>

			<ScrollArea className="min-h-0 flex-1">
				<div className="flex flex-col gap-1 px-2 pb-3">
					{isPending ? (
						SKELETON_KEYS.map((key) => (
							<Skeleton key={key} className="h-16 w-full rounded-md" />
						))
					) : isError ? (
						<p className="px-3 py-6 text-sm text-destructive">
							Failed to load projects.
						</p>
					) : projects.length === 0 ? (
						<p className="px-3 py-6 text-sm text-muted-foreground">
							No projects yet.
						</p>
					) : (
						projects.map((project) => (
							<ProjectListItem
								key={project.id}
								project={project}
								selected={project.id === selectedProjectId}
								onSelect={onSelect}
							/>
						))
					)}
				</div>
			</ScrollArea>
		</aside>
	);
}
