import { AIOutputPanel } from "@/components/ai-output/AIOutputPanel";
import { ProjectSidebar } from "@/components/project-sidebar/ProjectSidebar";
import { TranscriptWorkbench } from "@/components/transcript/TranscriptWorkbench";
import type { Project } from "@/features/projects/types";
import { AppHeader } from "./AppHeader";

interface WorkbenchLayoutProps {
	selectedProjectId: string | undefined;
	transcriptId: string | undefined;
	activeProject: Project | undefined;
	onSelectProject: (project: Project) => void;
}

/**
 * The three-panel workbench shell: project list · transcript editor · AI output.
 * URL state (projectId/transcriptId) is owned by the route and threaded in.
 */
export function WorkbenchLayout({
	selectedProjectId,
	transcriptId,
	activeProject,
	onSelectProject,
}: WorkbenchLayoutProps) {
	return (
		<div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
			<AppHeader project={activeProject} />
			<main className="grid min-h-0 flex-1 grid-cols-[18rem_minmax(0,1fr)_24rem]">
				<ProjectSidebar
					selectedProjectId={selectedProjectId}
					onSelect={onSelectProject}
				/>
				<section className="min-w-0 overflow-hidden">
					<TranscriptWorkbench transcriptId={transcriptId} />
				</section>
				<AIOutputPanel
					projectId={selectedProjectId}
					transcriptId={transcriptId}
				/>
			</main>
		</div>
	);
}
