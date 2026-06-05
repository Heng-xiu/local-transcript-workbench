import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { WorkbenchLayout } from "@/components/layout/WorkbenchLayout";
import { useProjectQuery, useProjectsQuery } from "@/features/projects/queries";
import type { Project } from "@/features/projects/types";

/**
 * Selection lives in the URL (TanStack Router search params) so the workbench
 * is deep-linkable and back/forward navigable.
 */
const searchSchema = z.object({
	projectId: z.string().optional().catch(undefined),
	transcriptId: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/")({
	validateSearch: (search) => searchSchema.parse(search),
	component: WorkbenchRoute,
});

function WorkbenchRoute() {
	const { projectId, transcriptId } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const projectsQuery = useProjectsQuery();
	const activeProjectQuery = useProjectQuery(projectId);

	function selectProject(project: Project) {
		void navigate({
			search: { projectId: project.id, transcriptId: project.transcriptId },
		});
	}

	// Open the most recently updated project on first load for a useful landing.
	useEffect(() => {
		if (projectId || !projectsQuery.data?.length) return;
		const first = [...projectsQuery.data].sort(
			(a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
		)[0];
		void navigate({
			search: { projectId: first.id, transcriptId: first.transcriptId },
			replace: true,
		});
	}, [projectId, projectsQuery.data, navigate]);

	return (
		<WorkbenchLayout
			selectedProjectId={projectId}
			transcriptId={transcriptId}
			activeProject={activeProjectQuery.data}
			onSelectProject={selectProject}
		/>
	);
}
